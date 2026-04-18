<template>
  <v-dialog max-width="500" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Choose a Resource" subtitle="Choose Which to Find Closest to Your Location">
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will only show on your device and will not notify the other team(s).
        </v-alert>
        <v-btn v-for="checkbox in checkboxes" block color="primary" style="margin-bottom: 1em;" @click="$emit('findClosest', checkbox.key, checkbox.label)">
          <template v-slot:prepend v-if="colors[checkbox.key as PlaceType]">
            <img :src="getImagePathFor(checkbox.key as PlaceType)"></img>
          </template>
          {{ checkbox.label }}
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-container>
          <v-row align="center" justify="center">
            <v-col cols="12" md="6">
              <v-btn prepend-icon="mdi-close" variant="tonal" @click="model = false" block>Cancel</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { places, type PlaceType, colors, getImagePathFor } from '@/placeTypes';


defineEmits<{
  (e: 'findClosest', key: string, type: string): void
}>();


const model = defineModel()

const checkboxes = reactive<{
  label: string,
  key: string
}[]>(places.map(place => ({ label: place.singularLabel, key: place.key})));

</script>
