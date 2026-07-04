<template>
  <div class="fab-container">
    <v-fab :color="open ? '' : 'primary'" size="large" extended :prepend-icon="open ? 'mdi-close' : 'mdi-toolbox'"
      width="12em">
      Toolbox
      <v-speed-dial v-model="open" location="top center" transition="slide-y-reverse-transition" activator="parent">

        <v-btn key="4" prepend-icon="mdi-refresh" @click="$emit('reset')" spaced="start">
          Reset
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-history" @click="historyIsOpen = true" spaced="start" width="14em">
          Edit History
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-near-me" @click="$emit('locate')" spaced="start">
          Locate
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-radar" @click="radarIsOpen = true" spaced="start">
          Place Radar
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-hexagon-multiple" @click="districtIsOpen = true" spaced="start">
          Place District
        </v-btn>
        <!-- <v-btn key="4" color="success" prepend-icon="mdi-thermometer" @click="thermometerIsOpen = true">
          Thermometer
        </v-btn> -->

        <v-btn key="4" prepend-icon="mdi-radius" @click="findClosestIsOpen = true" spaced="start">
          Find Closest
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-draw" @click="$emit('draw')" spaced="start">
          Draw
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-pin" @click="$emit('showPinDrop')" spaced="start">
          Drop Pin
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-information-outline" @click="markerEditorIsOpen = true" spaced="start">
          Edit Markers
        </v-btn>

        <v-btn key="4" prepend-icon="mdi-view-dashboard-edit-outline" @click="layerEditorIsOpen = true" spaced="start">
          Edit Layers
        </v-btn>

      </v-speed-dial>
      <marker-editor v-model="markerEditorIsOpen" />
      <layer-editor v-model="layerEditorIsOpen" :region="regionDbObj" @update-districts="$emit('updateDistricts')" />
      <find-closest v-model="findClosestIsOpen"
        @find-closest="(key: string, type: string) => { findClosestIsOpen = false; $emit('findClosest', key, type) }" />
      <radar v-model="radarIsOpen" post-title="Your Current Location"
        @hit-success="(lat: number, long: number, meters: number) => $emit('radar', true, lat, long, meters)"
        @hit-fail="(lat: number, long: number, meters: number) => $emit('radar', false, lat, long, meters)" />
      <history :games-db-ref="gamesDbRef" :games-db-obj="gamesDbObj" v-model="historyIsOpen" />
      <thermometer v-model="thermometerIsOpen"
        @submit="(lat: number, long: number, angle: number, hotter: boolean) => $emit('thermometer', lat, long, angle, hotter)" />
      <district post-title="Your Current Location" v-model="districtIsOpen" :region="props.regionDbObj"
        @submit="(hit: boolean, lat: number, long: number, level: number) => $emit('district', hit, lat, long, level)" />
    </v-fab>

    <v-fab color="deep-orange-darken-4" size="small" icon :disabled="!canUndo"
      @click="undoGame($props.gamesDbRef)"><v-icon>mdi-undo-variant</v-icon></v-fab>
    <v-fab color="deep-orange-darken-4" size="small" icon :disabled="!canRedo"
      @click="redoGame($props.gamesDbRef)"><v-icon>mdi-redo-variant</v-icon></v-fab>
  </div>
</template>
<script lang="ts" setup>
import type { GameRecord } from '@/utils';
import type { DatabaseReference } from 'firebase/database';
import type { VueDatabaseDocumentData } from 'vuefire';
import { undoGame, redoGame } from '@/game';

import { shallowRef } from 'vue'
import { useUndoRedoStore } from '@/stores/app';
import type { Region } from '@/regions/regions';

const props = defineProps<{
  gamesDbRef: DatabaseReference,
  gamesDbObj: VueDatabaseDocumentData<GameRecord | null> | undefined,
  regionDbObj: VueDatabaseDocumentData<Region | null> | undefined
}>();

defineEmits<{
  (e: 'radar', hit: boolean, lat: number, long: number, meters: number): void
  (e: 'district', hit: boolean, lat: number, long: number, level: number): void
  (e: 'thermometer', lat: number, long: number, angle: number, hotter: boolean): void
  (e: 'locate'): void
  (e: 'showPinDrop'): void
  (e: 'findClosest', key: string, type: string): void
  (e: 'draw'): void
  (e: 'reset'): void
  (e: 'updateDistricts'): void
}>();
const open = shallowRef(false)
const layerEditorIsOpen = shallowRef(false)
const markerEditorIsOpen = shallowRef(false)
const radarIsOpen = shallowRef(false)
const historyIsOpen = shallowRef(false)
const thermometerIsOpen = shallowRef(false)
const findClosestIsOpen = shallowRef(false)
const districtIsOpen = shallowRef(false)

const store = useUndoRedoStore();

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
  display: flex;
}

button {
  background: linear-gradient(-70deg, #37474F 75%, #212121 25%);
}
</style>
