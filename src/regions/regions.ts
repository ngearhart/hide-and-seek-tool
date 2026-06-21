import type { FeatureCollection, GeoJsonProperties, Point, Position } from "geojson"
import type { LatLng, LatLngBounds, LatLngBoundsExpression, LatLngBoundsLiteral, LatLngTuple } from "leaflet";
import { colors, type FeatureType } from "./features";
import { Delaunay, type Voronoi } from "d3";
import { ref } from 'vue';
import { getDatabase, ref as dbRef, set, get } from 'firebase/database';
import { useCurrentUser, useDatabaseObject } from "vuefire";
import { notify } from "@kyvg/vue3-notification";
import { computedAsync } from '@vueuse/core'

export type CustomProperty = GeoJsonProperties & {
    Name: string
    Type: FeatureType
    Description: string
}

export type Region = FeatureCollection<Point, CustomProperty> & {
    id: string
    name: string
    size: string
    center: LatLng
    bounds: LatLngBoundsLiteral
    hidingRadiusMiles: number
}

export type NullableRegion = FeatureCollection<Point, CustomProperty> & {
    id: string
    name?: string
    size?: string
    center?: LatLng
    bounds?: LatLngBoundsLiteral
    hidingRadiusMiles?: number
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

export function getNullRegion(): NullableRegion {
    return { type: "FeatureCollection", features: [], id: generateSlug(16) }
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
                const topCorner = flipCoords(region.bounds[1] as Position);
                const bottomCorner = flipCoords(region.bounds[0] as Position);
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

const generateSlug = (length: number) => {
    let slug = '';
    const characters = 'ABCDEFGHKMNPQRSTWXYZ';
    for (let i = 0; i < length; i++) {
        slug += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return slug;
}

// DB layout is /regions/<ID>/{object}
export function useRegions() {

    const user = useCurrentUser();
    const regionsDbRef = computed(() => dbRef(getDatabase(), 'regions'));
    const regionsObj = useDatabaseObject<{ [key: string]: Region } | null>(regionsDbRef);
    
    // TODO: consider just putting a list of shared region ids in the user object
    const regionMap = computedAsync(async() => {
        const unfilteredRegions = Object.values(regionsObj.value ?? {}).map(region => ({
            name: (region as Region).name,
            id: (region as Region).id,
            promise: get(dbRef(getDatabase(), `regionSharing/${(region as Region).id}`))
        }));
        const dbPermRefs = await Promise.all(unfilteredRegions.map(r => r.promise));
        return unfilteredRegions.map(r => ({name: r.name, id: r.id})).filter()
    });

    return { regionMap };
}

export function useRegion(regionId: globalThis.MaybeRefOrGetter<string>) {
    const user = useCurrentUser();
    
    const regionRef = computed(() => dbRef(getDatabase(), `regions/${toValue(regionId)}`));
    const regionObj = useDatabaseObject<Region | null>(regionRef);

    const save = async(region: Region) => {
        region.id = toValue(regionId);
        const regionSharingDbRef = dbRef(getDatabase(), `regionSharing/${region.id}`);
        const regionSharingObj = await get(regionSharingDbRef);
        if (!regionSharingObj.exists()) {
            await set(regionSharingDbRef, [user.value?.uid]);
        } else if (!regionSharingObj.val().includes(user.value?.uid)){
            notify({
                type: "error",
                text: "You do not have permission to edit this region",
                title: "Error"
            })
            return
        }

        await set(
            regionRef.value,
            region
        )
    };

    /**
     * Explicitly wait for the region to be loaded instead of being reactive.
     * Convert feature list from the weird object in firebase to a JS Array.
     * @returns The given region
     */
    const getWithListConvertion: () => Promise<Region | null> = async() => {
        const rawData = await get(regionRef.value);
        if (!rawData.exists()) {
            return null;
        }
        const regionWithWeirdList = rawData.val();
        regionWithWeirdList.features = Object.values(regionWithWeirdList.features ?? {});
        return regionWithWeirdList as Region;
    }

    return { regionObj, save, getWithListConvertion };
}
