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
                                    :items="regions.regionMap.value" item-title="name" item-value="id" label="Existing Region"></v-select>
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
    <v-container bg fill-height grid-list-md text-xs-center class="menu-parent"
        v-if="!L.Browser.mobile && step != 'selecting'">
        <v-card :title="'Region \'' + editedRegion.name + '\': Choose Center'"
            subtitle="Click on the map to choose a point which roughly represents the center of your region"
            class="menu" v-if="step === 'centering'">
            <v-card-text>
                <v-checkbox v-model="enableRailroadOverlay" label="Enable Railroad Overlay"></v-checkbox>
                <v-btn color="primary" block :disabled="!editedRegion.center" @click="step = 'bounds'">Confirm</v-btn>
            </v-card-text>
        </v-card>
        <v-card :title="'Region \'' + editedRegion.name + '\': Choose Bounds'"
            subtitle="Click on the map to choose the bounds of your region; must fully enclose all playable area"
            class="menu" v-if="step === 'bounds'">
            <v-card-text>
                <v-checkbox v-model="enableRailroadOverlay" label="Enable Railroad Overlay"></v-checkbox>
                <v-btn color="primary" block @click="startBoundsShape" class="mb-5">Draw Bounds</v-btn>
                <v-btn color="primary" block :disabled="!editedRegion.bounds" @click="step = 'features'">Confirm</v-btn>
            </v-card-text>
        </v-card>
        <v-card :title="'Region \'' + editedRegion.name + '\': Load Features'" subtitle="Load and modify map features"
            class="menu" v-if="step === 'features'">
            <v-card-text>
                <v-select label="Feature to Edit"
                    :items="features.filter(item => item.key !== 'custom').map(item => ({ ...item, pluralLabel: (editedRegion.features.find(i => i.properties.Type === item.key) ? '✅ ' : '❌ ') + item.pluralLabel }))"
                    v-model="featureToEdit" item-title="pluralLabel" item-value="key"></v-select>
                <v-btn class="mb-5" color="primary" :disabled="loading" :loading="loading"
                    @click="() => hasFeaturesOfCurrentType ? showOverwriteWarningDialog = true : loadFeatures()">
                    {{ hasFeaturesOfCurrentType ? 'Overwrite with ' : 'Load from' }} Open Street Map Data
                </v-btn>
                <v-btn color="primary" block @click="step = 'final'">Confirm</v-btn>
            </v-card-text>
        </v-card>
    </v-container>
    <v-dialog width="auto" v-model="showOverwriteWarningDialog">
        <template v-slot:default="{ isActive }">
            <v-card prepend-icon="mdi-alert" title="Warning">
                <v-divider class="mt-3"></v-divider>

                <v-card-text class="px-4" style="height: 100px;">
                    Loading from the Open Street Map data will overwrite any custom edits you have made.
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn text="Cancel" @click="isActive.value = false"></v-btn>

                    <v-spacer></v-spacer>

                    <v-btn color="surface-variant" text="Continue" variant="flat"
                        @click="isActive.value = false; loadFeatures()"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
    <v-dialog max-width="1800" :model-value="step === 'final'">
        <template v-slot:default>
            <v-card prepend-icon="mdi-book-edit" title="Finalize">
                <v-divider class="mt-3"></v-divider>

                <v-card-text>
                    <p>The following is the raw data produced by this editor. You may edit it to make custom changes or enhancements.</p>
                    <json-editor-vue v-model="rawEditedRegion" :mode="Mode.text" class="jse-theme-dark" :read-only="saving" :main-menu-bar="false" :stringified="false"></json-editor-vue>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn prepend-icon="mdi-keyboard-return" text="Back" @click="step = 'features'" :disabled="saving"></v-btn>

                    <v-spacer></v-spacer>

                    <v-btn prepend-icon="mdi-content-save-all" color="surface-variant" text="Save" variant="flat" :disabled="saving || !rawEditedRegion" :loading="saving"
                        @click="submitRegion"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
    <v-dialog max-width="1000" :model-value="step === 'sharing'">
        <template v-slot:default>
            <v-card prepend-icon="mdi-share-all" title="Share with Other Users">
                <v-card-text>
                    <v-container>
                        <v-row align="center" justify="center">
                            <v-col cols="12" md="6">
                                <v-text-field label="User ID" v-model="userIdToAdd"></v-text-field>
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-btn block prepend-icon="mdi-share" color="primary" v-on:click="submitShareChange(true)" :disabled="!userIdToAdd.length || loading" :loading="loading">Share</v-btn>
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-btn block prepend-icon="mdi-cancel" color="red" v-on:click="submitShareChange(false)" :disabled="!userIdToAdd.length || loading" :loading="loading">Unshare</v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn prepend-icon="mdi-keyboard-return" text="Back" @click="step = 'final'" :disabled="saving"></v-btn>

                    <v-spacer></v-spacer>

                    <v-btn prepend-icon="mdi-exit-to-app" color="surface-variant" text="Exit Region Editor" variant="flat" :disabled="saving || !rawEditedRegion" :loading="saving"
                        @click="exit"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L, { LatLngBounds } from 'leaflet';

import { useFirebaseApp } from 'vuefire';

import 'leaflet-draw';
import '../styles/leaflet.draw.css';
import { flipCoords, getNullRegion, useRegion, useRegions, useRegionSharing, type NullableRegion, type Region } from '@/regions/regions';
import { updateTileLayers } from '@/graphics/mapTiles';
import { features } from '@/regions/features';
import { loadNewFeatures } from '@/firebase';
import { notify } from '@kyvg/vue3-notification';
import JsonEditorVue from 'json-editor-vue';
import { Mode } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import type { Point } from 'geojson';

const router = useRouter();
const localMap = shallowRef<L.Map | null>(null);

const firebaseApp = useFirebaseApp();

const featureToEdit = shallowRef<import('@/regions/features').FeatureType>("airport");
const loading = shallowRef(false);

const step = shallowRef<'selecting' | 'centering' | 'bounds' | 'features' | 'final' | 'sharing'>('selecting');

const existingRegionSelection = shallowRef<string | null>(null);
const newRegionName = shallowRef<string | null>(null);
const editedRegion = ref<NullableRegion>(getNullRegion());
const showOverwriteWarningDialog = shallowRef(false);
const hasFeaturesOfCurrentType = computed(() => editedRegion.value.features.find(i => i.properties.Type === featureToEdit.value));

const regionFirebaseObj = computed(() => useRegion(editedRegion.value.id));
const rawEditedRegion = ref<NullableRegion | null>(getNullRegion());
const saving = shallowRef<boolean>(false);

const enableRailroadOverlay = shallowRef(false);

const userIdToAdd = shallowRef("");

const regions = useRegions();
const regionSharing = useRegionSharing(); 

let centerMarker: L.Marker<any> | null = null;
let boundsRect: L.Rectangle | null = null;
let featureMarkers: L.Marker<any>[] = [];
let clickMapCooldown: boolean = false;

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

        localMap.value.on((L as any).Draw.Event.CREATED, function (e) {
            if (e.type == "draw:created" && (e as any).layerType == "rectangle") {
                let rect = e.layer._bounds;
                editedRegion.value.bounds = [rect.getSouthWest(), rect.getNorthEast()];
                boundsRect = L.rectangle(rect, { color: "#ff7800", weight: 5, fillOpacity: 0.1 })
                boundsRect.addTo(localMap.value!);
            }
        });

        // Sorry Dark Mode enjoyers - you will be forced to use Sunny on this mode
        updateTileLayers(["Jawg_Sunny"], localMap.value!);

        if (editedRegion.value.center) {
            centerMarker = L.marker(editedRegion.value.center!).addTo(localMap.value!)
                .bindPopup("Region Center");
        }
        if (editedRegion.value.bounds) {
            boundsRect = L.rectangle(new LatLngBounds(editedRegion.value.bounds![0], editedRegion.value.bounds![1]), { color: "#ff7800", weight: 5, fillOpacity: 0.1 }).addTo(localMap.value!);
        }
        if (step.value === 'final') {
            rawEditedRegion.value = JSON.parse(JSON.stringify(editedRegion.value));
            delete rawEditedRegion.value?.id;
        }
    }
})

watch(editedRegion, () => {
    if (editedRegion.value.bounds && localMap.value) {
        if (boundsRect) {
            boundsRect.remove();
        }
        boundsRect = L.rectangle(new LatLngBounds(editedRegion.value.bounds![0], editedRegion.value.bounds![1]), { color: "#ff7800", weight: 5, fillOpacity: 0.1 }).addTo(localMap.value!);
    }
    if (editedRegion.value.center && localMap.value) {
        if (centerMarker) {
            centerMarker.remove();
        }
        centerMarker = L.marker(editedRegion.value.center).addTo(localMap.value!)
            .bindPopup("Region Center");
    } else if (centerMarker) {
        centerMarker.remove();
    }
}, { deep: true });

const refreshFeatureMarkers = () => {
    featureMarkers.forEach(marker => marker.remove());
    featureMarkers = editedRegion.value.features.filter(f => f.properties.Type === featureToEdit.value).map(feature => {
        return L.marker(flipCoords((feature.geometry as Point).coordinates)).addTo(localMap.value!)
            .bindPopup(feature.properties.Name);
    })
}
watch(featureToEdit, refreshFeatureMarkers);

const onMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    if (clickMapCooldown) return;
    if (step.value === 'centering') {
        editedRegion.value.center = new L.LatLng(e.latlng.lat, e.latlng.lng);
    }
};

const submitRegionSelection = async () => {
    if (existingRegionSelection.value) {
        const newRegionToUse = useRegion(existingRegionSelection.value);
        editedRegion.value = reactive(JSON.parse(JSON.stringify(await newRegionToUse.getWithListConvertion())));
    } else if (newRegionName.value) {
        editedRegion.value = reactive(getNullRegion());
        editedRegion.value.name = newRegionName.value;
    }
    clickMapCooldown = true;
    step.value = 'centering';
    setTimeout(() => clickMapCooldown = false, 500);
};

const submitShareChange = async(shareStatus: boolean) => {
    loading.value = true
    if (await regionSharing[shareStatus ? "shareWithOtherUser" : "unshareWithOtherUser"](userIdToAdd.value, editedRegion.value.id!)) {
        notify({
            type: 'success',
            title: "Success",
            text: "Region sharing modified"
        })
        userIdToAdd.value = ''
    } else {
        notify({
            type: 'error',
            title: "Error",
            text: "An error occured while trying to change region sharing. Try again later"
        })
    }
    loading.value = false
}

const startBoundsShape = () => {
    if (boundsRect) {
        boundsRect.remove();
    }
    const rect = new (L as any).Draw.Rectangle(localMap.value!, {});
    (window as any).type = null; // https://github.com/Leaflet/Leaflet.draw/issues/898
    rect.initialize(localMap.value!);
    rect.enable();
}

const loadFeatures = async () => {
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
    editedRegion.value.features = [
        ...editedRegion.value.features.filter(f => f.properties.Type !== featureToEdit.value),
        ...features.data
    ]
    loading.value = false;
    refreshFeatureMarkers();
}

const loadNewFeaturesWithRetries = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const bounds = new L.LatLngBounds(editedRegion.value.bounds!);
            return await loadNewFeatures(firebaseApp, {
                corner1: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
                corner2: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
                featureType: featureToEdit.value,
                regionName: editedRegion.value.name!
            });
        } catch (error) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    return null;
}

const submitRegion = async() => {
    saving.value = true;
    await regionFirebaseObj.value.save({
        ...rawEditedRegion.value,
        id: editedRegion.value.id!
    } as Region);
    notify({
        type: 'success',
        title: "Success",
        text: "Successfully saved region"
    })
    saving.value = false;
    step.value = 'sharing'
}

const exit = () => {
    window.location.replace('/');
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
    top: 0;
    left: 0;
    z-index: 1000;
    height: 100%;
    display: flex;
    align-items: center;
    justify-items: start;
    pointer-events: none;
    /* min-width: 20em;
    transform: translateY(-50%);
    margin-left: 1em; */
}

.menu-parent>.v-card {
    pointer-events: auto;
}

/* .menu {
    z-index: 1000;
    min-width: 20em;
    transform: translateY(-50%);
    margin-left: 1em;
} */
</style>
