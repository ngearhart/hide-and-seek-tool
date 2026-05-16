import type { FeatureCollection, GeoJsonProperties, Point, Position } from "geojson"
import type { LatLng, LatLngTuple } from "leaflet";
import { colors, type FeatureType } from "./features";
import { Delaunay, type Voronoi } from "d3";

export type CustomProperty = GeoJsonProperties & {
    Name: string
    Type: FeatureType
    Description: string
}

export type Region = FeatureCollection<Point, CustomProperty> & {
    name: string
    size: string
    center: [number, number]
    bounds: [[number, number], [number, number]]
    hidingRadiusMiles: number
}

export async function loadRegion(regionName: string): Promise<Region> {
    const regionJson = await fetch(`/regions/${regionName}.geojson`).then((res) => res.json())
    console.log(`Loaded region ${regionName}`)
    return regionJson
}

export type RegionDescriptor = {
    name: string
    path: string
}

export async function loadRegionDescriptions(): Promise<RegionDescriptor[]> {
    // TODO: Remove this hard-code to "US"
    return fetch(`/regions.json`).then((res) => res.json()).then(json => json['us'])
}

export function flipCoords(coords: Position): LatLngTuple {
    return [coords[1], coords[0]];
}

type VoronoiDict = { [feature in FeatureType]?: Voronoi<Delaunay.Point> };

export function generateVoronoi(region: Region): VoronoiDict {
    return new Proxy({}, {
        get(target: VoronoiDict, key: FeatureType) {
            if (!(key in target)) {
                const vertices = region.features.filter(feature => feature.properties.Type === key).map(feature => feature.geometry.coordinates as Delaunay.Point);
                const points1 = 
                        vertices.map(point => [point[1], point[0]]).flat();
                const points = Float64Array.from(points1);
                const delaunay = new Delaunay(points);
                const topCorner = flipCoords(region.bounds[1]);
                const bottomCorner = flipCoords(region.bounds[0]);
                target[key] = delaunay.voronoi([
                    Math.min(topCorner[0], bottomCorner[0]),
                    Math.min(topCorner[1], bottomCorner[1]),
                    Math.max(bottomCorner[0], topCorner[0]),
                    Math.max(bottomCorner[1], topCorner[1])]);
            }
            return target[key];
        }
    });
}
