<template>
  <v-dialog max-width="300" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Choose Map Layers">
      <v-card-text>
        <v-radio-group label="Background style" v-model="mapStyle" v-on:click="updateMap">
          <v-radio label="Dark" value="dark"></v-radio> <!-- Jawg.Matrix or Jawg.Dark -->
          <v-radio label="Light" value="light"></v-radio> <!-- Jawg.Sunny  -->
          <v-radio label="Terrain" value="terrain"></v-radio> <!-- Esri_WorldImagery  -->
        </v-radio-group>
        <v-checkbox :label="checkbox.label" v-model="checkbox.checked" v-for="checkbox in checkboxes" density="compact" v-on:click="updateMap"
          :messages="checkbox.note ?? ''" hide-details="auto"></v-checkbox>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useStore } from '@/stores/app';



const store = useStore();

const model = defineModel()

const mapStyle = shallowRef("dark");

const checkboxes = reactive([
  {
    label: "Rail lines",
    checked: false,
  },
  {
    label: "Station circles",
    checked: false,
  },
  {
    label: "Airports",
    checked: false,
    key: "airports",
  },
  {
    label: "Parks",
    checked: false,
  },
  {
    label: "Museums",
    checked: false,
  },
  {
    label: "Movie Theaters",
    checked: false,
  },
  {
    label: "Hospitals",
    checked: false,
  },
  {
    label: "Libraries",
    checked: false,
  },
  {
    label: "Zoos",
    checked: false,
  },
  {
    label: "Aquariums",
    checked: false,
    note: "Note: There is only 1 aquarium in the DMV"
  },
]);

const updateMap = async() => {
  await new Promise(r => setTimeout(r, 200));
  const newLayers = [];
  switch (mapStyle.value) {
    case "dark": newLayers.push("Jawg.Matrix"); break;
    case "light": newLayers.push("Jawg.Sunny"); break;
    case "terrain": newLayers.push("Esri_WorldImagery"); break;
  }

  if (checkboxes.find(item => item.label == "Rail lines")?.checked) {
    newLayers.push("OpenRailwayMap");
  }

  store.$state.mapMarkers = checkboxes.filter(checkbox => checkbox.checked && checkbox.key).map(checkbox => checkbox.key!);
  store.$state.mapLayers = newLayers;
};

onMounted(() => {
  if (store.$state.mapLayers.includes("Jawg.Matrix")) {
    mapStyle.value = "dark";
  } else if (store.$state.mapLayers.includes("Jawg.Sunny")) {
    mapStyle.value = "light";
  } else if (store.$state.mapLayers.includes("Esri_WorldImagery")) {
    mapStyle.value = "terrain";
  }

  if (store.$state.mapLayers.includes("OpenRailwayMap")) {
    checkboxes.find(item => item.label == "Rail lines")!.checked = true;
  }
});

</script>
