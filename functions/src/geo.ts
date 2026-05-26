import { FeatureType, LatLngType, PointType, SearchAreaType, UpdateCallback } from "./models";

import * as logger from "firebase-functions/logger";

const ZOOM = 12;

function getXYfromLatLon(latLngPoint: LatLngType, zoom: number = ZOOM): PointType {
    const x = (latLngPoint.lng + 180) / 360 * 2 ** zoom;
    const y = (1 - Math.log( Math.tan(latLngPoint.lat * Math.PI/180) + 1.0/Math.cos(latLngPoint.lat* Math.PI/180) ) / Math.PI) / 2 * 2 ** zoom;
    return { x, y };
}

function getLatLonFromXY(point: PointType, zoom: number = ZOOM): LatLngType {
    const n = 2.0 ** zoom;
    const lon = point.x / n * 360.0 - 180.0;

    // Using the inverse Mercator projection formula
    const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * point.y / n)))
    const lat = lat_rad / (Math.PI / 180);
    
    return { lat: lat, lng: lon };
}

// Thanks to https://docs.here.com/intro-to-mapping-concepts/docs/tile-pixels
function convertDistanceToMeters(distance: number, latitude: number, zoom: number = ZOOM) {
    // return 40_075_016.686 * Math.cos(latitude) / 2.0 ** (zoom + 8) * distance * 256;
    return Math.cos(latitude * Math.PI / 180.0) * 38.219 * 256 * distance;
}


function normalize(point1: LatLngType, point2: LatLngType): { topLeft: LatLngType, bottomRight: LatLngType} {
    return {
        topLeft: {
            lat: Math.max(point1.lat, point2.lat),
            lng: Math.min(point1.lng, point2.lng)
        },
        bottomRight: {
            lat: Math.min(point1.lat, point2.lat),
            lng: Math.max(point1.lng, point2.lng)
        },
    }
}

function addToPoint(point: PointType, addX: number, addY: number): PointType {
    return {
        x: point.x + addX,
        y: point.y + addY
    }
}


// SQUARE TILING STACK
// Base case: Start with 1 square that entirely envelopes the rectangle
// Then, split into 4 smaller squares of half side length

type Rectangle = {
    topLeftPoint: PointType
    bottomRightPoint: PointType
}

function rectToCirle(rect: Rectangle): SearchAreaType {
    const sideLength = Math.max(rect.bottomRightPoint.x - rect.topLeftPoint.x, rect.bottomRightPoint.y - rect.topLeftPoint.y) / 2.0;
    const midpoint: PointType = {
        x: (rect.bottomRightPoint.x + rect.topLeftPoint.x) / 2.0,
        y: (rect.bottomRightPoint.y + rect.topLeftPoint.y) / 2.0
    }
    const center = getLatLonFromXY(midpoint);
    return {
        center: center,
        radius: convertDistanceToMeters(sideLength, center.lat) * Math.sqrt(2)
    }
}

function subdivide(r: Rectangle): Rectangle[] {
    const sideLength = Math.max(r.bottomRightPoint.x - r.topLeftPoint.x, r.bottomRightPoint.y - r.topLeftPoint.y) / 2.0;

    const midpoint: PointType = {
        x: (r.bottomRightPoint.x + r.topLeftPoint.x) / 2.0,
        y: (r.bottomRightPoint.y + r.topLeftPoint.y) / 2.0
    }

    return [
        {
            topLeftPoint: r.topLeftPoint,
            bottomRightPoint: midpoint 
        },
        {
            topLeftPoint: {
                x: r.topLeftPoint.x,
                y: midpoint.y
            },
            bottomRightPoint: {
                x: midpoint.x,
                y: r.bottomRightPoint.y
            } 
        },
        {
            topLeftPoint: {
                x: midpoint.x,
                y: r.topLeftPoint.y
            },
            bottomRightPoint: {
                x: r.bottomRightPoint.x,
                y: midpoint.y
            } 
        },
        {
            topLeftPoint: midpoint,
            bottomRightPoint: r.bottomRightPoint 
        }
    ]
}

function getPlacesInRectangleOrException(r: Rectangle, featureType: FeatureType): string[] {
    if (Math.random() < 0.2) {
        throw 'Random error';
    }
    return [];
}

export async function getPlaceIds(point1: LatLngType, point2: LatLngType, featureType: FeatureType, updateCallback?: (m: UpdateCallback) => Promise<void>): string[] {
    const { topLeft, bottomRight } = normalize(point1, point2);
    const overallRect: Rectangle = {
        topLeftPoint: getXYfromLatLon(topLeft),
        bottomRightPoint: getXYfromLatLon(bottomRight)
    };
    
    const areasToExplore: Rectangle[] = [overallRect];
    const exploredAreas: SearchAreaType[] = [];

    const placeIdsToReturn: string[] = [];

    while (areasToExplore.length > 0) {
        const currentRectangleToExplore = areasToExplore.pop()!;
        const equivalentCircle = rectToCirle(currentRectangleToExplore);
        try {
            if (updateCallback) {
                await updateCallback({
                    state: "searching",
                    visitedCircles: exploredAreas,
                    currentCircle: equivalentCircle
                })
            }
            placeIdsToReturn.push(...getPlacesInRectangleOrException(currentRectangleToExplore, featureType));
            exploredAreas.push(equivalentCircle);
        } catch {
            // Too big of a search area - subdivide
            areasToExplore.push(...subdivide(currentRectangleToExplore));
        }
    }
    return placeIdsToReturn;
}
