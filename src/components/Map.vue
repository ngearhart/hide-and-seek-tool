<template>
    <MapActionButton />
    <div id="map" style="width: 100%; height: 100%"></div>
</template>

<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { onMounted } from 'vue';
import { useStore } from '@/stores/app';

const store = useStore();
const localMap = shallowRef<L.Map | null>(null);

store.$subscribe(() => {
    buildMap();
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

        store.$state.mapMarkers.forEach(marker => {
            markers[marker].forEach(m => m.addTo(localMapVal));
        })
    }
}

const markers: {[key: string]: L.Marker<any>[]} = {
    airports: [
        L.marker([38.9495915,-77.4529647]).bindPopup("IAD"),
        L.marker([38.8522923,-77.0478586]).bindPopup("DCA"),
        L.marker([39.1798251,-76.6740408]).bindPopup("BWI"),
    ]
}

onMounted(() => {
    localMap.value = L.map('map').setView([38.8929403, -77.0174532], 13);

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
})

</script>
