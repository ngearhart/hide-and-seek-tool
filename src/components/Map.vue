<template>
    <MapActionButton @locate="locate" @radar="(hit, lat, long, meters) => addRadar(hit, lat, long, meters)"
        :games-db-obj="gamesObj" :games-db-ref="gamesDbRef" @thermometer="addThermometer"
        @show-pin-drop="droppingPin = true" />
    <div id="map" style="width: 100%; height: 100%"></div>
    <v-snackbar v-model="droppingPin" color="white">
        Tap on the map to drop a pin
        <template v-slot:actions>
            <v-btn color="pink" variant="text" @click="droppingPin = false">
                Cancel
            </v-btn>
        </template>
    </v-snackbar>
    <v-snackbar v-model="locating" color="white">
        Locating <v-progress-circular indeterminate></v-progress-circular>
    </v-snackbar>
    <v-dialog max-width="500" v-model="calculatedDistanceDialog">
        <v-card title="Distance">
            <v-card-text>
                You are roughly {{ calculatedDistance.toLocaleString(undefined, { maximumSignificantDigits: 3 }) }} miles from the selected pin, {{ locatingPinToMeasureName }}.
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L, { type LatLngBoundsExpression, type LatLngTuple, type LeafletEvent } from 'leaflet';

import { onMounted } from 'vue';
import { useStore } from '@/stores/app';
import { distance, metroStationsGeoJSON } from '@/utils';
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
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + (user as any)?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + userRecordObj.value?.currentGameId));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const droppingPin = shallowRef(false);
const locating = shallowRef(false);
const locatingPinToMeasureLatLng = ref<number[] | null>(null);
const locatingPinToMeasureName = ref<string | null>(null);
const calculatedDistanceDialog = shallowRef(false);
const calculatedDistance = shallowRef(0);

store.$subscribe(() => {
    buildMap();
});


const OVERLAY_OPACITY = 0.6;

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
                L.marker([station.geometry.coordinates[1], station.geometry.coordinates[0]]).bindPopup(station.properties.NAME).addTo(localMapVal);
                L.circle([station.geometry.coordinates[1], station.geometry.coordinates[0]], {
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

const onLocationFound = (e: any) => {
    var radius = e.accuracy;

    L.marker(e.latlng).addTo(localMap.value!)
        .bindPopup("You are within " + radius + " meters from this point"); //.openPopup();

    L.circle(e.latlng, { radius: radius }).addTo(localMap.value!);
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
    localMap.value!.locate({ setView: true, maxZoom: 16 });
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

watch(gamesObj, () => {
    buildMap();
    refreshRadar();
    refreshThermometer();
    refreshPolygons();
});

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

// I know this is gross but this is the leaflet canonical way.
const getPopupFor = (latLng: L.LatLngExpression, name: string) => L.popup().setContent(`
  <div class="popup-container">
    <h4 class="popup-title">${name}</h4>
    <div class="v-btn v-btn--elevated v-theme--dark bg-success v-btn--density-default v-btn--size-small v-btn--variant-elevated" onclick="mapMeasureDistanceTo(${latLng}, '${name}')">
      <button>Measure distance from me</button>
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

const getMarkers = (): { [key: string]: L.Marker<any>[] } => ({
    airports: [
        getMarkerFor([38.9495915, -77.4529647], "IAD"),
        getMarkerFor([38.8522923, -77.0478586], "DCA"),
        getMarkerFor([39.1798251, -76.6740408], "BWI"),
    ],
    parks: [
        // getMarkerFor([38.895821860390896, -77.03668592865829], "The President's Park"),
        // getMarkerFor([38.9020378011998, -77.03065419677263], ""),
        // getMarkerFor([], ""),
        // getMarkerFor([], ""),
        // getMarkerFor([], ""),
        // getMarkerFor([], ""),

    ],
    museums: [
        getMarkerFor([38.91575250997534, -77.06377887343598], "Dumbaron Oaks"),
        getMarkerFor([38.9092075405563, -77.04403781615312], "Heurich House"),
        getMarkerFor([38.87406810678351, -76.99562931046825], "Navy Museum"),
        getMarkerFor([38.89932215708013, -77.0078172675733], "National Post Museum"),
        getMarkerFor([38.89947230896292, -77.03906761692508], "Renwick Gallery"),
        getMarkerFor([38.90228262068345, -77.02929629209433], "Planet Word"),
        getMarkerFor([38.89810253688251, -77.02298438040243], "National Portait Gallery"),
        getMarkerFor([38.900109952470046, -77.02462304978398], "Museum of Illusions"),
        getMarkerFor([38.88995420866782, -77.02395544373964], "All the Smithsonians"),
        getMarkerFor([38.88445060596405, -77.02553342166263], "Spy Museum"),
        getMarkerFor([38.881941636669225, -77.10210428709983], "Museum of Contemporary Art"),
        getMarkerFor([38.863117584021296, -77.08867979022914], "Black Heritage Museum of Alrington"),
        getMarkerFor([38.8594083768652, -77.06746042420772], "Arlington Historical Museum"),
        getMarkerFor([38.807715047258895, -77.06598070191826], "Georgia Washington Memorial"),
        getMarkerFor([38.81229644505354, -77.04817083502179], "Alexandria Black History Museum"),
        getMarkerFor([38.86804178224744, -77.23796956303812], "Americans in Wartime Museum"),
        getMarkerFor([38.9121156015897, -77.44438372814301], "Udvar-Hazy Air and Space Museum"),
        getMarkerFor([38.96944555423174, -77.34078536945499], "Reston Museum"),
        getMarkerFor([38.92781593742082, -76.73285894240978], "National Capital Radio & TV Museum"),
        getMarkerFor([38.93141996865738, -76.8755527383585], "NPS Museum"),
        getMarkerFor([38.97924007825148, -76.92236846605186], "College Park Aviation Museum"),
        getMarkerFor([39.00082441880373, -76.88050655942604], "Greenbelt Museum"),
        getMarkerFor([38.9605239900492, -76.93193902062055], "Riversdale House Museum"),
        getMarkerFor([38.93909072638099, -77.08696779312115], "AU Museum"),
        getMarkerFor([38.94746229330003, -77.03274120180363], "14th St Graffiti Museum"),
        getMarkerFor([38.985280970119945, -77.09609639015197], "KID Museum"),
        getMarkerFor([39.02032817242554, -77.12104227183741], "Ratner Museum"),
        getMarkerFor([39.043864235837034, -77.12144733879322], "Josiah Henson Museum"),
        getMarkerFor([39.00904156224916, -77.05291811873266], "National Museum of Health and Medicine"),
        getMarkerFor([39.04517704674693, -77.09851706498299], "The Little towns Children's Museum"),
    ],
    theaters: [
        getMarkerFor([38.880675622100945, -77.1108978844923], "Regal Ballson Quarter"),
        getMarkerFor([38.89083082474452, -77.08497701797307], "AMC Courthouse Plaza"),
        getMarkerFor([38.86263319609901, -77.08652197028216], "Arlington Cinema and Drafthouse"),
        getMarkerFor([38.86931611009224, -77.07090078582357], "Joe Resenthal Theater"),
        getMarkerFor([38.8598261848946, -77.04944311486393], "Alamo Drafthouse"),
        getMarkerFor([38.84164476321713, -77.08926855216498], "AMC Shirlington"),
        getMarkerFor([38.903923548468015, -77.06231771743971], "AMC Georgetown"),
        getMarkerFor([38.882546426396296, -76.99502646131035], "Miracle Theater"),
        getMarkerFor([38.89670948909052, -77.0221489574033], "Burke Theater"),
        getMarkerFor([38.90018301657721, -77.0214623119326], "Regal Gallery Place"),
        getMarkerFor([38.91073615377087, -76.99622809088409], "Angelika Union Market"),
        getMarkerFor([38.919284380491405, -77.02300726424168], "Landmark's Atlantic"),
        getMarkerFor([38.929968215921086, -77.0363968509205], "Suns Cinema"),
        getMarkerFor([38.923825207137625, -76.99794470456085], "Alamo Drafthouse"),
        getMarkerFor([38.96681509643482, -77.07605062685386], "Avalon Theater"),
        getMarkerFor([38.83776724131726, -76.94455801921333], "Marlow Cinema 6"),
        getMarkerFor([38.90244909764338, -76.84847270352029], "AMC Magic Johnson"),
        getMarkerFor([38.97023096100682, -76.95226908033646], "Regal Hyattsville"),
        getMarkerFor([38.989307111670016, -76.94519596136362], "Hoff Theater"),
        getMarkerFor([38.996754088417184, -77.02535095033926], "Regal Majestic"),
        getMarkerFor([39.036213964793, -77.05190387979486], "AMC Wheaton Mall 9"),
        getMarkerFor([39.0849340315063, -77.14956747280709], "Regal Rockville"),
        getMarkerFor([39.024911757170244, -77.1479306528418], "AMC Montgomery"),
        getMarkerFor([39.051327843228044, -77.11755854904122], "IPIC Theaters"),
        getMarkerFor([38.804135892171075, -77.07052520265583], "AMC Hoffman"),
        getMarkerFor([38.87395638755514, -77.22986402952857], "Angelika Mosaic"),
        getMarkerFor([38.918223933641, -77.21869502650178], "AMC Tysons Corner"),
        getMarkerFor([38.92558165021418, -77.22546964246928], "CMX Tysons"),
        getMarkerFor([38.923883783342205, -77.23228972565802], "LOOK Cinema"),
        getMarkerFor([38.846334156552864, -77.27472099410225], "Cinema Arts Theatres"),
        getMarkerFor([38.86081898552548, -77.3573398670365], "Cinemark Fairfax"),
        getMarkerFor([38.95946357359966, -77.35781548777558], "LOOK Reston"),
        getMarkerFor([38.95752950927082, -77.40053074276122], "AMC Worldgate"),
        getMarkerFor([39.00783285332628, -77.4880139910477], "AMC Loudon"),
    ],
    hospitals: [
        getMarkerFor([38.90136677885082, -77.05070036536351], "GW Hospital"),
        getMarkerFor([38.91152642032442, -77.07514352043732], "Georgetown University Hospital"),
        getMarkerFor([38.93718830938889, -77.1090049613609], "Sibley Memorial Hospital"),
        getMarkerFor([38.888855949246036, -77.1273966029512], "VHC Hospital"),
        getMarkerFor([38.91779617993785, -77.02075482788634], "Howard University Hospital"),
        getMarkerFor([38.92936312003568, -77.0144922250602], "MedStar Washington Hospital"),
        getMarkerFor([38.84799486243041, -76.98818624040298], "St. Elizabeth's Psychiatric Hospital"),
        getMarkerFor([38.884655159458035, -76.97290993739328], "DC Department of Behavioral Health Psychiatric Hospital"),
        getMarkerFor([38.90329841176067, -76.84446422632216], "UMD Medical Center"),
        getMarkerFor([38.9202674769539, -76.84971527701919], "Children's National PG County"),
        getMarkerFor([39.0147228081486, -77.03422017289441], "Holy Cross Hospital"),
        getMarkerFor([39.00230379926877, -77.09354566296459], "Walter Reed Military Hospital"),
        getMarkerFor([38.98220600795305, -77.09247605440515], "Children's National"),
        getMarkerFor([38.99845170623881, -77.11054203710631], "Suburban Hospital"),
        getMarkerFor([38.88751315569603, -77.38038894925609], "Fair Oaks Hospital"),
        getMarkerFor([38.96337602179907, -77.36508364671428], "Reston Hospital"),
    ],
    libraries: [
        getMarkerFor([38.89131251250173, -77.08117854194374], "Courthouse Library"),
        getMarkerFor([38.88440248532814, -77.10218138382207], "Central Library"),
        getMarkerFor([38.89962612575689, -77.1049240229677], "Cherrydale Library"),
        getMarkerFor([38.86552288779528, -77.08529250066216], "Columbia Pike Library"),
        getMarkerFor([38.858385543417896, -77.0563504402044], "Aurora Hills Library"),
        getMarkerFor([38.914565713836424, -77.06096962192333], "Georgetown Neighborhood Library"),
        getMarkerFor([38.904568893882136, -77.04718425148086], "West End Neighborhood Library"),
        getMarkerFor([38.918777435485765, -77.09294302038417], "Palisades Neighborhood Library"),
        getMarkerFor([38.88712659555157, -77.13856248668203], "Westover Library"),
        getMarkerFor([38.86467514031413, -77.11882142939919], "Glencarlyn Library"),
        getMarkerFor([38.867281476541706, -77.19452409228965], "Thomas Jefferson Library"),
        getMarkerFor([38.90896986159101, -77.19984559468763], "Tysons-Pimmit Regional Library"),
        getMarkerFor([38.963272573531796, -77.35164127970052], "Reston Regional Library"),
        getMarkerFor([38.972812228101944, -77.38152161144497], "FORTNITE LIBRARY"),
        getMarkerFor([38.98206065386721, -77.43263688461651], "Thelen Memorial Library"),
        getMarkerFor([39.04900043935257, -77.50356799635728], "Ashburn Library"),
        getMarkerFor([38.88565842362796, -77.29143127066187], "Oakton Library"),
        getMarkerFor([38.90296000938762, -77.25924134805797], "Patrick Henry Library"),
        getMarkerFor([38.83035498800598, -77.0685557418645], "James M. Duncan Branch Library"),
        getMarkerFor([38.773545566246874, -77.05816258299689], "Martha Washington Library"),
        getMarkerFor([38.80804681652473, -77.04713790739203], "Kate Waller Barrett Library"),
        getMarkerFor([38.90002268991555, -77.04332171898947], "Gelman Library"),
        getMarkerFor([38.89950312833288, -77.02080518785776], "MLK Jr. Memorial Library"),
        getMarkerFor([38.9132938377028, -77.01855960389045], "Shaw Neighborhood Library"),
        getMarkerFor([38.92037706461303, -77.01412912741439], "Louis Stokes Library"),
        getMarkerFor([38.90446242475326, -77.00909173635257], "Northwest One Neighborhood Library"),
        getMarkerFor([38.894874139157466, -76.99446509483575], "Northeast Neighborhood Libraries"),
        getMarkerFor([38.89090619399777, -77.02347561203511], "Smithsonian Libraries"),
        getMarkerFor([38.88802457107472, -77.00369019653932], "Library of Congress"),
        getMarkerFor([38.88500110332996, -76.99397956316714], "Southeast Neighborhood Library"),
        getMarkerFor([38.87919001497594, -77.01200492636423], "Southwest Library"),
        getMarkerFor([38.8666213199393, -76.97577212357089], "Anacostia Neighborhood Library"),
        getMarkerFor([38.84672422010777, -76.9767431869081], "Parklands-Turner Neighborhood Library"),
        getMarkerFor([38.83534579774677, -76.95159027573115], "Hillcrest Heights Branch Library"),
        getMarkerFor([38.84456537676333, -76.93224745228306], "The Vine Deloria, Jr. Library"),
        getMarkerFor([38.85406479105409, -76.90092362593555], "Spauldings Branch Library"),
        getMarkerFor([38.894746146775184, -76.94473367893586], "Benning Neighborhood Library"),
        getMarkerFor([38.88991504989442, -76.9235864876288], "Capitol View Neighborhood Library"),
        getMarkerFor([38.90890049190265, -76.92993786249235], "Deanwood Neighborhood Library"),
        getMarkerFor([38.90373335959682, -76.9122550574745], "Fairmount Heights Branch Library"),
        getMarkerFor([38.89244705961861, -76.8382715784389], "Largo-Kettering Branch Library"),
        getMarkerFor([38.93101973885937, -76.85715414250586], "Gelnarden Branch Library"),
        getMarkerFor([38.93767632883772, -76.95765920124981], "Mount Rainier Branch Library"),
        getMarkerFor([38.96925120779786, -76.94709888745757], "Hyattsville Branch Library"),
        getMarkerFor([38.97217671747614, -76.92779900363037], "Niels Bohr Library"),
        getMarkerFor([38.98675527918806, -76.94242564450776], "UMD Libraries (Not putting all of them)"),
        getMarkerFor([39.02307067102462, -76.92033395319255], "National Agricultural Library"),
        getMarkerFor([39.01241380061349, -76.89514699788347], "U.S. Court Library"),
        getMarkerFor([38.92828138532035, -76.97641286416045], "Woodridge Neighborhood Library"),
        getMarkerFor([38.90750422953112, -76.98970429358862], "Gallaudet University Library"),
        getMarkerFor([38.93416253795832, -76.99806319097748], "CUA Libraries (Not putting all of them)"),
        getMarkerFor([38.95526847389765, -76.9967085445993], "Lamond-Riggs/Lillian J. Huff Neighborhood Library"),
        getMarkerFor([38.975421108545135, -77.01663015783252], "Takoma Park Neighborhood Library"),
        getMarkerFor([38.980470807736026, -77.02161021312325], "Shepherd Park Neighborhood Library"),
        getMarkerFor([38.995306267876444, -77.02081375679943], "Silver Spring Library"),
        getMarkerFor([39.03035633998297, -77.07956397566404], "Kensington Park Library"),
        getMarkerFor([39.047726183463176, -77.05116102349048], "Wheaton Library"),
        getMarkerFor([38.942974112904295, -77.02395246822613], "Petworth Neighborhood Library"),
        getMarkerFor([38.92263498494708, -77.0156488546636], "Howard Univerity Library"),
        getMarkerFor([38.92147319839417, -77.06454226253311], "James Melville Gilliss Library"),
        getMarkerFor([38.90693051967642, -77.07090081384317], "Georgetown Libraries"),
        getMarkerFor([38.934476626396055, -77.05591968158994], "Cleveland Park Library"),
        getMarkerFor([38.944330662466, -77.0627117704893], "UDC Library"),
        getMarkerFor([38.948339327446924, -77.07817461191433], "Tenly/Friendship Neighborhood Library"),
        getMarkerFor([38.96591597309426, -77.07551836896873], "Chevy Chase Neighborhood Library"),
        getMarkerFor([38.98379030937987, -77.10051982646924], "Bethesda Library"),
        getMarkerFor([38.99611505233992, -77.09740976091476], "National Library of Medicine"),
        getMarkerFor([39.00165774175599, -77.10428397405931], "NIH Library"),
        getMarkerFor([39.02338714899087, -77.12922468723065], "Davis Library"),
        getMarkerFor([39.055036547538826, -77.11976635215501], "Ganga Library"),
        getMarkerFor([39.0980217281643, -77.15885389789618], "Rockville Library"),
    ],
    zoos: [
        getMarkerFor([38.9294104, -77.050833], "National Zoo"),
        getMarkerFor([38.85993941148608, -77.12435888676154], "Willow Pond"),
        getMarkerFor([38.972233345299124, -77.31244360799393], "NOVA Wild"),
        getMarkerFor([39.084451949150115, -77.59311057326165], "Leesburg Animal Park"),
        getMarkerFor([38.77107409602227, -76.87395616926854], "Endless Love Petting"),
    ],
    aquariums: [
        getMarkerFor([38.96757050634614, -77.13891161559403], "Glen Echo Park Aquarium"),
    ],
    custom: gamesObj.value?.customPins?.map(pin =>
        getMarkerFor([pin.lat, pin.long], "Custom Pin")
    ) ?? []
})

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
    }
}

onMounted(async () => {
    localMap.value = L.map('map').setView([38.8929403, -77.0174532], 13);
    localMap.value.on('locationfound', onLocationFound);
    localMap.value.on('locationerror', onLocationError);
    localMap.value.on('click', onMapClick);
    L.control.scale().addTo(localMap.value);

    var drawControl = new (L.Control as any).Draw({
        position: 'topright',
        draw: {
            polyline: false,
            polygon: true,
            circle: false,
            marker: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    localMap.value.addControl(drawControl);

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
        }

        // drawnItems.addLayer(layer);
    });

    buildMap();

    // map.locate({setView: true, maxZoom: 16});
    // function onLocationFound(e) {
    //     var radius = e.accuracy;

    //     console.log(e.latlng);

    //     L.marker(e.latlng).addTo(map)
    //         .bindPopup("You are within " + radius + " meters from this point").openPopup();

    //     L.circle(e.latlng, radius).addTo(map);
    // }

    // map.on('locationfound', onLocationFound);

    (window as any)["mapMeasureDistanceTo"] = mapMeasureDistanceTo
})

</script>
