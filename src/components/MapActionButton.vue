<template>
  <v-fab
    :absolute="true" :color="open ? '' : 'primary'" location="right bottom"
    size="large" extended :prepend-icon="open ? 'mdi-close' : 'mdi-pencil'">
    Edit Map
    <v-speed-dial v-model="open" location="top center" transition="slide-y-reverse-transition" activator="parent">
      <v-btn key="4" color="orange-darken-4" prepend-icon="mdi-pin" @click="$emit('locate')">
        Locate
      </v-btn>
  
      <v-btn key="4" color="cyan-darken-4" prepend-icon="mdi-radar">
        Radar
      </v-btn>
  
      <v-btn key="4" color="success" prepend-icon="mdi-thermometer">
        Thermometer
      </v-btn>

      <v-btn key="4" color="info" prepend-icon="mdi-draw">
        Draw
      </v-btn>

      <v-btn key="4" color="warning" prepend-icon="mdi-view-dashboard-edit-outline" v-on:click="layerEditorIsOpen = true">
        Layers
      </v-btn>

      <v-btn key="4" color="error" prepend-icon="mdi-refresh">
        Reset
      </v-btn>
    </v-speed-dial>
    <layer-editor v-model="layerEditorIsOpen"/>
  </v-fab>
</template>
<script setup>
import { shallowRef } from 'vue'

const open = shallowRef(false)
const layerEditorIsOpen = shallowRef(false)

</script>
<style scoped>
.v-selection-control--disabled,
.v-input--disabled .v-selection-control {
  opacity: .1;
}

.v-radio {
  flex-grow: 0 !important;
}

h5 {
  margin-bottom: 12px;
}

code {
  display: block;
  font-size: .8rem;
  margin-top: 12px;
}

::v-deep(.v-label) {
  margin-left: 8px;
}

.v-fab {
  z-index: 100000;
}
</style>

<style>
.v-fab.v-fab--bottom .v-fab__container {
  bottom: 5em;
  right: 3em;
}
</style>