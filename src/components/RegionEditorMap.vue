<template>
    <div id="map" style="width: 100%; height: 100%"></div>
    <div class="menu-parent">
        <v-card title="Region Editor" subtitle="Design Your Game Region" class="menu">
            <v-card-text>
                <v-select label="Feature to Edit" :items="features.filter(item => item.key !== 'custom')" v-model="featureToEdit"
                    item-title="pluralLabel" item-value="key"></v-select>
                <v-btn color="primary" :disabled="loading" :loading="loading" @click="loadFromBackend">Load from Open Street Map Data</v-btn>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { onMounted } from 'vue';
import { useStore } from '@/stores/app';
import { getDatabase, ref as dbRef, set } from 'firebase/database';
import { useCurrentUser, useDatabaseObject, useFirebaseApp } from 'vuefire';

import type { GameRecord, UserRecord } from '@/utils';

import 'leaflet-draw';
import '../styles/leaflet.draw.css';
import { flipCoords, loadRegion, loadRegionDescriptions } from '@/regions/regions';
import { updateTileLayers } from '@/graphics/mapTiles';
import { features } from '@/regions/features';
import { loadNewFeatures } from '@/firebase';

const store = useStore();
const localMap = shallowRef<L.Map | null>(null);

const firebaseApp = useFirebaseApp();

const user = useCurrentUser();
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user.value?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + userRecordObj.value?.currentGameId));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const featureToEdit = shallowRef<import('@/regions/features').FeatureType>("airport");
const loading = shallowRef(false);

onMounted(async () => {
    if (!store.$state.regions.length) {
        store.$state.regions = await loadRegionDescriptions();
    }
    if (!store.$state.loadedRegionData || store.$state.loadedRegionData?.name != gamesObj.value?.region) {
        // There is an odd case where the wrong region is loaded
        await ensureRegionLoaded();
    }
    localMap.value = L.map('map', {
        // It's much nicer on mobile to have unlimited zoom granularity, but it feels worse on desktops
        zoomSnap: L.Browser.mobile ? 0 : 0.5
    }).setView(flipCoords(store.$state.loadedRegionData?.center || [0, 0]), 13);  // Region default

    L.control.scale().addTo(localMap.value);

    // Sorry Dark Mode enjoyers - you will be forced to use Sunny on this mode
    updateTileLayers(["Jawg_Sunny"], localMap.value!);
})

const ensureRegionLoaded = async() => {
    const regionId = store.$state.regions.find(region => region.name === gamesObj.value?.region)!.path;
    const region = await loadRegion(regionId);
    store.$state.loadedRegionData = region;
}

const loadFromBackend = async() => {
    loading.value = true
    const features = await loadNewFeatures(firebaseApp, {
        corner1: { lat: store.$state.loadedRegionData!.bounds[0][1], lng: store.$state.loadedRegionData!.bounds[0][0]},
        corner2: { lat: store.$state.loadedRegionData!.bounds[1][1], lng: store.$state.loadedRegionData!.bounds[1][0]},
        featureType: featureToEdit.value,
        regionName: store.$state.loadedRegionData!.name
    });
    features.data.forEach(feature => {
        L.marker(flipCoords(feature.geometry.coordinates)).addTo(localMap.value!)
            .bindPopup(feature.properties.Name);
    })
    loading.value = false
}

</script>

<style scoped>
.menu-parent {
    /* position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    display: flex;
    align-items: center;
    z-index: -1; */
    
    position: absolute;
    top: 10em;
    left: 10em;
    z-index: 1000;
    min-width: 20em;
    transform: translateY(-50%);
    margin-left: 1em;
}

/* .menu {
    z-index: 1000;
    min-width: 20em;
    transform: translateY(-50%);
    margin-left: 1em;
} */
</style>
