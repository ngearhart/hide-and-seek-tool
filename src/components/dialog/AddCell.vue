<template>
  <v-dialog max-width="400" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Create Cell" :subtitle="'Create a Cell Overlay Around ' + marker!.properties.Name" :disabled="loading"
      :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will show on all devices.
        </v-alert>
        <v-checkbox :label="marker!.properties.Name + ' is the closest ' + marker!.properties.Type" v-model="wasHit"></v-checkbox>
        <v-card-actions>
          <v-container>
            <v-row align="center" justify="center">
              <v-col cols="12" md="6">
                <v-btn color="primary" block variant="tonal" @click="submit">Submit</v-btn>
              </v-col>
              <v-col cols="12" md="6">
                <v-btn prepend-icon="mdi-close" variant="tonal" @click="model = false" block>Close</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { CustomProperty } from '@/regions/regions';
import type { Feature, MultiPolygon, Point } from 'geojson';


const props = defineProps<{
  marker: Feature<Point | MultiPolygon, CustomProperty> | null,
}>();

const model = defineModel()
const emit = defineEmits<{
  (e: 'create', isHit: boolean): void
}>();

const wasHit = shallowRef(false);
const loading = shallowRef(false);


const submit = async () => {
  emit('create', wasHit.value);
  model.value = false;
};

</script>
