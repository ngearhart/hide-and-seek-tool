import L, { Class } from 'leaflet';
import { getImagePathFor, type FeatureType } from './features';

type PlaceMarkerIconCls = { new(options: {iconUrl: string}): PlaceMarkerIconCls } & typeof Class;

const PlaceMarkerIcon: PlaceMarkerIconCls = L.Icon.extend({
    options: {
        shadowUrl: 'marker-shadow.png',
        iconSize:     [36, 36],
        shadowSize:   [41, 41],
        iconAnchor:   [18, 36],
        shadowAnchor: [13, 45],
        popupAnchor:  [1, -30]
    }
});

export function getIconFor(type: FeatureType) {
    return new PlaceMarkerIcon({iconUrl: getImagePathFor(type)});
}
