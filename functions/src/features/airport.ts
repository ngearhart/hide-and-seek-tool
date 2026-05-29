import type { OverpassJson } from "overpass-ts";
import { overpassJson } from "overpass-ts";
import { MapFeature, WayOrRelation, ZNode } from "../models";

import * as z from "zod";


export default async function getAirports(bounds: string): Promise<MapFeature[]> {
    const response: OverpassJson = await overpassJson(`
        [out:json][timeout:25];
    nwr["aeroway"="aerodrome"]["iata"~".+"](${bounds});
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
                    "Name": parsedElement.data.tags.iata ?? null,
                    "Type": "airport",
                    "Description": parsedElement.data.tags.name,
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
                    "Name": parsedElement.data.tags.iata ?? null,
                    "Type": "airport",
                    "Description": parsedElement.data.tags.name,
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
    }).filter(element => element != null && element.properties.Name != null) as MapFeature[];
    // The API will filter out airports without IATA tags but still
}
