<template>
    <MapActionButton @locate="locate" @radar="(hit, lat, long, meters) => addRadar(hit, lat, long, meters)"
        :games-db-obj="gamesObj" :games-db-ref="gamesDbRef" @thermometer="addThermometer"
        @show-pin-drop="droppingPin = true" @find-closest="findClosest" @draw="draw" @reset="shouldConfirmDeleteDialogShow = true"
        v-if="!droppingPin && !locating && !drawingPolygon"/>
    <div id="map" style="width: 100%; height: 100%"></div>
    <v-snackbar v-model="droppingPin" color="green" :close-on-content-click="false" timeout="-1">
        Tap on the map to drop a pin
        <template v-slot:actions>
            <v-btn color="pink" variant="text" @click="droppingPin = false">
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
        </v-card>
    </v-dialog>
    <v-dialog max-width="500" v-model="findClosestDialog">
        <v-card title="Distance">
            <v-card-text>
                Your closest {{ findClosestResult.type }}, {{ findClosestResult.name }}, is roughly {{
                    findClosestResult.distance.toLocaleString(undefined, { maximumSignificantDigits: 3 }) }} miles from you.
            </v-card-text>
        </v-card>
    </v-dialog>
    <radar post-title="Pin" v-model="shouldShowPinRadarDialog"
        @hit-fail="(lat, lng, meters) => onPinRadar(false, 0, 0, meters)"
        @hit-success="(lat, lng, meters) => onPinRadar(true, 0, 0, meters)"></radar>
    <BoundaryLine post-title="Pin" v-model="shouldShowBoundaryLineDialog"
        @submit="(lat, lng, degrees) => addBoundaryLine(boundaryLineLatLng![0], boundaryLineLatLng![1], degrees)">
    </BoundaryLine>
    <ConfirmDelete :games-db-obj="gamesObj" :games-db-ref="gamesDbRef" v-model="shouldConfirmDeleteDialogShow"></ConfirmDelete>
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L, { type LatLngBoundsExpression, type LatLngTuple, type LeafletEvent } from 'leaflet';

import { onMounted } from 'vue';
import { useStore } from '@/stores/app';
import { distance, metroStationsGeoJSON, rotatePoint, staticMarkers, staticMarkersIncludingMetroStations } from '@/utils';
import { notify } from '@kyvg/vue3-notification';
import { getDatabase, ref as dbRef, push, set, get } from 'firebase/database';
import { useDatabaseObject } from 'vuefire';

import { useCurrentUserMock } from '@/firebase/mock';
import type { GameRecord, UserRecord } from '@/utils';

import 'leaflet-draw';
import '../styles/leaflet.draw.css';

const store = useStore();
const localMap = shallowRef<L.Map | null>(null);

const drawnItems = reactive(new L.FeatureGroup());
const user = useCurrentUserMock();
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user.value?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + userRecordObj.value?.currentGameId));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

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

const OVERLAY_OPACITY = 0.6;


store.$subscribe(() => {
    buildMap();
    refreshRadar();
    refreshThermometer();
    refreshPolygons();
    refreshBoundaryLines();
});

watch(gamesObj, () => {
    buildMap();
    refreshRadar();
    refreshThermometer();
    refreshPolygons();
    refreshBoundaryLines();
});


const buildMap = () => {
    if (localMap) {
        console.info("Rebuilding map with layers " + store.$state.mapLayers)
        const localMapVal = localMap.value!;
        localMapVal.eachLayer(layer => layer.remove());
        store.$state.mapLayers.forEach(layer => {
            if (layer == "CartoDB_DarkMatter") {
                var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20
                });
                CartoDB_DarkMatter.addTo(localMapVal);
            } else if (layer == "OpenRailwayMap") {
                var OpenRailwayMap = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                });
                OpenRailwayMap.addTo(localMapVal);
            } else if (layer == "Esri_WorldImagery") {
                var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                });
                Esri_WorldImagery.addTo(localMapVal);
            } else if (layer == "Jawg.Matrix") {
                var Jawg_Matrix = L.tileLayer('https://tile.jawg.io/jawg-matrix/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
                    attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    minZoom: 0,
                    maxZoom: 22,
                    accessToken: '2mOYvuNmhK7nVC5H0StYF6OmHWF3cfdnzxDcuNNh4iq3K8IoslHbtI5PmSsbgLPV'
                } as any);
                Jawg_Matrix.addTo(localMapVal);
            } else if (layer == "Jawg.Sunny") {
                var Jawg_Sunny = L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
                    attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    minZoom: 0,
                    maxZoom: 22,
                    accessToken: '2mOYvuNmhK7nVC5H0StYF6OmHWF3cfdnzxDcuNNh4iq3K8IoslHbtI5PmSsbgLPV'
                } as any);
                Jawg_Sunny.addTo(localMapVal);
            }
        });

        // Dynamically get markers, needed for loading custom markers.
        let markers = getMarkers();
        store.$state.mapMarkers.forEach(marker => {
            markers[marker].forEach(m => m.addTo(localMapVal));
        })

        if (store.$state.enableStationCircles) {
            metroStationsGeoJSON.features.forEach(station => {
                let latlng: L.LatLngExpression = [station.geometry.coordinates[1], station.geometry.coordinates[0]];
                L.marker(latlng).bindPopup(getPopupFor(
                    latlng, station.properties.NAME, `Lines: ${station.properties.LINE}`
                )).addTo(localMapVal);
                L.circle(latlng, {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.2,
                    radius: 402.336, // quarter mile in meters
                }).addTo(localMapVal);
            });
        }


        localMapVal.addLayer(drawnItems as any);
    }
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
        for (let marker of (staticMarkersIncludingMetroStations as any)[locatingClosestType.value.key]) {
            let d = distance(e.latlng.lat, e.latlng.lng, marker.latlng[0], marker.latlng[1])
            if (d < minDistanceMiles) {
                minDistanceMiles = d
                minDistanceName = marker.name
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
    const newEntries = gamesObj.value?.thermometerEntries ?? [];
    newEntries.push({
        lat: lat,
        long: long,
        hotter: hotter,
        angle: angle,
        created: new Date().toUTCString()
    });

    await set(
        gamesDbRef.value, {
        thermometerEntries: newEntries,
        ...gamesObj.value
    }
    );
};


const addRadar = async (hit: boolean, lat: number, long: number, meters: number) => {
    const newEntries = gamesObj.value?.radarEntries ?? [];
    newEntries.push({
        lat: lat,
        long: long,
        hit: hit,
        meters: meters,
        created: new Date().toUTCString()
    });

    await set(
        gamesDbRef.value, {
        radarEntries: newEntries,
        ...gamesObj.value
    }
    );
};

const addBoundaryLine = async (lat: number, long: number, degrees: number) => {
    const newEntries = gamesObj.value?.boundaryLineEntries ?? [];
    newEntries.push({
        lat: lat,
        long: long,
        degrees: degrees,
        created: new Date().toUTCString()
    });

    await set(
        gamesDbRef.value, {
        boundaryLineEntries: newEntries,
        ...gamesObj.value
    }
    );
}

const displayRadar = (hit: boolean, lat: number, long: number, meters: number) => {
    if (hit) {
        console.log("Adding radar hit");
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
        svgElement.setAttribute('viewBox', "0 0 100 100");
        svgElement.innerHTML = `<mask id="circle-mask"><rect width="100" height="100" fill="white"/><circle cx="50" cy="50" r="10" fill="black"/></mask><rect width="100" height="100" fill="black" opacity="${OVERLAY_OPACITY}" mask="url(#circle-mask)"/>`;
        // 0.093 SVG units per mile
        // 1609.344 meters per mile
        const offset = 0.095 * meters / 1609.344;
        console.log(offset);
        const svgElementBounds: LatLngBoundsExpression = [
            [lat - offset, long - offset],
            [lat + offset, long + offset]
        ];
        L.svgOverlay(svgElement, svgElementBounds).addTo(localMap.value!);

        // also add extra squares
        // west
        L.polygon([
            [lat - 1, long - offset],
            [lat + 1, long - offset],
            [lat + 1, long - offset - 1],
            [lat - 1, long - offset - 1],
        ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
        // east
        L.polygon([
            [lat - 1, long + offset],
            [lat + 1, long + offset],
            [lat + 1, long + offset + 1],
            [lat - 1, long + offset + 1],
        ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
        // north
        L.polygon([
            [lat + offset / 1.28, long - offset],
            [lat + offset / 1.28, long + offset],
            [lat + offset + 1, long + offset],
            [lat + offset + 1, long - offset],
        ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', stroke: false }).addTo(localMap.value!);
        // south
        L.polygon([
            [lat - offset / 1.28, long - offset],
            [lat - offset / 1.28, long + offset],
            [lat - offset - 1, long + offset],
            [lat - offset - 1, long - offset],
        ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
    } else {
        console.log("Adding radar miss");
        L.circle([lat, long], {
            stroke: false,
            fillColor: 'black',
            fillOpacity: OVERLAY_OPACITY,
            radius: meters,
        }).addTo(localMap.value!);
    }
};

const displayThermometer = (lat: number, long: number, angle: number, hotter: boolean) => {
    // // If angle = 0 and hotter
    // const a = 0;
    // L.polygon([
    //     [lat - 1 * Math.sin(a), long],
    //     [lat + 1 * Math.sin(a), long],
    //     [lat + 1 * Math.sin(a), long + 1 * Math.cos(a)],
    //     [lat - 1 * Math.sin(a), long + 1 * Math.cos(a)],
    // ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
};

const refreshRadar = () => {
    if (gamesObj.value?.radarEntries && gamesObj.value!.radarEntries.length > 0) {
        gamesObj.value!.radarEntries.forEach(radarEntry => {
            displayRadar(radarEntry.hit, radarEntry.lat, radarEntry.long, radarEntry.meters);
        });
    }
}

const refreshThermometer = () => {
    if (gamesObj.value?.thermometerEntries && gamesObj.value!.thermometerEntries.length > 0) {
        gamesObj.value!.thermometerEntries.forEach(themometerEntry => {
            displayThermometer(themometerEntry.lat, themometerEntry.long, themometerEntry.angle, themometerEntry.hotter);
        });
    }
}

const refreshPolygons = () => {
    if (gamesObj.value?.polygonEntries && gamesObj.value!.polygonEntries.length > 0) {
        gamesObj.value!.polygonEntries.forEach(polygonEntry => {
            L.polygon(polygonEntry.points).addTo(localMap.value!);
        });
    }
}

const refreshBoundaryLines = () => {
    if (gamesObj.value?.boundaryLineEntries && gamesObj.value!.boundaryLineEntries.length > 0) {
        // So sorry for this garbage implementation
        gamesObj.value!.boundaryLineEntries.forEach(boundaryLine => {
            if ((boundaryLine.degrees - 45) % 90 === 0) {
                const a = boundaryLine.degrees;
                let delta = 0.2;
                let x = boundaryLine.lat;
                let y = boundaryLine.long;
                let midPoint = [x, y];
                let offsetPointEast = [x, y + delta];
                let offsetPointNorth = [x + delta, y];
                let offsetPointWest = [x, y - delta];
                let offsetPointSouth = [x - delta, y];
                L.polygon([
                    // // [boundaryLine.lat, boundaryLine.long],
                    // // [boundaryLine.lat + 1 * Math.cos(a), boundaryLine.long],
                    // // [boundaryLine.lat + 1 * Math.cos(a), boundaryLine.long + 1 * Math.cos(a)],
                    // // [boundaryLine.lat, boundaryLine.long + 1 * Math.cos(a)],
                    
                    // // [x, y],
                    // // [x + Math.cos(a) + Math.sin(a), y],
                    // // [x + Math.cos(a) + Math.sin(a), y + Math.cos(a) - Math.sin(a)],
                    // // [x, y + Math.cos(a) - Math.sin(a)],
                    // [x, y],
                    rotatePoint(offsetPointEast, midPoint, a),
                    rotatePoint(offsetPointNorth, midPoint, a),
                    // rotatePoint(offsetPointWest, midPoint, a),
                    rotatePoint(offsetPointSouth, midPoint, a),

                ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
            } else if (boundaryLine.degrees === 0) {
                L.rectangle([
                    [boundaryLine.lat - 1, boundaryLine.long],
                    [boundaryLine.lat + 1, boundaryLine.long + 1],

                ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
            } else if (boundaryLine.degrees === 90) {
                L.rectangle([
                    [boundaryLine.lat, boundaryLine.long - 1],
                    [boundaryLine.lat + 1, boundaryLine.long + 1],

                ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
            } else if (boundaryLine.degrees === 180) {
                L.rectangle([
                    [boundaryLine.lat - 1, boundaryLine.long],
                    [boundaryLine.lat + 1, boundaryLine.long - 1],

                ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
            } else if (boundaryLine.degrees === 270) {
                L.rectangle([
                    [boundaryLine.lat, boundaryLine.long + 1],
                    [boundaryLine.lat - 1, boundaryLine.long - 1],

                ], { fillOpacity: OVERLAY_OPACITY, fillColor: 'black', color: 'black', stroke: false }).addTo(localMap.value!);
            }
        });
    }
}

// I know this is gross but this is the leaflet canonical way.
const getPopupFor = (latLng: L.LatLngExpression, name: string, subtitle: string = "") => L.popup().setContent(`
  <div class="popup-container">
    <h4 class="popup-title">${name}</h4>
    ${subtitle.length > 0 ? `<h5 style="text-align: center">${subtitle}</h5>` : ''}
    <div style="margin-top: 0.5em;" class="v-btn v-btn--block v-btn--elevated v-theme--dark bg-success v-btn--density-default v-btn--size-small v-btn--variant-elevated" onclick="mapMeasureDistanceTo(${latLng}, '${name}')">
      <button>Measure distance from me</button>
    </div>
    <div style="margin-top: 1em;" class="v-btn v-btn--block v-btn--elevated v-theme--dark bg-error v-btn--density-default v-btn--size-small v-btn--variant-elevated" onclick="startPinRadar(${latLng})">
      <button>Add radar</button>
    </div>
    <div style="margin-top: 1em;" class="v-btn v-btn--block v-btn--elevated v-theme--dark bg-primary v-btn--density-default v-btn--size-small v-btn--variant-elevated" onclick="startBoundaryLine(${latLng})">
      <button>Add boundary line</button>
    </div>
  </div>
`)

const getMarkerFor = (latLng: L.LatLngExpression, name: string) => L.marker(latLng).bindPopup(getPopupFor(latLng, name))

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

const findClosest = (key: string, type: string) => {
    locatingClosestType.value = { key: key, type: type }
    locate()
}

const getMarkers = (): { [key: string]: L.Marker<any>[] } => ({
    airports: staticMarkers.airports.map(marker => getMarkerFor(marker.latlng, marker.name)),
    parks: [],
    museums: staticMarkers.museums.map(marker => getMarkerFor(marker.latlng, marker.name)),
    theaters: staticMarkers.theaters.map(marker => getMarkerFor(marker.latlng, marker.name)),
    hospitals: staticMarkers.hospitals.map(marker => getMarkerFor(marker.latlng, marker.name)),
    libraries: staticMarkers.libraries.map(marker => getMarkerFor(marker.latlng, marker.name)),
    zoos: staticMarkers.zoos.map(marker => getMarkerFor(marker.latlng, marker.name)),
    aquariums: staticMarkers.aquariums.map(marker => getMarkerFor(marker.latlng, marker.name)),
    custom: gamesObj.value?.customPins?.map(pin =>
        getMarkerFor([pin.lat, pin.long], "Custom Pin")
    ) ?? [],
})

const draw = () => {
    new (L as any).Draw.Polygon(localMap.value!, {}).enable()
    drawingPolygon.value = true
}

const onMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    if (droppingPin.value) {
        const newEntries = gamesObj.value?.customPins ?? [];
        newEntries.push({
            lat: e.latlng.lat,
            long: e.latlng.lng,
            created: new Date().toUTCString()
        });
        set(
            gamesDbRef.value, {
            customPins: newEntries,
            ...gamesObj.value
        });
        droppingPin.value = false
        notify({
            type: 'success',
            title: "Success",
            text: "Added pin"
        })

        // Auto enable custom pins (clearer UI)
        if (!store.$state.mapMarkers.includes("custom")) {
            store.$state.mapMarkers.push("custom");
        }
    }
}

onMounted(async () => {
    localMap.value = L.map('map').setView([38.8929403, -77.0174532], 13);
    localMap.value.on('locationfound', onLocationFound);
    localMap.value.on('locationerror', onLocationError);
    localMap.value.on('click', onMapClick);
    L.control.scale().addTo(localMap.value);

    // var drawControl = new (L.Control as any).Draw({
    //     position: 'topright',
    //     draw: {
    //         polyline: false,
    //         polygon: true,
    //         circle: false,
    //         marker: false
    //     },
    //     edit: {
    //         featureGroup: drawnItems,
    //         remove: true
    //     }
    // });
    // localMap.value.addControl(drawControl);

    localMap.value.on((L as any).Draw.Event.CREATED, function (e) {
        // var type = e.layerType,
        //         layer = e.layer;

        // if (type === 'marker') {
        //     layer.bindPopup('A popup!');
        // }

        console.log(e);
        if (e.type == "draw:created" && (e as any).layerType == "polygon") {
            const newEntries = gamesObj.value?.polygonEntries ?? [];
            newEntries.push({
                points: e.layer.editing.latlngs,
                created: new Date().toUTCString()
            });

            set(
                gamesDbRef.value, {
                polygonEntries: newEntries,
                ...gamesObj.value
            }
            );
            drawingPolygon.value = false
        }

        // drawnItems.addLayer(layer);
    });

    buildMap();
    refreshRadar();
    refreshThermometer();
    refreshPolygons();
    refreshBoundaryLines();

    // map.locate({setView: true, maxZoom: 16});
    // function onLocationFound(e) {
    //     var radius = e.accuracy;

    //     console.log(e.latlng);

    //     L.marker(e.latlng).addTo(map)
    //         .bindPopup("You are within " + radius + " meters from this point").openPopup();

    //     L.circle(e.latlng, radius).addTo(map);
    // }

    // map.on('locationfound', onLocationFound);

    (window as any)["mapMeasureDistanceTo"] = mapMeasureDistanceTo;
    (window as any)["startPinRadar"] = startPinRadar;
    (window as any)["startBoundaryLine"] = startBoundaryLine;
})

</script>
