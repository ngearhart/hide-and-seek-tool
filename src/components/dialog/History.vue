<template>
  <v-dialog max-width="500" v-model="model as any" transition="dialog-bottom-transition">
    <v-card title="History" :disabled="loading" :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-card-text>
        <v-alert style="margin-bottom: 1em;" icon="$warning" density="compact">
          This will remove from everyone's devices.
        </v-alert>
        <v-data-table :headers="headers" :hide-default-footer="listItems.length < 11" :items="listItems"
          :show-select="true" item-value="value" v-model="selectedEvents"></v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-container>
          <v-row align="center" justify="center">
            <v-col cols="6" md="6">
              <v-btn prepend-icon="mdi-close" variant="tonal" @click="model = false" block>Close</v-btn>
            </v-col>
            <v-col cols="6" md="6">
              <v-btn prepend-icon="mdi-delete-alert-outline" variant="tonal" color="red-lighten-2" @click="deleteSelectedEvents()" block :disabled="loading || selectedEvents.length == 0" :loading="loading">Delete</v-btn>
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
  gamesDbRef: DatabaseReference,
  gamesDbObj: VueDatabaseDocumentData<GameRecord | null> | undefined
}>();

type HistoryEvent = {
  type: string,
  created: string,
  text: string,
  creator: string,
};

const model = defineModel()
const selectedEvents = ref<string[]>([]);
const loading = shallowRef(false);

const headers: { title: string, key: string, align?: 'start' | 'end' }[] = [
  { title: 'Type', key: 'type', align: 'start' },
  { title: 'Creator', key: 'creator' },
  { title: 'Time', key: 'time' },
]

const events = computed(() => {
  const result: HistoryEvent[] = [];
  if (props.gamesDbObj && props.gamesDbObj.radarEntries?.length > 0) {
    result.push(...props.gamesDbObj.radarEntries.map(radarObj => ({ type: "radar", created: radarObj.created, text: `Radar ${radarObj.hit ? 'Hit' : 'Miss'}`, creator: radarObj.creatorName })));
  }
  if (props.gamesDbObj && props.gamesDbObj.polygonEntries?.length > 0) {
    result.push(...props.gamesDbObj.polygonEntries.map(polygon => ({ type: "polygon", created: polygon.created, text: "Polygon", creator: polygon.creatorName })));
  }
  if (props.gamesDbObj && props.gamesDbObj.customPins?.length > 0) {
    result.push(...props.gamesDbObj.customPins.map(customPin => ({ type: "customPin", created: customPin.created, text: customPin.customTitle ? `Custom Pin - ${customPin.customTitle}` : "Custom Pin", creator: customPin.creatorName })))
  }
  if (props.gamesDbObj && props.gamesDbObj.boundaryLineEntries?.length > 0) {
    result.push(...props.gamesDbObj.boundaryLineEntries.map(boundaryLine => ({ type: "boundaryLine", created: boundaryLine.created, text: "Boundary Line", creator: boundaryLine.creatorName })))
  }
  if (props.gamesDbObj && props.gamesDbObj.cellEntries?.length > 0) {
    result.push(...props.gamesDbObj.cellEntries.map(cell => ({ type: "cell", created: cell.created, text: "Cell", creator: cell.creatorName })))
  }
  if (props.gamesDbObj && props.gamesDbObj.districtBoundaries?.length > 0) {
    result.push(...props.gamesDbObj.districtBoundaries.map(dist => ({ type: "district", created: dist.created, text: "District", creator: dist.creatorName })))
  }
  return result;
});

const listItems = computed(() => events.value.sort((eventA, eventB) => new Date(eventB.created).getTime() - new Date(eventA.created).getTime()).map(event => ({
  type: event.text,
  creator: event.creator,
  time: new Date(event.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  value: `${event.type}:${new Date(event.created).getTime()}`,
})));

const deleteSelectedEvents = async() => {
  loading.value = true
  const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
  const oldObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
  selectedEvents.value.forEach(item => deleteEvent(item, newObj));
  await updateGame(
    newObj, oldObj, props.gamesDbRef
  );
  notify({
    title: "Success",
    text: "History deleted",
  })
  loading.value = false
  selectedEvents.value = []
  model.value = false
};

const deleteEvent = (value: string, gameObj: GameRecord) => {
  const itemType = value.split(":")[0];
  const itemTimestamp = parseInt(value.split(":")[1]);
  if (itemType == "radar") {
    gameObj.radarEntries = gameObj.radarEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
  } else if (itemType == "polygon") {
    gameObj.polygonEntries = gameObj.polygonEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
  } else if (itemType == "customPin") {
    gameObj.customPins = gameObj.customPins.filter(item => new Date(item.created).getTime() != itemTimestamp);
  } else if (itemType == "boundaryLine") {
    gameObj.boundaryLineEntries = gameObj.boundaryLineEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
  } else if (itemType == "cell") {
    gameObj.cellEntries = gameObj.cellEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
  } else if (itemType == "district") {
    gameObj.districtBoundaries = gameObj.districtBoundaries.filter(item => new Date(item.created).getTime() != itemTimestamp);
  } else {
    console.error(`Called deleteEvent in history on unknown item type "${itemType}"`)
  }
}

</script>