import { Map, tileLayer } from "leaflet";

export const MAP_TILE_LAYERS = {
    CartoDB_DarkMatter: tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }),
    OpenRailwayMap: tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        attribution: '&copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }),
    Esri_WorldImagery: tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    Jawg_Matrix: tileLayer('https://tile.jawg.io/jawg-matrix/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
        attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 0,
        maxZoom: 22,
        accessToken: '2mOYvuNmhK7nVC5H0StYF6OmHWF3cfdnzxDcuNNh4iq3K8IoslHbtI5PmSsbgLPV'
    } as any),
    Jawg_Sunny: tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
        attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 0,
        maxZoom: 22,
        accessToken: '2mOYvuNmhK7nVC5H0StYF6OmHWF3cfdnzxDcuNNh4iq3K8IoslHbtI5PmSsbgLPV'
    } as any),
};

export type MapTileLayerType = keyof typeof MAP_TILE_LAYERS;

export function updateTileLayers(layers: MapTileLayerType[], map: Map) {
    Object.values(MAP_TILE_LAYERS).forEach(layer => {
        try {
            map.removeLayer(layer);
        } catch {}
    });
    layers.forEach(layer => {
        MAP_TILE_LAYERS[layer].addTo(map);
        if (layer == "OpenRailwayMap") {
            MAP_TILE_LAYERS[layer].setZIndex(1);
        } else {
            MAP_TILE_LAYERS[layer].setZIndex(0);
        }
    });
}

