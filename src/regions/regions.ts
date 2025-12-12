import type { GeoJSON, GeoJsonProperties, Geometry } from "geojson"

type CustomProperty = GeoJsonProperties & {
    Name: string
    Type: "Station" | "Airport" | "Museum" | "Theater" | "Hospital" | "Library" | "Zoo" | "Aquarium" | "Park"
    Description: string
}

export type Region = GeoJSON<Geometry, CustomProperty> & {
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
