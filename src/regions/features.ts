import L from 'leaflet';
import { getIconFor } from './icons';
import { useStore } from '@/stores/app';
import { flipCoords } from './regions';

export type FeatureType = "station" | "airport" | "museum" | "theater" | "hospital" | "library" | "zoo" | "aquarium" | "graveyard" | "park" | "custom";

type Feature = {
  singularLabel: string,
  pluralLabel: string,
  key: FeatureType,
}

export const features: Feature[] = [
  {
    pluralLabel: "Transit Stations",
    singularLabel: "Transit Station",
    key: "station",
  },
  {
    pluralLabel: "Airports",
    singularLabel: "Airport",
    key: "airport",
  },
  {
    pluralLabel: "Museums",
    singularLabel: "Museum",
    key: "museum",
  },
  {
    pluralLabel: "Movie Theaters",
    singularLabel: "Movie Thearer",
    key: "theater",
  },
  {
    pluralLabel: "Hospitals",
    singularLabel: "Hospital",
    key: "hospital",
  },
  {
    pluralLabel: "Libraries",
    singularLabel: "Library",
    key: "library",
  },
  {
    pluralLabel: "Zoos",
    singularLabel: "Zoo",
    key: "zoo",
  },
  {
    pluralLabel: "Aquariums",
    singularLabel: "Aquarium",
    key: "aquarium",
  },
  {
    pluralLabel: "Parks",
    singularLabel: "Park",
    key: "park",
  },
  {
    pluralLabel: "Graveyards",
    singularLabel: "Graveyard",
    key: "graveyard",
  },
  {
    pluralLabel: "Custom Pins",
    singularLabel: "Custom Pin",
    key: "custom"
  },
];

type ColorDict = { [feature in FeatureType]: string };
export const colors: ColorDict = {
  "station": "#5E3408",
  "airport": "#FFFCF2",
  "museum": "#0D3B66",
  "theater": "#F4D666",
  "hospital": "#EB5E28",
  "library": "#FAF0CA",
  "zoo": "#A663CC",
  "aquarium": "#669BBC",
  "park": "#84A98C",
  "graveyard": "#03071E",
  "custom": "#C2095A",
}

export const getImagePathFor = (featureType: FeatureType): string => 'images/markers/' + featureType + '.png';

export type GetPopupFunction = (latLng: L.LatLngExpression, name: string, subtitle?: string, subtitle2?: string) => L.Popup;

const getMarkerFor = (feature: Feature, latLng: L.LatLngExpression, name: string, getPopupFor: GetPopupFunction) => {
  let additionalOptions: L.MarkerOptions = {
    icon: getIconFor(feature.key)
  };
  return L.marker(latLng, additionalOptions).bindPopup(getPopupFor(latLng, name, feature.singularLabel))
}

export const getFeatureMarkers = (getPopupFor: GetPopupFunction): { [key in FeatureType]: L.Marker<any>[] } => {
  // Can't import this earlier due to injection dependencies
  // https://pinia.vuejs.org/core-concepts/outside-component-usage.html
  const store = useStore();
  return Object.fromEntries(
    features.map(feature => [
      feature.key,
      store.getMarkers(feature.key).map(marker => getMarkerFor(feature, flipCoords(marker.geometry.coordinates), marker.properties.Name, getPopupFor))
    ])
  ) as { [key in FeatureType]: L.Marker<any>[] }
}

//   ({
//     stations: store.getMarkers("station").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Transit Station", "transitstations")),
//     airports: store.getMarkers("airport").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Airport", "airports")),
//     parks: store.getMarkers("park").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Park", "parks")),
//     museums: store.getMarkers("museum").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Museum", "museums")),
//     theaters: store.getMarkers("theater").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Theater", "movietheaters")),
//     hospitals: store.getMarkers("hospital").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Hospital", "hospitals")),
//     libraries: store.getMarkers("library").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Library", "libraries")),
//     zoos: store.getMarkers("zoo").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Zoo", "zoos")),
//     aquariums: store.getMarkers("aquarium").map(marker => getMarkerFor(flipCoords(marker.geometry.coordinates), marker.properties.Name, "Aquarium", "aquariums")),
//     custom: gamesObj.value?.customPins?.map(pin =>
//         getMarkerFor([pin.lat, pin.long], "Custom Pin", "", "custompins")
//     ) ?? [],
// })
