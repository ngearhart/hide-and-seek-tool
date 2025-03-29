// Utilities
import { defineStore } from 'pinia'

export const useStore = defineStore('app', {
  state: () => ({
    mapLayers: [
      "CartoDB_DarkMatter",
      "OpenRailwayMap"
    ]
  }),
  persist: true
})
