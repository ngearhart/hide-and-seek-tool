import type { OverpassJson, OverpassNode, OverpassRelation, OverpassWay } from "overpass-ts";
import { overpassJson } from "overpass-ts";
import { MapFeature } from "./models";

import * as z from "zod";

const bounds = "38.600755595, -77.615651180, 39.175834624, -76.565770237";

const TagsWithName = z.looseObject({
    name: z.string(),
    iata: z.string().optional()
})

const ZLatLngPoint = z.object({
    lat: z.number(),
    lon: z.number()
})

const WayOrRelation = z.looseObject({
    tags: TagsWithName,
    center: ZLatLngPoint
})

const ZNode = z.looseObject({
    ...ZLatLngPoint.shape,
    tags: TagsWithName
})

async function getAirports(): Promise<MapFeature[]> {
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

// json request
getAirports().then(data => console.log(JSON.stringify(data, null, 2)));
