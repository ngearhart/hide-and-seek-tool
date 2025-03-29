// Utilities
import { defineStore } from 'pinia'
import L from 'leaflet';

type State = {
  mapLayers: string[]
  mapMarkers: string[],
  enableStationCircles: boolean,
};

export const useStore = defineStore('app', {
  state: (): State => ({
    mapLayers: [
      "CartoDB_DarkMatter",
      "OpenRailwayMap"
    ],
    mapMarkers: [],
    enableStationCircles: false,
  }),
  persist: true
})
