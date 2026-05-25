import { getDatabase } from "firebase-admin/database";
import { convertPlace, FeatureType, PlaceApiResponse, PlaceFirebaseEntry } from "./models";



export async function getPlaceFromDbOrNull(placeId: string): Promise<PlaceFirebaseEntry | null> {
    const db = await getDatabase();
    const ref = db.ref(`/places/${placeId}`);
    const data = await ref.get();
    if (!data.exists()) {
        return null;
    }
    return data.val() as PlaceFirebaseEntry;
}

export async function savePlace(place: PlaceApiResponse, placeId: string) {
    const db = await getDatabase();
    const ref = db.ref(`/places/${placeId}`);
    await ref.set(convertPlace(place));
}

export async function saveRegionFeatures(placeList: PlaceFirebaseEntry[], region: string, featureType: FeatureType, overwrite: boolean = true) {
    const db = await getDatabase();
    const ref = db.ref(`/regions/${region}/${featureType}`);
    if (overwrite) {
        await ref.set(placeList);
    } else {
        const data = await ref.get();
        const unifiedSet = new Set(data.exists() ? data.val() : []);
        placeList.forEach(item => unifiedSet.add(item));
        await ref.set([...unifiedSet]);
    }
}

export async function getRegionFeatures(region: string, featureType: FeatureType): Promise<PlaceFirebaseEntry[]> {
    const db = await getDatabase();
    const ref = db.ref(`/regions/${region}/${featureType}`);
    const data = await ref.get();
    if (!data.exists()) {
        return [];
    }
    return data.val() as PlaceFirebaseEntry[];
}
