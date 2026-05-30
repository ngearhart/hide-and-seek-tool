import { featureDistance } from "../geo";
import { FeatureType, MapFeature, WayOrRelation, ZNode } from "../models";
import getAirports from "./airport";
import type { OverpassJson } from "overpass-ts";
import { overpassJson, OverpassGatewayTimeoutError } from "overpass-ts";

import * as z from "zod";


const REDUCTION_RADIUS_MI = 0.05;

function getFeatureDefault(query: string, featureType: FeatureType) {
    return async (bounds: string): Promise<MapFeature[]> => {
        const response: OverpassJson = await overpassJson(`
            [out:json][timeout:25];
        ${query}(${bounds});
        // print results
        out center;
        `);
        return response.elements.map(element => {
            if (element.type === "relation" || element.type === "way") {
                const parsedElement = z.safeParse(WayOrRelation, element);
                if (!parsedElement.success) {
                    // TODO error parsing
                    return null
                }
                return {
                    "type": "Feature",
                    "properties": {
                        "Name": parsedElement.data.tags.name,
                        "Type": featureType,
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            parsedElement.data.center.lon,
                            parsedElement.data.center.lat
                        ]
                    }
                } as MapFeature;
            } else if (element.type === "node") {
                const parsedElement = z.safeParse(ZNode, element);
                if (!parsedElement.success) {
                    // TODO error parsing
                    return null
                }
                return {
                    "type": "Feature",
                    "properties": {
                        "Name": parsedElement.data.tags.name,
                        "Type": featureType,
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            parsedElement.data.lon,
                            parsedElement.data.lat
                        ]
                    }
                } as MapFeature;
            }
            return null;
        }).filter(element => element != null) as MapFeature[];
    }
}

// https://wiki.openstreetmap.org/wiki/Key:amenity
const FEAT_DICT: { [featureType in FeatureType]: (bounds: string) => Promise<MapFeature[]> } = {
    "station": getFeatureDefault(`nwr["public_transport"="station"]["railway"="station"]`, "station"),
    "airport": getAirports,
    "museum": getFeatureDefault(`nwr["tourism"="museum"]`, "museum"),
    "theater": getFeatureDefault(`nwr["amenity"="cinema"]`, "theater"),
    "hospital": getFeatureDefault(`nwr["amenity"="hospital"]["emergency"="yes"]`, "hospital"),
    "library": getFeatureDefault(`nwr["amenity"="library"]`, "library"),
    "zoo": getFeatureDefault(`nwr["tourism"="zoo"]`, "zoo"),
    "aquarium": getFeatureDefault(`nwr["tourism"="aquarium"]`, "aquarium"),
    "graveyard": getFeatureDefault(`nwr["amenity"="graveyard"]`, "graveyard"),
    "park": getFeatureDefault(`nwr["leisure"="park"]`, "park"),
    "custom": (bounds: string) => new Promise(res => res([])),
}

export default async function getFeatures(bounds: string, featureType: FeatureType): Promise<MapFeature[]> {
    const data = await FEAT_DICT[featureType](bounds);

    // Remove duplicate entries that are too close together.
    return data.reduce(
        (accumulator: MapFeature[], currentValue: MapFeature): MapFeature[] => {
            if (!accumulator.find(feature => featureDistance(feature, currentValue) < REDUCTION_RADIUS_MI)) {
                return [
                    ...accumulator,
                    currentValue
                ]
            }
            return accumulator
        },
        []
    );
}
