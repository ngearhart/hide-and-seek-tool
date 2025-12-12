// Utilities
import { defineStore } from 'pinia'
import L from 'leaflet';
import type { RegionDescriptor } from '@/regions/regions';

type State = {
  mapLayers: string[]
  mapMarkers: string[],
  enableStationCircles: boolean,
  regions: RegionDescriptor[],
};

export const useStore = defineStore('app', {
  state: (): State => ({
    mapLayers: [
      "CartoDB_DarkMatter",
      "OpenRailwayMap"
    ],
    mapMarkers: [],
    enableStationCircles: false,
    regions: []
  }),
  persist: true
})
