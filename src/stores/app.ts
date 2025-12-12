// Utilities
import { defineStore } from 'pinia'
import type { Region, RegionDescriptor } from '@/regions/regions';

type State = {
  mapLayers: string[]
  mapMarkers: string[],
  enableStationCircles: boolean,
  regions: RegionDescriptor[],
  loadedRegionData: Region | null
};

export const useStore = defineStore('app', {
  state: (): State => ({
    mapLayers: [
      "CartoDB_DarkMatter",
      "OpenRailwayMap"
    ],
    mapMarkers: [],
    enableStationCircles: false,
    regions: [],
    loadedRegionData: null
  }),
  persist: true
})
