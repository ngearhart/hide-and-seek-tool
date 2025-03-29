// Utilities
import { defineStore } from 'pinia'

type State = {
  mapLayers: string[]
  mapMarkers: string[]
};

export const useStore = defineStore('app', {
  state: (): State => ({
    mapLayers: [
      "CartoDB_DarkMatter",
      "OpenRailwayMap"
    ],
    mapMarkers: []
  }),
  persist: true
})
