<template>
    <MapActionButton @locate="locate" @radar="(hit, lat, long, meters) => addRadar(hit, lat, long, meters)"
        :games-db-obj="gamesObj" :games-db-ref="gamesDbRef" @thermometer="addThermometer"
        @show-pin-drop="droppingPin = true" @find-closest="findClosest" @draw="draw"
        @reset="shouldConfirmDeleteDialogShow = true" v-if="!droppingPin && !locating && !drawingPolygon" />
    <div id="map" style="width: 100%; height: 100%"></div>
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
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L, { type LatLngBoundsExpression } from 'leaflet';

import { onMounted } from 'vue';
import { useStore } from '@/stores/app';
import { distance, rotatePoint } from '@/utils';
import { notify } from '@kyvg/vue3-notification';
import { getDatabase, ref as dbRef, set } from 'firebase/database';
import { useDatabaseObject } from 'vuefire';

import { useCurrentUserMock } from '@/firebase/mock';
import type { GameRecord, UserRecord } from '@/utils';

import 'leaflet-draw';
import '../styles/leaflet.draw.css';
import { flipCoords, loadRegion } from '@/regions/regions';
import { getIconFor } from '@/regions/icons';
import { getFeatureMarkers, type FeatureType, type GetPopupFunction } from '@/regions/features';
import { updateGame } from '@/game';
import addPixiOverlay, { PixiOverlay } from '@/graphics/main';
import { updateTileLayers } from '@/graphics/mapTiles';
import { storeToRefs } from 'pinia';

const store = useStore();
const localMap = shallowRef<L.Map | null>(null);

const drawnItems = reactive(new L.FeatureGroup());
const user = useCurrentUserMock();
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user.value?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + userRecordObj.value?.currentGameId));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

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

const findClosestDialog = shallowRef(false);
const findClosestResult = ref({ name: "", type: "", distance: 0 })

const drawingPolygon = shallowRef(false);

const shouldConfirmDeleteDialogShow = shallowRef(false);

const measuringOtherMarkerState = ref<number[] | null>()
const measuringOtherMarkerDistanceResultDialog = shallowRef(false)
const measuringOtherMarkerDistanceResult = shallowRef(0)


watch(storeToRefs(store).mapLayers, () => updateTileLayers(store.$state.mapLayers, localMap.value!))
watch(storeToRefs(store).mapMarkers, () => updateMarkers())
watch(gamesObj, () => updateGameObjects())

let previousMarkers: L.Marker<any>[] = [];

const updateMarkers = () => {
    previousMarkers.forEach(m => m.remove());
    let markers = getFeatureMarkers(getPopupFor, gamesObj);
    previousMarkers = Object.values(markers).flat();
    store.$state.mapMarkers.forEach(marker => {
        markers[marker as FeatureType].forEach(m => {
            if (marker == "stations") {
                L.circle(m.getLatLng(), {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.2,
                    radius: 402.336, // quarter mile in meters
                }).addTo(localMap.value!);
            }
            m.addTo(localMap.value!);
        });
    });
}

const updateGameObjects = () => {
    updateMarkers();
    PixiOverlay.update(gamesObj.value!);
    localMap.value!.addLayer(PixiOverlay.getLayer());
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
        for (let marker of store.getMarkers(locatingClosestType.value.key as FeatureType)) {
            let d = distance(e.latlng.lat, e.latlng.lng, marker.geometry.coordinates[1], marker.geometry.coordinates[0])
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
        creatorName: user.value?.providerData[0].displayName ?? 'Unknown',
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
        creatorName: user.value?.providerData[0].displayName ?? 'Unknown'
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
        creatorName: user.value?.providerData[0].displayName ?? 'Unknown',
    });

    await updateGame({
        boundaryLineEntries: newEntries,
        ...gamesObj.value
    } as GameRecord, oldGameObj, gamesDbRef.value);
}

const refreshPolygons = () => {
    if (gamesObj.value?.polygonEntries && gamesObj.value!.polygonEntries.length > 0) {
        gamesObj.value!.polygonEntries.forEach(polygonEntry => {
            L.polygon(polygonEntry.points).addTo(localMap.value!);
        });
    }
}

const popupButtonClasses = "v-btn v-btn--block v-btn--elevated v-btn--spaced v-btn--spaced-start v-theme--dark v-btn--density-default v-btn--size-small v-btn--variant-elevated cursor-pointer dialog-button";

// I know this is gross but this is the leaflet canonical way.
const getPopupFor: GetPopupFunction = (latLng: L.LatLngExpression, name: string, subtitle: string = "", subtitle2: string = "") => L.popup().setContent(measuringOtherMarkerState.value != null ? `
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
    <div style="margin-top: 1em;" class="${popupButtonClasses}" onclick="">
        <span class="v-btn__prepend">
            <i class="mdi-chart-pie-outline mdi v-icon notranslate v-theme--dark v-icon--size-default" aria-hidden="true"></i>
        </span>
        <span class="v-btn__content" data-no-activator="">
            <button>Add cell</button>
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
    ` : ''}
  </div>
`)

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
            creatorName: user.value?.providerData[0].displayName ?? 'Unknown'
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

onMounted(async () => {
    if (store.$state.loadedRegionData && store.$state.loadedRegionData?.name != gamesObj.value?.region) {
        // There is an odd case where the wrong region is loaded
        ensureRegionLoaded();
    }
    localMap.value = L.map('map').setView(flipCoords(store.$state.loadedRegionData?.center || [0, 0]), 13);  // Region default
    localMap.value.on('locationfound', onLocationFound);
    localMap.value.on('locationerror', onLocationError);
    localMap.value.on('click', onMapClick);
    L.control.scale().addTo(localMap.value);

    localMap.value.on((L as any).Draw.Event.CREATED, function (e) {
        if (e.type == "draw:created" && (e as any).layerType == "polygon") {
            const oldGameObj = JSON.parse(JSON.stringify(gamesObj.value));
            const newEntries = gamesObj.value?.polygonEntries ?? [];
            newEntries.push({
                points: e.layer.editing.latlngs,
                created: new Date().toUTCString(),
                creatorName: user.value?.providerData[0].displayName ?? 'Unknown',
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

    updateTileLayers(store.$state.mapLayers, localMap.value!);
    updateGameObjects();
    updateMarkers();
    localMap.value!.addLayer(PixiOverlay.getLayer());

    (window as any)["mapMeasureDistanceTo"] = mapMeasureDistanceTo;
    (window as any)["startPinRadar"] = startPinRadar;
    (window as any)["startBoundaryLine"] = startBoundaryLine;
    (window as any)["startMeasuringOtherMarker"] = startMeasuringOtherMarker;
    (window as any)["finishMeasuringOtherMarker"] = finishMeasuringOtherMarker;
    (window as any)["deleteCustomMarker"] = deleteCustomMarker;
})

const ensureRegionLoaded = () => {
    const regionId = store.$state.regions.find(region => region.name === gamesObj.value?.region)!.path;
    loadRegion(regionId).then((region) => {
        store.$state.loadedRegionData = region;
        // If we do not recenter here, the user will be stuck on null island (0, 0) until they reload
        localMap.value!.setView(flipCoords(store.$state.loadedRegionData!.center), 13);
    })
}

</script>
