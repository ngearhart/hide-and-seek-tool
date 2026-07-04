// Utilities
import { defineStore } from 'pinia'
import type { GameRecord } from '@/utils';
import type { MapTileLayerType } from '@/graphics/mapTiles';

export type State = {
  mapLayers: MapTileLayerType[]
  mapMarkers: string[],
  enableHidingSpotOverlay: boolean,
  enableDistrictOverlays: boolean[],
  overlayOpacity: number,
};

export const useStore = defineStore('app', {
  state: (): State => ({
    mapLayers: [
      "Jawg_Sunny",
    ],
    mapMarkers: [],
    enableHidingSpotOverlay: false,
    overlayOpacity: 0.5,
    enableDistrictOverlays: [false, false, false, false, false]
  }),
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
