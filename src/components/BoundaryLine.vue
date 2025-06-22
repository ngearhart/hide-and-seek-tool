<template>
  <v-dialog max-width="400" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Create Boundary Line" :disabled="loading" :loading="loading"
      :subtitle="'Exclude a Direction Around ' + postTitle">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will show on all devices.
        </v-alert>
        <v-select label="Boundary Line Direction" :items="boundaryLineOptions" v-model="direction" :hint="'Exclude everything to the ' + boundaryLineOptions.find(i => i.value === direction)?.title.toLowerCase() + ' of the point'"
          persistent-hint></v-select>
        <v-alert style="margin-top: 1em;" icon="$warning" density="compact" v-if="(parseInt(direction) - 45) % 90 == 0">
          This will not be exact due to spherical geometry.
        </v-alert>
        <v-card-actions>
          <v-btn color="primary" block variant="tonal" @click="submit">Submit</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { notify } from '@kyvg/vue3-notification';

defineProps<{
  postTitle: string,
}>();

const model = defineModel()
const emit = defineEmits<{
  (e: 'submit', lat: number, long: number, angleDegrees: number): void
}>();

const direction = shallowRef('0');
const loading = shallowRef(false);

const boundaryLineOptions = [
  {
    title: "East",
    value: "0",
  },
  {
    title: "Southeast",
    value: "315",
  },
  {
    title: "South",
    value: "270",
  },
  {
    title: "Southwest",
    value: "225",
  },
  {
    title: "West",
    value: "180",
  },
  {
    title: "Northwest",
    value: "135",
  },
  {
    title: "North",
    value: "90",
  },
  {
    title: "Northeast",
    value: "45",
  },
]

const submit = async () => {
  loading.value = true;
  try {
    const position: GeolocationPosition = await new Promise((r) => navigator.geolocation.getCurrentPosition((position) => r(position)));
    const angle = parseInt(direction.value);
    emit('submit', position.coords.latitude, position.coords.longitude, angle);
    loading.value = false;
    model.value = false;
    notify({
      text: "Success",
      title: "Boundary Line submitted"
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
