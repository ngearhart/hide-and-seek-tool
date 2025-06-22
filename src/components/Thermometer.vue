<template>
  <v-dialog max-width="300" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Create Thermometer Overlay" :disabled="loading" :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <div>
          <label>Angle:</label>
          <vue-angle :angle="angle"></vue-angle>          
        </div> 
        <v-checkbox label="Hotter (in the direction of the angle)" v-model="hotter"></v-checkbox>
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
  (e: 'submit', lat: number, long: number, angle: number, hotter: boolean): void
}>();


const hotter = shallowRef(false);
const angle = shallowRef(0);
const loading = shallowRef(false);


const submit = async() => {
  loading.value = true;
  try {
    const position: GeolocationPosition = await new Promise((r) => navigator.geolocation.getCurrentPosition((position) => r(position)));
    emit('submit', position.coords.latitude, position.coords.longitude, angle.value, hotter.value);
    loading.value = false;
    model.value = false;
    notify({
      text: "Success",
      title: "Thermometer submitted"
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
