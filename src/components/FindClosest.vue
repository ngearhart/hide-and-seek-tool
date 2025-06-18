<template>
  <v-dialog max-width="500" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Choose Which Resource To Find Closest">
      <v-card-text>
        <v-btn v-for="checkbox in checkboxes" block color="primary" style="margin-bottom: 1em;" @click="$emit('findClosest', checkbox.key, checkbox.label)">
          {{ checkbox.label }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>

defineEmits<{
  (e: 'findClosest', key: string, type: string): void
}>();


const model = defineModel()

const checkboxes = reactive([
  {
    label: "Metro station",
    key: "metro_stations",
  },
  {
    label: "Airport",
    key: "airports",
  },
  {
    label: "Museum",
    key: "museums",
  },
  {
    label: "Movie Theater",
    key: "theaters",
  },
  {
    label: "Hospital",
    key: "hospitals",
  },
  {
    label: "Library",
    key: "libraries",
  },
  {
    label: "Zoo",
    key: "zoos",
  },
  {
    label: "Aquarium",
    key: "aquariums",
  },
]);

</script>
