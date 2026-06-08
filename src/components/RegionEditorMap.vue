<template>
    <div id="regionEditorMap" style="width: 100%; height: 100%">
        <v-container>
            <v-card title="Warning: Unsupported Browser" v-if="L.Browser.mobile"
                text="The Region Editor is not supported on mobile devices. Please try again on a widescreen device.">
            </v-card>
            <v-card v-if="!L.Browser.mobile && step === 'selecting'" title="Select a Region"
                subtitle="Choose an existing region to edit or name a new region">
                <v-card-text>
                    <v-container>
                        <v-row align="center" justify="center">
                            <v-col cols="12" md="8">
                                <v-select clearable :disabled="!!newRegionName" v-model="existingRegionSelection"
                                    :items="regions.nameList.value" label="Existing Region"></v-select>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-btn block color="primary" v-on:click="submitRegionSelection"
                                    :disabled="!!newRegionName || !existingRegionSelection">Edit
                                    Existing Region</v-btn>
                            </v-col>
                        </v-row>
                        <v-row align="center" justify="center">
                            <v-col cols="12" md="8">
                                <v-text-field label="New Region Name" :disabled="!!existingRegionSelection"
                                    v-model="newRegionName"></v-text-field>
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-btn block color="primary" v-on:click="submitRegionSelection"
                                    :disabled="!!existingRegionSelection || !newRegionName">+ Create a new
                                    region</v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
            </v-card>
        </v-container>
    </div>
    <div class="menu-parent" v-if="!L.Browser.mobile && step != 'selecting'">
        <v-card title="Choose Center"
            subtitle="Click on the map to choose a point which roughly represents the center of your region"
            class="menu" v-if="step === 'centering'">
            <v-card-text>
                <v-checkbox v-model="enableRailroadOverlay" label="Enable Railroad Overlay"></v-checkbox>
                <v-btn color="primary" block :disabled="!editedRegion.center" @click="step = 'bounds'">Confirm</v-btn>
            </v-card-text>
        </v-card>
        <v-card title="Choose Bounds"
            subtitle="Click on the map to choose the bounds of your region; must fully enclose all playable area"
            class="menu" v-if="step === 'bounds'">
            <v-card-text>
                <v-checkbox v-model="enableRailroadOverlay" label="Enable Railroad Overlay"></v-checkbox>
                <v-btn color="primary" block @click="startBoundsShape">Draw Bounds</v-btn>
                <v-btn color="primary" block :disabled="!editedRegion.bounds" @click="step = 'features'">Confirm</v-btn>
            </v-card-text>
        </v-card>
        <!-- <v-card title="Region Editor" subtitle="Design Your Game Region" class="menu">
            <v-card-text>
                <v-select label="Feature to Edit" :items="features.filter(item => item.key !== 'custom')" v-model="featureToEdit"
                    item-title="pluralLabel" item-value="key"></v-select>
                <v-btn color="primary" :disabled="loading" :loading="loading" @click="loadFromBackend">Load from Open Street Map Data</v-btn>
            </v-card-text>
        </v-card> -->
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
import { flipCoords, getNullRegion, loadRegion, loadRegionDescriptions, Region, useRegions, type NullableRegion } from '@/regions/regions';
import { updateTileLayers } from '@/graphics/mapTiles';
import { features } from '@/regions/features';
import { loadNewFeatures } from '@/firebase';
import { notify } from '@kyvg/vue3-notification';

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

const step = shallowRef<'selecting' | 'centering' | 'bounds' | 'features'>('selecting');

const existingRegionSelection = shallowRef<string | null>(null);
const newRegionName = shallowRef<string | null>(null);
const editedRegion = ref<NullableRegion>(getNullRegion());

const enableRailroadOverlay = shallowRef(false);

const regions = useRegions();

let centerMarker: L.Marker<any> | null = null;

onMounted(async () => {
    // Load existing regions
    if (!store.$state.regions.length) {
        store.$state.regions = await loadRegionDescriptions();
    }

    // localMap.value = L.map('map', {
    //     // It's much nicer on mobile to have unlimited zoom granularity, but it feels worse on desktops
    //     zoomSnap: L.Browser.mobile ? 0 : 0.5
    // }).setView(flipCoords(store.$state.loadedRegionData?.center || [0, 0]), 13);  // Region default

    // L.control.scale().addTo(localMap.value);

    // Sorry Dark Mode enjoyers - you will be forced to use Sunny on this mode
    // updateTileLayers(["Jawg_Sunny"], localMap.value!);
})

watch(enableRailroadOverlay, () => {
    if (enableRailroadOverlay.value) {
        updateTileLayers(["Jawg_Sunny", "OpenRailwayMap"], localMap.value!);
    } else {
        updateTileLayers(["Jawg_Sunny"], localMap.value!);
    }
})

watch(step, () => {
    if (step.value === 'selecting') {
        existingRegionSelection.value = null;
        newRegionName.value = null;
        if (localMap.value) {
            localMap.value!.remove();
        }
    } else {
        if (localMap.value) {
            localMap.value!.remove();
        }
        localMap.value = L.map('regionEditorMap', {
            // It's much nicer on mobile to have unlimited zoom granularity, but it feels worse on desktops
            zoomSnap: L.Browser.mobile ? 0 : 0.5
        }).setView([40.36878829361593, -101.54066604570275], 4);  // Random choice, center of US

        if (editedRegion.value?.center) {
            localMap.value.setView(editedRegion.value.center, 13);
        }

        L.control.scale().addTo(localMap.value);
        localMap.value.on('click', onMapClick);

        // Sorry Dark Mode enjoyers - you will be forced to use Sunny on this mode
        updateTileLayers(["Jawg_Sunny"], localMap.value!);
    }
})

watch(editedRegion, () => {
    if (editedRegion.value.center) {
        if (centerMarker) {
            centerMarker.remove();
        }
        centerMarker = L.marker(editedRegion.value.center).addTo(localMap.value!)
            .bindPopup("Region Center");
    } else if (centerMarker) {
        centerMarker.remove();
    }
}, { deep: true });

const onMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    console.log('hi')
    if (step.value === 'centering') {
        editedRegion.value.center = [e.latlng.lat, e.latlng.lng];
    }
};

const submitRegionSelection = () => {
    if (existingRegionSelection.value) {
        editedRegion.value = reactive(regions.get(existingRegionSelection.value)!);
    } else if (newRegionName.value) {
        editedRegion.value = reactive(getNullRegion());
        editedRegion.value.name = newRegionName.value;
    }
    step.value = 'centering';
};

const startBoundsShape = () => {
    const rect = new (L as any).Draw.Rectangle(localMap.value!, {});
    (window as any).type = null; // https://github.com/Leaflet/Leaflet.draw/issues/898
    rect.initialize(localMap.value!);
    rect.enable();
}

const ensureRegionLoaded = async () => {
    const regionId = store.$state.regions.find(region => region.name === gamesObj.value?.region)!.path;
    const region = await loadRegion(regionId);
    store.$state.loadedRegionData = region;
}

const loadFromBackend = async () => {
    loading.value = true
    const features = await loadNewFeaturesWithRetries();
    if (!features) {
        notify({
            type: 'error',
            title: "Error",
            text: "An error occured while calling the load feature API. Try again later"
        })
        loading.value = false
        return
    }
    features.data.forEach(feature => {
        L.marker(flipCoords(feature.geometry.coordinates)).addTo(localMap.value!)
            .bindPopup(feature.properties.Name);
    })
    loading.value = false
}

const loadNewFeaturesWithRetries = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            return await loadNewFeatures(firebaseApp, {
                corner1: { lat: store.$state.loadedRegionData!.bounds[0][1], lng: store.$state.loadedRegionData!.bounds[0][0] },
                corner2: { lat: store.$state.loadedRegionData!.bounds[1][1], lng: store.$state.loadedRegionData!.bounds[1][0] },
                featureType: featureToEdit.value,
                regionName: store.$state.loadedRegionData!.name
            });
        } catch (error) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    return null;
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
