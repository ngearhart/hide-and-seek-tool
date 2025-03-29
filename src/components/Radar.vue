<template>
  <v-dialog max-width="300" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Create Radar Overlay" :disabled="loading" :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <v-select label="Radar Size" :items="radarSizeOptions" v-model="radarSize"></v-select>
        <v-checkbox label="Radar was a hit" v-model="wasHit"></v-checkbox>
        <!-- <v-alert icon="mdi-alert" text="Make sure you have location permissions enabled for this website." color="warning" density="compact"></v-alert> -->
        <v-card-actions>
          <v-btn color="primary" block variant="tonal" @click="submit">Submit</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { notify } from '@kyvg/vue3-notification';

const model = defineModel()
const emit = defineEmits<{
  (e: 'hitSuccess', lat: number, long: number, meters: number): void
  (e: 'hitFail', lat: number, long: number, meters: number): void
}>();

const radarSize = shallowRef('0.25mile');
const wasHit = shallowRef(false);
const loading = shallowRef(false);

const radarSizeOptions = [
  {
    title: "1/4 Mile",
    value: "0.25mile",
  },
  {
    title: "1/2 Mile",
    value: "0.5mile",
  },
  {
    title: "1 Mile",
    value: "1mile",
  },
  {
    title: "3 Mile",
    value: "3mile",
  },
  {
    title: "5 Mile",
    value: "5mile",
  },
  {
    title: "10 Mile",
    value: "10mile",
  },
  {
    title: "25 Mile",
    value: "25mile",
  },
  {
    title: "50 Mile",
    value: "50mile",
  },
  {
    title: "100 Mile",
    value: "100mile",
  },
]

const submit = async() => {
  loading.value = true;
  try {
    const position: GeolocationPosition = await new Promise((r) => navigator.geolocation.getCurrentPosition((position) => r(position)));
    const distance = parseFloat(radarSize.value.split("mile")[0]) * 1609.344;
    if (wasHit.value) {
      emit('hitSuccess', position.coords.latitude, position.coords.longitude, distance);
    } else {
      emit('hitFail', position.coords.latitude, position.coords.longitude, distance);
    }
    // TODO: FIREBASE
    loading.value = false;
    model.value = false;
    notify({
      text: "Success",
      title: "Radar submitted"
    })
    return
  } catch {}
  notify({
    type: "error",
    text: "Could not locate you",
    title: "Error"
  })
  loading.value = false;
};

</script>
