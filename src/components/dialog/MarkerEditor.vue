M<template>
  <v-dialog max-width="350" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Choose Map Markers">
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will only apply to your device.
        </v-alert>
        <v-checkbox :label="checkbox.label" v-model="checkbox.checked" v-for="checkbox in checkboxes" density="compact" v-on:click="updateMap"
          :messages="checkbox.note ?? ''" hide-details="auto"
          :color="colors[checkbox.key as PlaceType] ?? ''">
          <template v-slot:append v-if="colors[checkbox.key as PlaceType]">
            <img :src="getImagePathFor(checkbox.key as PlaceType)"></img>
          </template>
        </v-checkbox>
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
import { useStore } from '@/stores/app';
import { colors, places, getImagePathFor, type PlaceType } from '@/placeTypes';


const store = useStore();

const model = defineModel()

const checkboxes = reactive<{
  label: string,
  checked: boolean,
  key: string,
  note?: string
}[]>(places.map(place => ({ label: place.pluralLabel, key: place.key, checked: false})))

const updateMap = async() => {
  await new Promise(r => setTimeout(r, 200));
  store.$state.mapMarkers = checkboxes.filter(checkbox => checkbox.checked && checkbox.key).map(checkbox => checkbox.key!);
};

// Refresh on every view - store could be edited elsewhere.
watch(model, () => {
  store.$state.mapMarkers.forEach(marker => checkboxes.find(item => item.key == marker)!.checked = true)
})

</script>
