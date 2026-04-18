// Utilities
import { defineStore } from 'pinia'
import type { CustomProperty, Region, RegionDescriptor } from '@/regions/regions';
import type { Feature, Point } from 'geojson';
import type { FeatureType } from '@/regions/features';
import type { GameRecord } from '@/utils';

type State = {
  mapLayers: string[]
  mapMarkers: string[],
  enableStationCircles: boolean,
  regions: RegionDescriptor[],
  loadedRegionData: Region | null,
  gameHistory: GameRecord[], // Used for Undo operation
  undoHistory: GameRecord[], // Used for Redo operation ("undo the undo")
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
    loadedRegionData: null,
    gameHistory: [],
    undoHistory: [],
  }),
  getters: {
    getMarkers() {
      return (type: FeatureType): Feature<Point, CustomProperty>[] => this.loadedRegionData?.features.filter(feature => feature.properties.Type === type) ?? [];
    },
  },
  persist: true
})
