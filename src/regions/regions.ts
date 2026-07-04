import type { FeatureCollection, GeoJsonProperties, MultiPoint, MultiPolygon, Point, Polygon, Position } from "geojson"
import L, { LatLng, LatLngBounds, Polygon as LPolygon, type LatLngBoundsExpression, type LatLngBoundsLiteral, type LatLngTuple } from "leaflet";
import { colors, type FeatureType } from "./features";
import { Delaunay, type Voronoi } from "d3";
import { ref } from 'vue';
import { getDatabase, ref as dbRef, set, get, push } from 'firebase/database';
import { useCurrentUser, useDatabaseObject, useDatabaseList } from "vuefire";
import { notify } from "@kyvg/vue3-notification";
import { computedAsync } from '@vueuse/core'
import './pointInPolygon.extensions';
import 'leaflet-draw';

export type CustomProperty = GeoJsonProperties & {
    Name: string
    Type: FeatureType
    Description: string
    Level?: number
}

export type Region = FeatureCollection<Point | MultiPolygon | Polygon, CustomProperty> & {
    id: string
    name: string
    size: string
    center: LatLng
    bounds: [LatLng, LatLng]
    hidingRadiusMiles: number
}

export type NullableRegion = FeatureCollection<Point | MultiPolygon | Polygon, CustomProperty> & {
    id?: string
    name?: string
    size?: string
    center?: LatLng
    bounds?: [LatLng, LatLng]
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
                const bounds = new LatLngBounds(region.bounds[0], region.bounds[1]);
                target[key] = delaunay.voronoi([
                    bounds.getSouthWest().lat, bounds.getSouthWest().lng,
                    bounds.getNorthEast().lat, bounds.getNorthEast().lng
                ]);
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

export function getRegionFeatures(region: Region, featureType: FeatureType) {
    return region.features.filter(feat => feat.properties.Type === featureType);
}

function getArrayDepth(value: any[]): number {
  return Array.isArray(value) ? 
    1 + Math.max(0, ...value.map(getArrayDepth)) :
    0;
}

export function getPolygonsFromDistrict(district: MultiPolygon | Polygon): LatLng[][] {
    const arrayDepth = getArrayDepth(district.coordinates);
    if (arrayDepth === 4) {
        // We know the district is a MultiPolygon
        return (district as MultiPolygon).coordinates.flatMap(poly => poly.map(entry => {
            if (entry.length > 2) {
                return entry.map(points => new LatLng(points[1], points[0]))
            }
            throw 'getPolygonsFromDistrict called with unusual data - MultiPolygon object might be a polygon instead'
            // Else - this is not a polygon - this is just one vertex
            // return [new LatLng((entry as any)[1], (entry as any)[0])];
        }));
    } else if (arrayDepth === 3) {
        // We know the district is a Polygon
        return [(district as Polygon).coordinates.flatMap(poly => poly.map(points => new LatLng(points[1], points[0])))];
    }
    throw 'getPolygonsFromDistrict called with non-Polygon or MultiPolygon - depth=' + arrayDepth;
}

export function getLargestPolygon(polys: LatLng[][]): LatLng[] {
    return polys.map(poly => ({
        p: poly,
        area: (L as any).GeometryUtil.geodesicArea(poly)
    })).reduce((prev, current) => (prev && prev.area > current.area) ? prev : current).p
}

export function getCentroid(poly: LatLng[]): LatLng {
    return new LPolygon(poly).getBounds().getCenter();
    // const lats = districtGeometry.flatMap(poly => poly.flatMap(point => point.lat));
    // const lngs = districtGeometry.flatMap(poly => poly.flatMap(point => point.lng));
    // return new LatLng(lats.reduce((sum, val) => sum + val, 0) / lats.length, lngs.reduce((sum, val) => sum + val, 0) / lngs.length);
}

export function useRegionSharing() {
    const user = useCurrentUser();

    const userRegionListDbRef = computed(() => dbRef(getDatabase(), `users/${user.value?.uid}/regions`));

    const regionIdList = computedAsync(async() => {
        if (!user.value) {
            return []
        }
        const userRegionList = await get(userRegionListDbRef.value);
        const result = Object.values(userRegionList.val() ?? {});
        return result;
    })

    const shareWithCurrentUser = async(regionId: string) => {
        if (!regionIdList.value || !regionIdList.value.includes(regionId)) {
            await push(userRegionListDbRef.value, regionId);
        }
        return true;
    }
    
    const shareWithOtherUser = async(userId: string, regionId: string) => {
        if (!regionIdList.value || !regionIdList.value.includes(regionId) || userId == user.value?.uid) {
            return false;
        }
        const otherUserRef = dbRef(getDatabase(), `users/${userId}/regions`);
        const existingRegions = await get(otherUserRef);
        if (existingRegions.exists() && !Object.values(existingRegions.val()).includes(regionId)) {
            await push(otherUserRef, regionId);
        }
        return true;
    }

    const unshareWithOtherUser = async(userId: string, regionId: string) => {
        if (!regionIdList.value || !regionIdList.value.includes(regionId) || userId == user.value?.uid) {
            return false;
        }
        const otherUserRef = dbRef(getDatabase(), `users/${userId}/regions`);
        const existingRegions = await get(otherUserRef);
        if (existingRegions.exists() && Object.values(existingRegions.val()).includes(regionId)) {
            const newObj = Object.values(existingRegions.val()).filter(v => v !== regionId);
            await set(otherUserRef, newObj);
        }
        return true;
    }

    return { regionIdList, shareWithCurrentUser, shareWithOtherUser, unshareWithOtherUser }
}

// DB layout is /regions/<ID>/{object}
export function useRegions() {
    const sharing = useRegionSharing();

    const regionsDbRef = dbRef(getDatabase(), 'regions');
    
    const regionMap: globalThis.Ref<Region[] | undefined> = computedAsync(async() => {
        const regionIdList = sharing.regionIdList.value! ?? [];
        const regions = await get(regionsDbRef);
        const regionsVal = regions.val();
        return Object.entries((regionsVal ?? {}) as { [key: string]: Region })
        .filter(region => regionIdList.includes(region[0])).map(r => ({
            ...r[1],
            id: r[0]
        }));
    })

    return { regionMap };
}

export function useRegion(regionId: globalThis.MaybeRefOrGetter<string | undefined>) {
    const sharing = useRegionSharing();
    
    const regionRef = computed(() => dbRef(getDatabase(), `regions/${toValue(regionId)}`));

    const save = async(region: Region) => {
        region.id = toValue(regionId)!;
        if (!await sharing.shareWithCurrentUser(region.id)){
            notify({
                type: "error",
                text: "You do not have permission to edit this region",
                title: "Error"
            })
            return
        }

        await set(regionRef.value,
            {
                ...region,
                // TODO!
                hidingRadiusMiles: 0.25
            }
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

    const findIntersectingDistrict = async(point: LatLng, districtLevel: number): Promise<string | null> => {
        const region = await getWithListConvertion();
        if (!region) {
            return null;
        }
        const intersection = region.features.filter(feat => feat.properties.Type === "district" && feat.properties.Level === districtLevel)
            .find(feat => {
                const polygons = getPolygonsFromDistrict(feat.geometry as MultiPolygon);
                return !!polygons.map(poly => new LPolygon(poly)).find(poly => poly.contains(point));
            })
        if (intersection) {
            return intersection.properties.Name;
        }
        return null;
    }

    return { regionRef, save, getWithListConvertion, findIntersectingDistrict };
}
