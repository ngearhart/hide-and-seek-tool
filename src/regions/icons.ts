import L from 'leaflet';
import { getImagePathFor, type FeatureType } from './features';

const PlaceMarkerIcon = L.Icon.extend({
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
