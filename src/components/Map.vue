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
    ],
    parks: [

    ],
    museums: [

    ],
    theaters: [

    ],
    hospitals: [

    ],
    libraries: [
        L.marker([38.89131251250173, -77.08117854194374]).bindPopup("Courthouse Library"),
        L.marker([38.88440248532814, -77.10218138382207]).bindPopup("Central Library"),
        L.marker([38.89962612575689, -77.1049240229677]).bindPopup("Cherrydale Library"),
        L.marker([38.86552288779528, -77.08529250066216]).bindPopup("Columbia Pike Library"),
        L.marker([38.858385543417896, -77.0563504402044]).bindPopup("Aurora Hills Library"),
        L.marker([38.914565713836424, -77.06096962192333]).bindPopup("Georgetown Neighborhood Library"),
        L.marker([38.904568893882136, -77.04718425148086]).bindPopup("West End Neighborhood Library"),
        L.marker([38.918777435485765, -77.09294302038417]).bindPopup("Palisades Neighborhood Library"),
        L.marker([38.88712659555157, -77.13856248668203]).bindPopup("Westover Library"),
        L.marker([38.86467514031413, -77.11882142939919]).bindPopup("Glencarlyn Library"),
        L.marker([38.867281476541706, -77.19452409228965]).bindPopup("Thomas Jefferson Library"),
        L.marker([38.90896986159101, -77.19984559468763]).bindPopup("Tysons-Pimmit Regional Library"),
        L.marker([38.963272573531796, -77.35164127970052]).bindPopup("Reston Regional Library"),
        L.marker([38.972812228101944, -77.38152161144497]).bindPopup("FORTNITE LIBRARY"),
        L.marker([38.98206065386721, -77.43263688461651]).bindPopup("Thelen Memorial Library"),
        L.marker([39.04900043935257, -77.50356799635728]).bindPopup("Ashburn Library"),
        L.marker([38.88565842362796, -77.29143127066187]).bindPopup("Oakton Library"),
        L.marker([38.90296000938762, -77.25924134805797]).bindPopup("Patrick Henry Library"),
        L.marker([38.83035498800598, -77.0685557418645]).bindPopup("James M. Duncan Branch Library"),
        L.marker([38.773545566246874, -77.05816258299689]).bindPopup("Martha Washington Library"),
        L.marker([38.80804681652473, -77.04713790739203]).bindPopup("Kate Waller Barrett Library"),
        L.marker([38.90002268991555, -77.04332171898947]).bindPopup("Gelman Library"),
        L.marker([38.89950312833288, -77.02080518785776]).bindPopup("MLK Jr. Memorial Library"),
        L.marker([38.9132938377028, -77.01855960389045]).bindPopup("Shaw Neighborhood Library"),
        L.marker([38.92037706461303, -77.01412912741439]).bindPopup("Louis Stokes Library"),
        L.marker([38.90446242475326, -77.00909173635257]).bindPopup("Northwest One Neighborhood Library"),
        L.marker([38.894874139157466, -76.99446509483575]).bindPopup("Northeast Neighborhood Libraries"),
        L.marker([38.89090619399777, -77.02347561203511]).bindPopup("Smithsonian Libraries"),
        L.marker([38.88802457107472, -77.00369019653932]).bindPopup("Library of Congress"),
        L.marker([38.88500110332996, -76.99397956316714]).bindPopup("Southeast Neighborhood Library"),
        L.marker([38.87919001497594, -77.01200492636423]).bindPopup("Southwest Library"),
        L.marker([38.8666213199393, -76.97577212357089]).bindPopup("Anacostia Neighborhood Library"),
        L.marker([38.84672422010777, -76.9767431869081]).bindPopup("Parklands-Turner Neighborhood Library"),
        L.marker([38.83534579774677, -76.95159027573115]).bindPopup("Hillcrest Heights Branch Library"),
        L.marker([38.84456537676333, -76.93224745228306]).bindPopup("The Vine Deloria, Jr. Library"),
        L.marker([38.85406479105409, -76.90092362593555]).bindPopup("Spauldings Branch Library"),
        L.marker([38.894746146775184, -76.94473367893586]).bindPopup("Benning Neighborhood Library"),
        L.marker([38.88991504989442, -76.9235864876288]).bindPopup("Capitol View Neighborhood Library"),
        L.marker([38.90890049190265, -76.92993786249235]).bindPopup("Deanwood Neighborhood Library"),
        L.marker([38.90373335959682, -76.9122550574745]).bindPopup("Fairmount Heights Branch Library"),
        L.marker([38.89244705961861, -76.8382715784389]).bindPopup("Largo-Kettering Branch Library"),
        L.marker([38.93101973885937, -76.85715414250586]).bindPopup("Gelnarden Branch Library"),
        L.marker([38.93767632883772, -76.95765920124981]).bindPopup("Mount Rainier Branch Library"),
        L.marker([38.96925120779786, -76.94709888745757]).bindPopup("Hyattsville Branch Library"),
        L.marker([38.97217671747614, -76.92779900363037]).bindPopup("Niels Bohr Library"),
        L.marker([38.98675527918806, -76.94242564450776]).bindPopup("UMD Libraries (Not putting all of them)"),
        L.marker([39.02307067102462, -76.92033395319255]).bindPopup("National Agricultural Library"),
        L.marker([39.01241380061349, -76.89514699788347]).bindPopup("U.S. Court Library"),
        L.marker([38.92828138532035, -76.97641286416045]).bindPopup("Woodridge Neighborhood Library"),
        L.marker([38.90750422953112, -76.98970429358862]).bindPopup("Gallaudet University Library"),
        L.marker([38.93416253795832, -76.99806319097748]).bindPopup("CUA Libraries (Not putting all of them)"),
        L.marker([38.95526847389765, -76.9967085445993]).bindPopup("Lamond-Riggs/Lillian J. Huff Neighborhood Library"),
        L.marker([38.975421108545135, -77.01663015783252]).bindPopup("Takoma Park Neighborhood Library"),
        L.marker([38.980470807736026, -77.02161021312325]).bindPopup("Shepherd Park Neighborhood Library"),
        L.marker([38.995306267876444, -77.02081375679943]).bindPopup("Silver Spring Library"),
        L.marker([39.03035633998297, -77.07956397566404]).bindPopup("Kensington Park Library"),
        L.marker([39.047726183463176, -77.05116102349048]).bindPopup("Wheaton Library"),
        L.marker([38.942974112904295, -77.02395246822613]).bindPopup("Petworth Neighborhood Library"),
        L.marker([38.92263498494708, -77.0156488546636]).bindPopup("Howard Univerity Library"),
        L.marker([38.92147319839417, -77.06454226253311]).bindPopup("James Melville Gilliss Library"),
        L.marker([38.90693051967642, -77.07090081384317]).bindPopup("Georgetown Libraries"),
        L.marker([38.934476626396055, -77.05591968158994]).bindPopup("Cleveland Park Library"),
        L.marker([38.944330662466, -77.0627117704893]).bindPopup("UDC Library"),
        L.marker([38.948339327446924, -77.07817461191433]).bindPopup("Tenly/Friendship Neighborhood Library"),
        L.marker([38.96591597309426, -77.07551836896873]).bindPopup("Chevy Chase Neighborhood Library"),
        L.marker([38.98379030937987, -77.10051982646924]).bindPopup("Bethesda Library"),
        L.marker([38.99611505233992, -77.09740976091476]).bindPopup("National Library of Medicine"),
        L.marker([39.00165774175599, -77.10428397405931]).bindPopup("NIH Library"),
        L.marker([39.02338714899087, -77.12922468723065]).bindPopup("Davis Library"),
        L.marker([39.055036547538826, -77.11976635215501]).bindPopup("Ganga Library"),
        L.marker([39.0980217281643, -77.15885389789618]).bindPopup("Rockville Library"),
    ],
    zoos: [
        L.marker([38.9294104,-77.050833]).bindPopup("National Zoo"),
        L.marker([38.85993941148608, -77.12435888676154]).bindPopup("Willow Pond"),
        L.marker([38.972233345299124, -77.31244360799393]).bindPopup("NOVA Wild"),
        L.marker([39.084451949150115, -77.59311057326165]).bindPopup("Leesburg Animal Park"),
        L.marker([38.77107409602227, -76.87395616926854]).bindPopup("Endless Love Petting"),
    ],
    aquariums: [
        L.marker([38.96757050634614, -77.13891161559403]).bindPopup("Glen Echo Park Aquarium"),
    ],
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
