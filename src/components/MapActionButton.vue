<template>
  <div class="fab-container">
    <v-fab :color="open ? '' : 'primary'" size="large" extended
      :prepend-icon="open ? 'mdi-close' : 'mdi-pencil'" width="12em">
      Edit Map
      <v-speed-dial v-model="open" location="top center" transition="slide-y-reverse-transition" activator="parent">
  
        <v-btn key="4" color="purple-darken-4" prepend-icon="mdi-history" @click="historyIsOpen = true" spaced="start" width="14em">
          History
        </v-btn>
  
        <v-btn key="4" color="orange-darken-4" prepend-icon="mdi-pin" @click="$emit('locate')"  spaced="start">
          Locate
        </v-btn>
  
        <v-btn key="4" color="cyan-darken-4" prepend-icon="mdi-radar" @click="radarIsOpen = true"  spaced="start">
          Radar
        </v-btn>
  
        <!-- <v-btn key="4" color="success" prepend-icon="mdi-thermometer" @click="thermometerIsOpen = true">
          Thermometer
        </v-btn> -->
  
        <v-btn key="4" color="red-darken-2" prepend-icon="mdi-radius" @click="findClosestIsOpen = true"  spaced="start">
          Find Closest
        </v-btn>
    
        <v-btn key="4" color="info" prepend-icon="mdi-draw" @click="$emit('draw')"  spaced="start">
          Draw
        </v-btn>
    
        <v-btn key="4" color="info" prepend-icon="mdi-pin" @click="$emit('showPinDrop')"  spaced="start">
          Drop Pin
        </v-btn>
  
        <v-btn key="4" color="success" prepend-icon="mdi-information-outline" @click="markerEditorIsOpen = true"  spaced="start">
          Markers
        </v-btn>
  
        <v-btn key="4" color="warning" prepend-icon="mdi-view-dashboard-edit-outline" @click="layerEditorIsOpen = true"  spaced="start">
          Layers
        </v-btn>
  
        <v-btn key="4" color="error" prepend-icon="mdi-refresh" @click="$emit('reset')"  spaced="start">
          Reset
        </v-btn>
      </v-speed-dial>
      <marker-editor v-model="markerEditorIsOpen" />
      <layer-editor v-model="layerEditorIsOpen" />
      <find-closest v-model="findClosestIsOpen"
        @find-closest="(key: string, type: string) => { findClosestIsOpen = false; $emit('findClosest', key, type) }" />
      <radar v-model="radarIsOpen" post-title="Your Current Location"
        @hit-success="(lat: number, long: number, meters: number) => $emit('radar', true, lat, long, meters)"
        @hit-fail="(lat: number, long: number, meters: number) => $emit('radar', false, lat, long, meters)" />
      <history :games-db-ref="gamesDbRef" :games-db-obj="gamesDbObj" v-model="historyIsOpen" />
      <thermometer v-model="thermometerIsOpen"
        @submit="(lat: number, long: number, angle: number, hotter: boolean) => $emit('thermometer', lat, long, angle, hotter)" />
    </v-fab>
    
    <v-fab color="deep-orange-darken-4" size="small" icon :disabled="!canUndo" @click="undoGame($props.gamesDbRef)"><v-icon>mdi-undo-variant</v-icon></v-fab>
    <v-fab color="deep-orange-darken-4" size="small" icon :disabled="!canRedo" @click="redoGame($props.gamesDbRef)"><v-icon>mdi-redo-variant</v-icon></v-fab>
  </div>
</template>
<script lang="ts" setup>
import type { GameRecord } from '@/utils';
import type { DatabaseReference } from 'firebase/database';
import type { VueDatabaseDocumentData } from 'vuefire';
import { undoGame, redoGame } from '@/game';

const props = defineProps<{
  gamesDbRef: DatabaseReference,
  gamesDbObj: VueDatabaseDocumentData<GameRecord | null> | undefined
}>();

import { shallowRef } from 'vue'
import { useStore } from '@/stores/app';

defineEmits<{
  (e: 'radar', hit: boolean, lat: number, long: number, meters: number): void
  (e: 'thermometer', lat: number, long: number, angle: number, hotter: boolean): void
  (e: 'locate'): void
  (e: 'showPinDrop'): void
  (e: 'findClosest', key: string, type: string): void
  (e: 'draw'): void
  (e: 'reset'): void
}>();
const open = shallowRef(false)
const layerEditorIsOpen = shallowRef(false)
const markerEditorIsOpen = shallowRef(false)
const radarIsOpen = shallowRef(false)
const historyIsOpen = shallowRef(false)
const thermometerIsOpen = shallowRef(false)
const findClosestIsOpen = shallowRef(false)

const store = useStore();

const canUndo = computed(() => store.$state.gameHistory.length > 1);
const canRedo = computed(() => store.$state.undoHistory.length > 0);

</script>
<style scoped>
.v-selection-control--disabled,
.v-input--disabled .v-selection-control {
  opacity: .1;
}

.v-radio {
  flex-grow: 0 !important;
}

h5 {
  margin-bottom: 12px;
}

code {
  display: block;
  font-size: .8rem;
  margin-top: 12px;
}

::v-deep(.v-label) {
  margin-left: 8px;
}

.v-fab {
  margin: 0.5em;
}

.fab-container {
  z-index: 1000;
  position: fixed;
  bottom: 2.5em;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
