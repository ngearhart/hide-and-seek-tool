<template>
  <v-dialog max-width="400" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Create District Boundary" :subtitle="'Eliminate Districts Around ' + postTitle" :disabled="loading"
      :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will show on all devices.
        </v-alert>
        <v-alert style="margin-bottom: 1em;" icon="$error" density="compact" v-if="districtOptions.length == 0">
          There is no district data in this region.
        </v-alert>
        <v-select label="District Level" :items="districtOptions" v-model="districtLevel" :disabled="districtOptions.length == 0"
        </v-select>
        <v-checkbox label="Mark was a hit" v-model="wasHit" persistent-hint hint="If enabled, eliminate all area outside the district; if disabled, eliminate this district"></v-checkbox>
        <v-card-actions>
          <v-container>
            <v-row align="center" justify="center">
              <v-col cols="12" md="6">
                <v-btn color="primary" block variant="tonal" @click="submit" :disabled="districtOptions.length == 0">Submit</v-btn>
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
import { type Region } from '@/regions/regions';
import { notify } from '@kyvg/vue3-notification';
import type { VueDatabaseDocumentData } from 'vuefire';

const props = defineProps<{
  postTitle: string,
  region: VueDatabaseDocumentData<Region | null> | undefined
}>();

const model = defineModel()
const emit = defineEmits<{
  (e: 'submit', hit: boolean, lat: number, long: number, level: number): void
}>();

const districtOptions = computed(() => {
  return Array.from(new Set(props.region?.features.filter(feature => feature.properties.Type === "district").flatMap(feat => feat.properties.Level)))
})

const wasHit = shallowRef(false);
const loading = shallowRef(false);
const districtLevel = shallowRef(1);

const submit = async () => {
  loading.value = true;
  if (props.postTitle === "Pin") {
    // No need to get current position
    emit('submit', wasHit.value, 0, 0, districtLevel.value);
    loading.value = false;
    model.value = false;
    notify({
      text: "Success",
      title: "District boundary submitted"
    })
    return
  }
  try {
    const position: GeolocationPosition = await new Promise((r) => navigator.geolocation.getCurrentPosition((position) => r(position)));
    emit('submit', wasHit.value, position.coords.latitude, position.coords.longitude, districtLevel.value);
    loading.value = false;
    model.value = false;
    notify({
      text: "Success",
      title: "District boundary submitted"
    })
    return
  } catch { }
  notify({
    type: "error",
    text: "Could not locate you",
    title: "Error"
  })
  loading.value = false;
};

</script>
