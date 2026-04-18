<template>
  <v-dialog max-width="350" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="Set Pin Label" subtitle="Optionally specify a label for this custom pin">
      <v-card-text>
        <v-text-field
          v-model="label"
          label="Custom Pin Label"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-container>
          <v-row align="center" justify="center">
            <v-col cols="6" md="6">
              <v-btn prepend-icon="mdi-close" variant="tonal" @click="model = false" block>Skip</v-btn>
            </v-col>
            <v-col cols="6" md="6">
              <v-btn prepend-icon="mdi-content-save-check-outline" variant="tonal" @click="save()" block :disabled="loading" :loading="loading">Save</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { updateGame } from '@/game';
import type { GameRecord } from '@/utils';
import { notify } from '@kyvg/vue3-notification';
import { set, type DatabaseReference } from 'firebase/database';
import type { VueDatabaseDocumentData } from 'vuefire';


const props = defineProps<{
    mostRecentPinDrop: L.LatLng | null,
    gamesDbRef: DatabaseReference,
    gamesDbObj: VueDatabaseDocumentData<GameRecord | null> | undefined
}>();

const model = defineModel()
const label = shallowRef('')
const loading = shallowRef(false)

const save = async() => {
  loading.value = true;
  const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
  const oldObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
  const pinToEdit = newObj.customPins.find(pin => pin.lat === props.mostRecentPinDrop?.lat && pin.long === props.mostRecentPinDrop.lng);
  if (pinToEdit) {
    pinToEdit.customTitle = label.value;
  } else {
    console.error("Pin To Edit custom pin label is undefined for some reason");
  }
  await updateGame(
    newObj, oldObj, props.gamesDbRef, true
  );
  loading.value = false
  model.value = false
  label.value = ''
  notify({
      title: "Success",
      text: "Custom pin label set",
  })
}

</script>
