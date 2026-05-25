import { LatLngType, PointType, SearchAreaType } from "./models";

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


// SQUARE TILING
// Base case: Start with 1 square that entirely envelopes the rectangle
// Then, split into 4 smaller squares of half (?) radius

type Rectangle = {
    topLeftPoint: PointType
    bottomRightPoint: PointType
}

function getCircles() {

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

export function generateTiles(point1: LatLngType, point2: LatLngType, zoom: number = 0): SearchAreaType[] {
    const { topLeft, bottomRight } = normalize(point1, point2);
    const topLeftPoint = getXYfromLatLon(topLeft);
    const bottomRightPoint = getXYfromLatLon(bottomRight);
    
    return subdivide({ topLeftPoint, bottomRightPoint }).flatMap(rect => subdivide(rect)).map(rect => {
        const sideLength = Math.max(rect.bottomRightPoint.x - rect.topLeftPoint.x, rect.bottomRightPoint.y - rect.topLeftPoint.y) / 2.0;
        
        const midpoint: PointType = {
            x: (rect.bottomRightPoint.x + rect.topLeftPoint.x) / 2.0,
            y: (rect.bottomRightPoint.y + rect.topLeftPoint.y) / 2.0
        }
        return {
            center: getLatLonFromXY(midpoint),
            radius: convertDistanceToMeters(sideLength, topLeft.lat) * Math.sqrt(2)
        }
    })
    
    // const sideLength = Math.max(rect.bottomRightPoint.x - rect.topLeftPoint.x, rect.bottomRightPoint.y - rect.topLeftPoint.y) / 2.0;
    // const midpoint: PointType = {
    //     x: (bottomRightPoint.x + topLeftPoint.x) / 2.0,
    //     y: (bottomRightPoint.y + topLeftPoint.y) / 2.0
    // }
    // return [
    //     {
    //         center: getLatLonFromXY(midpoint),
    //         radius: convertDistanceToMeters(sideLength, topLeft.lat) * Math.sqrt(2)
    //     },
    // ]
}
