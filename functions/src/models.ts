
import { Feature, GeoJsonProperties, Point } from "geojson";
import { LatLngExpression } from "leaflet";
import * as z from "zod";

export type FeatureType = "station" | "airport" | "museum" | "theater" | "hospital" | "library" | "zoo" | "aquarium" | "graveyard" | "park" | "custom";
export const FeatureTypes: FeatureType[] = [
    "station",
    "airport",
    "museum",
    "theater",
    "hospital",
    "library",
    "zoo",
    "aquarium",
    "graveyard",
    "park",
    "custom"
];

export type DisplayName = {
    text: string
    languageCode: string
}

export type PlaceApiResponse = {
    location: LatLngExpression
    displayName: DisplayName
}

export type PlaceFirebaseEntry = {
    location: LatLngExpression
    name: string    
}

export function convertPlace(apiResponse: PlaceApiResponse): PlaceFirebaseEntry {
    return {
        location: apiResponse.location,
        name: apiResponse.displayName.text
    }
}

type CustomProperty = GeoJsonProperties & {
    Name: string
    Type: FeatureType
    Description: string
}
export type MapFeature = Feature<Point, CustomProperty>;

export const LatLng = z.object({
    lat: z.number(),
    lng: z.number(),
});
export type LatLngType = z.infer<typeof LatLng>;
export const SearchForFeaturesRequest = z.object({
    regionName: z.string(),
    featureType: z.enum(FeatureTypes),
    corner1: LatLng,
    corner2: LatLng
});
export type SearchForFeaturesRequestType = z.infer<typeof SearchForFeaturesRequest>;

export const SearchArea = z.object({
    center: LatLng,
    radius: z.positive()
});
export type SearchAreaType = z.infer<typeof SearchArea>;

export const Point = z.object({
    x: z.number(),
    y: z.number(),
});
export type PointType = z.infer<typeof Point>;

export type UpdateCallback = {
    state: "searching" | "done"
    visitedCircles: SearchAreaType[]
    currentCircle?: SearchAreaType
}

export const TagsWithName = z.looseObject({
    name: z.string(),
    iata: z.string().optional()
})

export const ZLatLngPoint = z.object({
    lat: z.number(),
    lon: z.number()
})

export const WayOrRelation = z.looseObject({
    tags: TagsWithName,
    center: ZLatLngPoint
})

export const ZNode = z.looseObject({
    ...ZLatLngPoint.shape,
    tags: TagsWithName
})
