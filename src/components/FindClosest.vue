<template>
  <v-dialog max-width="500" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Choose Which Resource To Find Closest">
      <v-card-text>
        <v-btn v-for="checkbox in checkboxes" block color="primary" style="margin-bottom: 1em;" @click="$emit('findClosest', checkbox.key)">
          {{ checkbox.label }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>

defineEmits<{
  (e: 'findClosest', type: string): void
}>();


const model = defineModel()

const checkboxes = reactive([
  {
    label: "Metro stations",
    key: "metro_stations",
  },
  {
    label: "Airports",
    key: "airports",
  },
  {
    label: "Museums",
    key: "museums",
  },
  {
    label: "Movie Theaters",
    key: "theaters",
  },
  {
    label: "Hospitals",
    key: "hospitals",
  },
  {
    label: "Libraries",
    key: "libraries",
  },
  {
    label: "Zoos",
    key: "zoos",
  },
]);

</script>
