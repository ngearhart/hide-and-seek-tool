<template>
  <v-dialog max-width="400" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Choose Map Layers">
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will only apply to your device.
        </v-alert>
        <v-radio-group label="Background style" v-model="mapStyle" v-on:click="updateMap" >
          <v-radio label="Dark" value="dark"></v-radio> <!-- Jawg.Matrix or Jawg.Dark -->
          <v-radio label="Light" value="light"></v-radio> <!-- Jawg.Sunny  -->
          <v-radio label="Terrain" value="terrain"></v-radio> <!-- Esri_WorldImagery  -->
        </v-radio-group>
        <v-checkbox label="Railroad Overlay" v-model="enableRailroadOverlay" v-on:update:model-value="updateMap"
          persistent-hint hint="Show all railroad lines, might be more than what is allowable in your game"></v-checkbox>
        <v-checkbox v-for="district of districtOptions" :label="'District Overlay Level ' + district" v-model="enableDistrictOverlays[district!]" v-on:update:model-value="updateDistricts"
          persistent-hint hint="Show outlines of this administrative district level"></v-checkbox>
        <v-checkbox label="Hiding Spot Overlay" v-model="enableHidingSpotOverlay" v-on:update:model-value="updateMap"
          persistent-hint hint="Add circles outlining allowable hiding spots"></v-checkbox>
      </v-card-text>
      <v-card-actions>
        <v-container>
          <v-row align="center" justify="center">
            <v-col cols="12" md="6">
              <v-btn prepend-icon="mdi-close" variant="tonal" @click="model = false" block>Close</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { MapTileLayerType } from '@/graphics/mapTiles';
import type { Region } from '@/regions/regions';
import { useStore } from '@/stores/app';
import type { VueDatabaseDocumentData } from 'vuefire';

const props = defineProps<{
  region: VueDatabaseDocumentData<Region | null> | undefined
}>();

const emit = defineEmits<{
  (e: 'updateDistricts'): void
}>();

const store = useStore();

const model = defineModel();

const mapStyle = shallowRef("dark");
const enableRailroadOverlay = shallowRef(false);
const enableHidingSpotOverlay = shallowRef(false);

const enableDistrictOverlays = ref<boolean[]>([false, false, false, false, false]);

const districtOptions = computed(() => {
  return Array.from(new Set(props.region?.features.filter(feature => feature.properties.Type === "district").flatMap(feat => feat.properties.Level)))
})

const updateDistricts = async() => {
  await updateMap();
  emit('updateDistricts');
}

const updateMap = async() => {
  await new Promise(r => setTimeout(r, 200));
  const newLayers: MapTileLayerType[] = [];
  switch (mapStyle.value) {
    case "dark": newLayers.push("Jawg_Matrix"); break;
    case "light": newLayers.push("Jawg_Sunny"); break;
    case "terrain": newLayers.push("Esri_WorldImagery"); break;
  }

  if (enableRailroadOverlay.value) {
    newLayers.push("OpenRailwayMap");
  }

  store.$state.mapLayers = newLayers;

  store.$state.enableHidingSpotOverlay = enableHidingSpotOverlay.value;

  store.$state.enableDistrictOverlays = enableDistrictOverlays.value;
};

// Refresh on every view - store could be edited elsewhere.
watch(model, () => {
  if (model.value) {
    if (store.$state.mapLayers.includes("Jawg_Matrix")) {
      mapStyle.value = "dark";
    } else if (store.$state.mapLayers.includes("Jawg_Sunny")) {
      mapStyle.value = "light";
    } else if (store.$state.mapLayers.includes("Esri_WorldImagery")) {
      mapStyle.value = "terrain";
    }

    if (store.$state.mapLayers.includes("OpenRailwayMap")) {
      enableRailroadOverlay.value = true;
    }

    enableDistrictOverlays.value = store.$state.enableDistrictOverlays;

    enableHidingSpotOverlay.value = store.$state.enableHidingSpotOverlay;
  }
})

</script>
