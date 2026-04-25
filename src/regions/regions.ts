import type { FeatureCollection, GeoJsonProperties, Point, Position } from "geojson"
import type { LatLngTuple } from "leaflet";
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

export function generateVolonoi(region: Region): { [feature in FeatureType]?: Voronoi<Delaunay.Point> } {
    const result: { [feature in FeatureType]?: Voronoi<Delaunay.Point> } = {};
    Object.keys(colors).forEach(featureType => {
        // Note: This does the math in lat/lng - maybe should use projected coords instead
        const vertices = region.features.filter(feature => feature.properties.Type === featureType).map(feature => feature.geometry.coordinates as Delaunay.Point);
        const delaunay = Delaunay.from(vertices);
        result[featureType as FeatureType] = delaunay.voronoi([-360, -360, 360, 360]);
    });
    return result;
}
