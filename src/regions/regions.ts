import type { FeatureCollection, GeoJsonProperties, Point, Position } from "geojson"
import type { LatLng, LatLngBounds, LatLngBoundsExpression, LatLngBoundsLiteral, LatLngTuple } from "leaflet";
import { colors, type FeatureType } from "./features";
import { Delaunay, type Voronoi } from "d3";
import { ref } from 'vue';
import { getDatabase, ref as dbRef, set, get, push } from 'firebase/database';
import { useCurrentUser, useDatabaseObject, useDatabaseList } from "vuefire";
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

function useRegionSharing() {
    const user = useCurrentUser();

    const userRegionListDbRef = computed(() => dbRef(getDatabase(), `users/${user.value?.uid}/regions`));

    const regionIdList = computedAsync(async() => {
        if (!user.value) {
            return []
        }
        const userRegionList = await get(userRegionListDbRef.value);
        return Object.values(userRegionList.val());
    })

    const shareWithCurrentUser = async(regionId: string) => {
        if (regionIdList.value && !regionIdList.value.includes(regionId)) {
            await push(userRegionListDbRef.value, regionId);
        }
        return true;
    }
    
    const shareWithOtherUser = async(userId: string, regionId: string) => {
        if (!regionIdList.value || !regionIdList.value.includes(regionId)) {
            return false;
        }
        const otherUserRef = dbRef(getDatabase(), `users/${userId}/regions`);
        const existingRegions = await get(otherUserRef);
        if (existingRegions.exists() && !Object.values(existingRegions.val()).includes(regionId)) {
            await push(otherUserRef, regionId);
        }
        return true;
    }

    return { regionIdList, shareWithCurrentUser, shareWithOtherUser }
}

// DB layout is /regions/<ID>/{object}
export function useRegions() {
    const sharing = useRegionSharing();

    const regionsDbRef = dbRef(getDatabase(), 'regions');
    
    const regionMap: globalThis.Ref<Region[] | undefined> = computedAsync(async() => {
        const regions = await get(regionsDbRef);
        return Object.values((regions.val() ?? {}) as { [key: string]: Region })
        .filter(region => sharing.regionIdList.value!.includes(region.id));
    })

    return { regionMap };
}

export function useRegion(regionId: globalThis.MaybeRefOrGetter<string>) {
    const sharing = useRegionSharing();
    
    const regionRef = computed(() => dbRef(getDatabase(), `regions/${toValue(regionId)}`));

    const save = async(region: Region) => {
        region.id = toValue(regionId);
        if (!await sharing.shareWithCurrentUser(region.id)){
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

    return { save, getWithListConvertion };
}
