<template>
  <v-dialog max-width="400" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Create Boundary" :disabled="loading" :loading="loading"
      :subtitle="'Exclude a Direction Around ' + postTitle">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$info" density="compact">
          This will show on all devices.
        </v-alert>
          <degree-picker active-color="green" v-model="direction" body-color="#0A0A0A" :full-width="true"/>
        <v-card-actions>
          <v-btn color="primary" block variant="tonal" @click="submit">Submit</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { notify } from '@kyvg/vue3-notification';
import { DegreePicker } from "degree-picker";
import "degree-picker/dist/style.css";

const props = defineProps<{
  postTitle: string,
}>();

const model = defineModel()
const emit = defineEmits<{
  (e: 'submit', lat: number, long: number, angleDegrees: number): void
}>();

const direction = shallowRef(0);
const loading = shallowRef(false);

const submit = async () => {
  loading.value = true;
  try {
    const angle = direction.value - 90;
    if (props.postTitle === 'Pin') {
      emit('submit', 0, 0, angle);
    } else {
      const position: GeolocationPosition = await new Promise((r) => navigator.geolocation.getCurrentPosition((position) => r(position)));
      emit('submit', position.coords.latitude, position.coords.longitude, angle);
    }
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
