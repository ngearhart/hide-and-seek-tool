// Utilities
import { defineStore } from 'pinia'
import type { CustomProperty, Region, RegionDescriptor } from '@/regions/regions';
import type { Feature, Point } from 'geojson';
import type { FeatureType } from '@/regions/features';
import type { GameRecord } from '@/utils';
import type { MapTileLayerType } from '@/graphics/mapTiles';

export type State = {
  mapLayers: MapTileLayerType[]
  mapMarkers: string[],
  enableHidingSpotOverlay: boolean,
  regions: RegionDescriptor[],
  loadedRegionData: Region | null,
  overlayOpacity: number,
};

export const useStore = defineStore('app', {
  state: (): State => ({
    mapLayers: [
      "Jawg_Sunny",
    ],
    mapMarkers: [],
    enableHidingSpotOverlay: false,
    regions: [],
    loadedRegionData: null,
    overlayOpacity: 0.5
  }),
  getters: {
    getMarkers() {
      return (type: FeatureType): Feature<Point, CustomProperty>[] => this.loadedRegionData?.features.filter(feature => feature.properties.Type === type) ?? [];
    },
  },
  persist: true
})

// We use a separate state for Game History since we want it to clear when the browser refreshes.
//  This prevents us from needing some limit on undo length and needing to clear when the game restarts.
// Ultimately, the History page gives the user full power to delete things regardless.
//  The undo/redo system is intended to be a convenience, not a core feature.
type UndoRedoState = {
  gameHistory: GameRecord[], // Used for Undo operation
  undoHistory: GameRecord[], // Used for Redo operation ("undo the undo")
}

export const useUndoRedoStore = defineStore('undoRedo', {
  state: (): UndoRedoState => ({
    gameHistory: [],
    undoHistory: []
  }),
  persist: false
})
