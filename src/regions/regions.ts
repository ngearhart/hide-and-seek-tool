import type { FeatureCollection, GeoJsonProperties, Point, Position } from "geojson"
import type { LatLngTuple } from "leaflet";
import type { FeatureType } from "./features";

export type CustomProperty = GeoJsonProperties & {
    Name: string
    Type: FeatureType
    Description: string
}

export type Region = FeatureCollection<Point, CustomProperty> & {
    name: string
    size: string
    center: [number, number]
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
