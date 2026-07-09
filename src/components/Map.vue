<template>
    <MapActionButton @locate="locate" @radar="(hit, lat, long, meters) => addRadar(hit, lat, long, meters)"
        :games-db-obj="gamesObj" :games-db-ref="gamesDbRef" @thermometer="addThermometer"
        @show-pin-drop="droppingPin = true" @find-closest="findClosest" @draw="draw"
        @reset="shouldConfirmDeleteDialogShow = true" v-if="!droppingPin && !locating && !drawingPolygon"
        @district="addDistrictBoundary"
        @update-districts="updateGameObjects"
        :region-db-obj="regionObj" />
    <div id="map" style="width: 100%; height: 100%">
        <!-- Elements to show the page loading -->
        <v-container style="height: 100%;" v-if="!localMap">
            <v-row class="align-center" style="height: 100%;">
                <v-col class="d-flex justify-center">
                    <v-card elevation="6" mode="out-in" rounded="pill" width="330">
                        <div class="d-flex align-center pa-3 justify-space-between">
                            <div class="mt-n2">
                                <v-card-title>Loading...</v-card-title>
                            </div>
                            <v-progress-circular :size="100" :width="12" bg-color="surface-light" class="ma-3"
                                color="orange-accent-2" reveal rounded indeterminate>
                            </v-progress-circular>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
    <v-snackbar v-model="droppingPin" color="green" :close-on-content-click="false" timeout="-1">
        Tap on the map to drop a pin
        <template v-slot:actions>
            <v-btn color="pink" variant="text" @click="droppingPin = false">
                Cancel
            </v-btn>
        </template>
    </v-snackbar>
    <v-snackbar :model-value="measuringOtherMarkerState != null" color="green" :close-on-content-click="false"
        timeout="-1">
        Select another marker to take the measurement
        <template v-slot:actions>
            <v-btn color="pink" variant="text" @click="cancelMeasuringOtherMarker">
                Cancel
            </v-btn>
        </template>
    </v-snackbar>
    <v-snackbar v-model="locating" color="blue" :close-on-content-click="false" timeout="-1">
        Locating <v-progress-circular indeterminate></v-progress-circular>
    </v-snackbar>
    <v-snackbar v-model="drawingPolygon" color="red" :close-on-content-click="false" timeout="-1" multi-line>
        Tap to draw polygon points. Tap the first point to finish. This will show on all devices.
    </v-snackbar>
    <v-dialog max-width="500" v-model="calculatedDistanceDialog">
        <v-card title="Distance">
            <v-card-text>
                You are roughly {{ calculatedDistance.toLocaleString(undefined, { maximumSignificantDigits: 3 }) }}
                miles
                from the selected pin, {{ locatingPinToMeasureName }}.
            </v-card-text>
            <v-card-actions>
                <v-container>
                    <v-row align="center" justify="center">
                        <v-col cols="12" md="6">
                            <v-btn prepend-icon="mdi-close" variant="tonal" @click="calculatedDistanceDialog = false"
                                block>Close</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog max-width="500" v-model="findClosestDialog">
        <v-card title="Distance">
            <v-card-text>
                Your closest {{ findClosestResult.type }}, {{ findClosestResult.name }}, is roughly {{
                    findClosestResult.distance.toLocaleString(undefined, { maximumSignificantDigits: 3 }) }} miles from you.
            </v-card-text>
            <v-card-actions>
                <v-container>
                    <v-row align="center" justify="center">
                        <v-col cols="12" md="6">
                            <v-btn prepend-icon="mdi-close" variant="tonal" @click="findClosestDialog = false"
                                block>Close</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog max-width="500" v-model="measuringOtherMarkerDistanceResultDialog">
        <v-card title="Distance">
            <v-card-text>
                The pins you selected are roughly {{ measuringOtherMarkerDistanceResult.toLocaleString(undefined, {
                    maximumSignificantDigits: 3
                }) }} miles apart.
            </v-card-text>
            <v-card-actions>
                <v-container>
                    <v-row align="center" justify="center">
                        <v-col cols="12" md="6">
                            <v-btn prepend-icon="mdi-close" variant="tonal"
                                @click="measuringOtherMarkerDistanceResultDialog = false" block>Close</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <radar post-title="Pin" v-model="shouldShowPinRadarDialog"
        @hit-fail="(lat, lng, meters) => onPinRadar(false, 0, 0, meters)"
        @hit-success="(lat, lng, meters) => onPinRadar(true, 0, 0, meters)"></radar>
    <BoundaryLine post-title="Pin" v-model="shouldShowBoundaryLineDialog"
        @submit="(lat, lng, degrees) => addBoundaryLine(boundaryLineLatLng![0], boundaryLineLatLng![1], degrees)">
    </BoundaryLine>
    <ConfirmDelete :games-db-obj="gamesObj" :games-db-ref="gamesDbRef" v-model="shouldConfirmDeleteDialogShow">
    </ConfirmDelete>
    <CustomPinLabelEditor v-model="showCustomPinLabelEditor" :most-recent-pin-drop="mostRecentlyDroppedPin" ,
        :games-db-obj="gamesObj" :games-db-ref="gamesDbRef"></CustomPinLabelEditor>
    <AddCell v-model="showAddCellDialog" :marker="addCellDialogMarker" @create="submitCell"></AddCell>
    <district post-title="Pin" v-model="shouldshowDistrictBoundaryDialog" :region="regionObj"
        @submit="addDistrictBoundary" />
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L, { LatLng, type LatLngBoundsExpression, type LatLngExpression } from 'leaflet';

import { onMounted } from 'vue';
import { useStore } from '@/stores/app';
import { distance, rotatePoint } from '@/utils';
import { notify } from '@kyvg/vue3-notification';
import { getDatabase, ref as dbRef, set, get, onValue } from 'firebase/database';
import { useCurrentUser, useDatabaseObject, useFirebaseApp } from 'vuefire';

import type { GameRecord, UserRecord } from '@/utils';

import 'leaflet-draw';
import '../styles/leaflet.draw.css';
import { flipCoords, getRegionFeatures, loadRegion, loadRegionDescriptions, useRegion, type CustomProperty, type Region } from '@/regions/regions';
import { getIconFor } from '@/regions/icons';
import { getFeatureMarkers, type FancySubtitle, type FeatureType, type GetPopupFunction } from '@/regions/features';
import { updateGame } from '@/game';
import { MAP_TILE_LAYERS, updateTileLayers } from '@/graphics/mapTiles';
import { storeToRefs } from 'pinia';
import { PixiManager } from '@/graphics/main';
import AddCell from './dialog/AddCell.vue';
import type { Feature, MultiPolygon, Point, Polygon, Point as GPoint } from 'geojson';
import { useUserManager } from '@/firebase/user';

const store = useStore();
const localMap = shallowRef<L.Map | null>(null);

const userManager = useUserManager();
const userRecordObj = useDatabaseObject<UserRecord | null>(userManager.userRecordDbRef);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + userRecordObj.value?.currentGameId));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const region = computed(() => useRegion(gamesObj.value?.region));
const regionObj = useDatabaseObject<Region | null>(region.value.regionRef);

const showCustomPinLabelEditor = shallowRef(false);
const mostRecentlyDroppedPin = ref<L.LatLng | null>(null);
const droppingPin = shallowRef(false);
const locating = shallowRef(false);
const locatingPinToMeasureLatLng = ref<number[] | null>(null);
const locatingPinToMeasureName = ref<string | null>(null);
const locatingClosestType = ref<{ key: string, type: string } | null>(null);
const calculatedDistanceDialog = shallowRef(false);
const calculatedDistance = shallowRef(0);

const shouldShowPinRadarDialog = shallowRef(false);
const pinRadarLatLng = ref<number[] | null>(null);

const shouldShowBoundaryLineDialog = shallowRef(false);
const boundaryLineLatLng = ref<number[] | null>(null);

const shouldshowDistrictBoundaryDialog = shallowRef(false);
const districtBoundaryLatLng = ref<number[] | null>(null);

const findClosestDialog = shallowRef(false);
const findClosestResult = ref({ name: "", type: "", distance: 0 })

const showAddCellDialog = shallowRef(false);
const addCellDialogMarker = shallowRef<Feature<Point | MultiPolygon | Polygon, CustomProperty> | null>(null);

const drawingPolygon = shallowRef(false);

const shouldConfirmDeleteDialogShow = shallowRef(false);

const measuringOtherMarkerState = ref<number[] | null>()
const measuringOtherMarkerDistanceResultDialog = shallowRef(false)
const measuringOtherMarkerDistanceResult = shallowRef(0)


watch(storeToRefs(store).mapLayers, () => updateTileLayers(store.$state.mapLayers, localMap.value!))
watch(storeToRefs(store).mapMarkers, () => updateMarkers())
watch(storeToRefs(store).enableHidingSpotOverlay, () => updateGameObjects())
watch(gamesObj, () => updateGameObjects())

let previousMarkers: L.Marker<any>[] = [];

const ZOOM_SCALE_TO_SHOW_TOOLTIPS = 16;

const updateMarkers = () => {
    if (gamesObj.value && regionObj.value) {
        let openPopupMarkerLatLng: L.LatLng | null = null;
        previousMarkers.forEach(m => {
            if (m.isPopupOpen()) {
                openPopupMarkerLatLng = m.getLatLng();
            }
            m.remove();
        });
        let markers = getFeatureMarkers(getPopupFor, gamesObj, regionObj);
        previousMarkers = Object.values(markers).flat();
        store.$state.mapMarkers.forEach(marker => {
            markers[marker as FeatureType]
                // optimization - only show markers within bounds of view
                .filter(marker => localMap.value!.getBounds().contains(marker.getLatLng()))
                .forEach(m => {
                    // Permanently show tooltips when zoomed in enough
                    if (store.$state.enableTooltips && localMap.value!.getZoom() >= ZOOM_SCALE_TO_SHOW_TOOLTIPS) {
                        const toolTip = m.getTooltip();
                        m.unbindTooltip().bindTooltip(toolTip, { permanent: true });
                    }
                    m.addTo(localMap.value!);

                    if (openPopupMarkerLatLng && m.getLatLng().lat === openPopupMarkerLatLng.lat && m.getLatLng().lng === openPopupMarkerLatLng.lng) {
                        m.openPopup();
                    }
                });
        });
    }
}

const updateGameObjects = async () => {
    updateMarkers();
    PixiManager.update(gamesObj.value!, regionObj.value!);
    localMap.value!.addLayer(PixiManager.getLayer());
}

const onPinRadar = (success: boolean, userLat: number, userLng: number, distance: number) => {
    if (pinRadarLatLng.value != null) {
        addRadar(success, pinRadarLatLng.value[0], pinRadarLatLng.value[1], distance)
    }
}

const onLocationFound = (e: any) => {
    var radius = e.accuracy;

    locating.value = false
    notify({
        type: 'success',
        title: "Success",
        text: "Located you"
    })

    if (locatingPinToMeasureLatLng.value != null) {
        calculatedDistance.value = distance(
            locatingPinToMeasureLatLng.value[0], locatingPinToMeasureLatLng.value[1],
            e.latlng.lat, e.latlng.lng
        )
        calculatedDistanceDialog.value = true
        locatingPinToMeasureLatLng.value = null
    }
    else if (locatingClosestType.value != null) {
        let minDistanceMiles = 100000;
        let minDistanceName = "";
        for (let marker of getRegionFeatures(regionObj.value!, locatingClosestType.value.key as FeatureType)) {
            let d = distance(e.latlng.lat, e.latlng.lng, (marker.geometry as Point).coordinates[1], (marker.geometry as Point).coordinates[0])
            if (d < minDistanceMiles) {
                minDistanceMiles = d
                minDistanceName = marker.properties.Name
            }
        }
        findClosestResult.value.distance = minDistanceMiles
        findClosestResult.value.name = minDistanceName
        findClosestResult.value.type = locatingClosestType.value.type
        findClosestDialog.value = true
        locatingClosestType.value = null
    } else {
        L.marker(e.latlng).addTo(localMap.value!)
            .bindPopup("You are within " + radius + " meters from this point"); //.openPopup();

        L.circle(e.latlng, { radius: radius }).addTo(localMap.value!);
    }
};

const onLocationError = () => {
    notify({
        type: 'error',
        title: "Error",
        text: "Could not locate you"
    })
    locating.value = false
}

const locate = () => {
    locating.value = true
    localMap.value!.locate({ setView: locatingPinToMeasureLatLng.value == null && locatingClosestType.value == null, maxZoom: 16 });
};


const addThermometer = async (lat: number, long: number, angle: number, hotter: boolean) => {
    const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value))
    const newEntries = gamesObj.value?.thermometerEntries ?? [];
    newEntries.push({
        lat: lat,
        long: long,
        hotter: hotter,
        angle: angle,
        created: new Date().toUTCString(),
        creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown',
    });

    // This is not redundant - Vue compiler will optimize this away if we just use gamesObj.value
    await updateGame({
        thermometerEntries: newEntries,
        ...gamesObj.value
    } as GameRecord, oldGameObj, gamesDbRef.value);
};


const addRadar = async (hit: boolean, lat: number, long: number, meters: number) => {
    const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value));
    const newEntries = gamesObj.value?.radarEntries ?? [];
    newEntries.push({
        lat: lat,
        long: long,
        hit: hit,
        meters: meters,
        created: new Date().toUTCString(),
        creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown'
    });

    await updateGame({
        radarEntries: newEntries,
        ...gamesObj.value
    } as GameRecord, oldGameObj, gamesDbRef.value);
};

const addBoundaryLine = async (lat: number, long: number, degrees: number) => {
    const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value));
    const newEntries = gamesObj.value?.boundaryLineEntries ?? [];
    newEntries.push({
        lat: lat,
        long: long,
        degrees: degrees,
        created: new Date().toUTCString(),
        creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown',
    });

    await updateGame({
        boundaryLineEntries: newEntries,
        ...gamesObj.value
    } as GameRecord, oldGameObj, gamesDbRef.value);
}

const popupButtonClasses = "v-btn v-btn--block v-btn--elevated v-btn--spaced v-btn--spaced-start v-theme--dark v-btn--density-default v-btn--size-small v-btn--variant-elevated cursor-pointer dialog-button";

// I know this is gross but this is the leaflet canonical way.
const getPopupFor: GetPopupFunction = (latLng: L.LatLngExpression, name: string, subtitle: string = "", subtitle2: string = "", fancySubtitle?: FancySubtitle[]) => L.popup().setContent(measuringOtherMarkerState.value != null ? `
  <div class="popup-container">
    <h4 class="popup-title">${name}</h4>
    ${subtitle.length > 0 ? `<h5 style="text-align: center">${subtitle}</h5>` : ''}
    <div style="margin-top: 0.5em;" class="v-btn v-btn--block v-btn--elevated v-theme--dark bg-purple v-btn--density-default v-btn--size-small v-btn--variant-elevated" onclick="finishMeasuringOtherMarker(${latLng})">
      <button>Measure to here</button>
    </div>
  </div>
` : `
  <div class="popup-container popup-${subtitle.toLowerCase().replace(' ', '')}">
    <h4 class="popup-title">${name}</h4>
    ${subtitle.length > 0 ? `<h5 style="text-align: center">${subtitle}</h5>` : ''}
    ${subtitle2.length > 0 ? `<h5 style="text-align: center">${subtitle2}</h5>` : ''}
    ${fancySubtitle && fancySubtitle.length > 0 ? `<div style="display: flex; align-items: center; justify-content: center; gap: 0.5em;">${fancySubtitle.map(item => "<span style='" + item.style + "'>" + item.text + "</span>").join(" ")}</div>` : ''}
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="startMeasuringOtherMarker(${latLng})">
        <span class="v-btn__prepend">
            <i class="mdi-pin mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Measure to a pin</button>
        </span>
    </div>
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="mapMeasureDistanceTo(${latLng}, '${name}')">
        <span class="v-btn__prepend">
            <i class="mdi-near-me mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Measure to me</button>
        </span>
    </div>
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="startPinRadar(${latLng})">
        <span class="v-btn__prepend">
            <i class="mdi-radar mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Place radar</button>
        </span>
    </div>
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="startBoundaryLine(${latLng})">
        <span class="v-btn__prepend">
            <i class="mdi-line-scan mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Place boundary</button>
        </span>
    </div>
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="startDistrictBoundary(${latLng})">
        <span class="v-btn__prepend">
            <i class="mdi-hexagon-multiple mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Place district</button>
        </span>
    </div>
    ${subtitle === 'Custom Pin' ? `
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="deleteCustomMarker(${latLng})">
            <span class="v-btn__prepend">
            <i class="mdi-view-dashboard-edit-outline mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Delete</button>
        </span>
    </div>
    ` : `
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="addCell(${latLng})">
        <span class="v-btn__prepend">
            <i class="mdi-chart-pie-outline mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Place cell</button>
        </span>
    </div>
    `}
  </div>
`);

const mapMeasureDistanceTo = (lat: number, long: number, name: string) => {
    locatingPinToMeasureLatLng.value = [
        lat, long
    ]
    locatingPinToMeasureName.value = name
    locate()
}

const startPinRadar = (lat: number, long: number) => {
    pinRadarLatLng.value = [lat, long]
    shouldShowPinRadarDialog.value = true
}

const startBoundaryLine = (lat: number, long: number) => {
    boundaryLineLatLng.value = [lat, long]
    shouldShowBoundaryLineDialog.value = true
}

const startDistrictBoundary = (lat: number, long: number) => {
    districtBoundaryLatLng.value = [lat, long]
    shouldshowDistrictBoundaryDialog.value = true
}

const addCell = (lat: number, long: number) => {
    console.log(`Trying to open add cell dialog for lat=${lat} lng=${long}`)
    const matchingFeatures = regionObj.value?.features.filter(feature => feature.geometry.coordinates[0] === long && feature.geometry.coordinates[1] === lat)!;
    if (matchingFeatures.length !== 1) {
        console.error(`${matchingFeatures.length} features found for feature for lat=${lat} lng=${long}`)
    }
    addCellDialogMarker.value = matchingFeatures[0];
    if (!addCellDialogMarker.value) {
        notify({
            type: "error",
            text: "Something went wrong",
            title: "Error"
        })
    } else {
        showAddCellDialog.value = true;
    }
}

const startMeasuringOtherMarker = (lat: number, long: number) => {
    measuringOtherMarkerState.value = [lat, long]
    updateMarkers();
}

const cancelMeasuringOtherMarker = () => {
    measuringOtherMarkerState.value = null
    updateMarkers();
}

const finishMeasuringOtherMarker = (lat: number, long: number) => {
    measuringOtherMarkerDistanceResult.value = distance(measuringOtherMarkerState.value![0], measuringOtherMarkerState.value![1], lat, long)
    cancelMeasuringOtherMarker()
    measuringOtherMarkerDistanceResultDialog.value = true
}

const deleteCustomMarker = async (lat: number, long: number) => {
    const newObj: GameRecord = JSON.parse(JSON.stringify(gamesObj.value));
    const oldObj: GameRecord = JSON.parse(JSON.stringify(gamesObj.value));
    newObj.customPins = newObj.customPins.filter(item => item.lat != lat || item.long != long);
    await updateGame(
        newObj, oldObj, gamesDbRef.value
    );
}

const submitCell = async (wasHit: boolean) => {
    const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value))
    const newEntries = gamesObj.value?.cellEntries ?? [];
    newEntries.push({
        marketLat: (addCellDialogMarker.value!.geometry as GPoint).coordinates[1],
        marketLng: (addCellDialogMarker.value!.geometry as GPoint).coordinates[0],
        wasHit: wasHit,
        created: new Date().toUTCString(),
        creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown',
    });

    // This is not redundant - Vue compiler will optimize this away if we just use gamesObj.value
    await updateGame({
        cellEntries: newEntries,
        ...gamesObj.value
    } as GameRecord, oldGameObj, gamesDbRef.value);
}

const addDistrictBoundary = async(hit: boolean, lat: number, lng: number, level: number) => {
    if (lat === 0 || lng === 0) {
        lat = districtBoundaryLatLng.value![0]
        lng = districtBoundaryLatLng.value![1]
    }
    const intersection = await region.value.findIntersectingDistrict(new L.LatLng(lat, lng), level);
    if (intersection) {
        const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value))
        const newEntries = gamesObj.value?.districtBoundaries ?? [];
        newEntries.push({
            name: intersection,
            wasHit: hit,
            created: new Date().toUTCString(),
            creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown',
        });

        // This is not redundant - Vue compiler will optimize this away if we just use gamesObj.value
        await updateGame({
            districtBoundaries: newEntries,
            ...gamesObj.value
        } as GameRecord, oldGameObj, gamesDbRef.value);
        notify({
            type: 'success',
            title: "Success",
            text: "Added district boundary"
        })
    } else {
        notify({
            type: 'error',
            title: "Error",
            text: "Could not add boundary - point might not be within any district"
        })
    }
}

const findClosest = (key: string, type: string) => {
    locatingClosestType.value = { key: key, type: type }
    locate()
}

const draw = () => {
    new (L as any).Draw.Polygon(localMap.value!, {}).enable()
    drawingPolygon.value = true
}

const onMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    if (droppingPin.value) {
        const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value));
        const newEntries = gamesObj.value?.customPins ?? [];
        newEntries.push({
            lat: e.latlng.lat,
            long: e.latlng.lng,
            created: new Date().toUTCString(),
            creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown'
        });
        mostRecentlyDroppedPin.value = e.latlng;
        updateGame(
            {
                customPins: newEntries,
                ...gamesObj.value
            } as GameRecord,
            oldGameObj,
            gamesDbRef.value
        );
        droppingPin.value = false
        notify({
            type: 'success',
            title: "Success",
            text: "Added pin"
        })
        showCustomPinLabelEditor.value = true;

        // Auto enable custom pins (clearer UI)
        if (!store.$state.mapMarkers.includes("custom")) {
            store.$state.mapMarkers.push("custom");
        }
    }
}

const startupMapData = (region: Region) => {
    if (localMap.value) {
        // We only want to run this once on startup.
        return;
    }

    // Edge case for vite HMR - somehow it misses this element
    // Might not be needed any more - fixed by calling map.remove() on unmount
    if (!document.getElementById("map")) {
        setTimeout(() => startupMapData(region), 1000);
        return;
    }

    localMap.value = L.map('map', {
        // It's much nicer on mobile to have unlimited zoom granularity, but it feels worse on desktops
        zoomSnap: L.Browser.mobile ? 0 : 0.5
    }).setView([region.center.lat, region.center.lng], 13);  // Region default
    localMap.value.on('locationfound', onLocationFound);
    localMap.value.on('locationerror', onLocationError);
    localMap.value.on('click', onMapClick);
    localMap.value.on('moveend', updateMarkers);
    L.control.scale().addTo(localMap.value);

    localMap.value.on((L as any).Draw.Event.CREATED, function (e) {
        if (e.type == "draw:created" && (e as any).layerType == "polygon") {
            const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value));
            const newEntries = gamesObj.value?.polygonEntries ?? [];

            let newPoly = e.layer.editing.latlngs[e.layer.editing.latlngs.length - 1][0];

            newEntries.push({
                points: newPoly,
                created: new Date().toUTCString(),
                creatorName: userManager.user.value?.providerData[0].displayName ?? 'Unknown',
            });

            updateGame(
                {
                    polygonEntries: newEntries,
                    ...gamesObj.value,
                } as GameRecord,
                oldGameObj,
                gamesDbRef.value
            );
            drawingPolygon.value = false
        }
    });

    // Edge case: if store map layers are from an old version, clear them
    if (store.$state.mapLayers.filter(layer => !(layer in MAP_TILE_LAYERS)).length) {
        store.$state.mapLayers = ["Jawg_Sunny"]  // Just reset
    }

    updateTileLayers(store.$state.mapLayers, localMap.value!);
    updateGameObjects();
    updateMarkers();
    localMap.value!.addLayer(PixiManager.getLayer());
}

onValue(region.value.regionRef.value, (regionRef) => {
    if (!regionRef.exists()) {
        console.log("[Map Startup] Region Ref does not exist - cannot intialize map");
        return;
    }
    nextTick(() => startupMapData(regionRef.val()));
})

// Edge case - when the user first joins the game
watch(toRef(userRecordObj.value?.currentGameId), () => {
    if (userRecordObj.value?.currentGameId && !localMap.value) {
        startupMapData(regionObj.value!);
    }
})

onMounted(() => {
    (window as any)["mapMeasureDistanceTo"] = mapMeasureDistanceTo;
    (window as any)["startPinRadar"] = startPinRadar;
    (window as any)["startBoundaryLine"] = startBoundaryLine;
    (window as any)["startDistrictBoundary"] = startDistrictBoundary;
    (window as any)["startMeasuringOtherMarker"] = startMeasuringOtherMarker;
    (window as any)["finishMeasuringOtherMarker"] = finishMeasuringOtherMarker;
    (window as any)["deleteCustomMarker"] = deleteCustomMarker;
    (window as any)["addCell"] = addCell;
})

onUnmounted(() => {
    if (localMap.value) {
        localMap.value.remove();
    }
})
</script>
