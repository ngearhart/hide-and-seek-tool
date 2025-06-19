<template>
    <v-dialog max-width="500" v-model="model as any" transition="dialog-bottom-transition">
      <v-card title="History" :disabled="loading" :loading="loading">
        <template v-slot:loader="{ isActive }">
          <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
        </template>
        <v-card-text>
          <v-alert style="margin-bottom: 1em;" icon="$warning" density="compact">
              This will clear added overlays from everyone's devices.
          </v-alert>
          <v-list :items="listItems" @click:select="deleteEvent"></v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </template>
  
  <script lang="ts" setup>
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
  };

  const model = defineModel()
  const loading = shallowRef(false);
//   const emit = defineEmits<{
//     (e: 'deleteEvent', eventType: string, timestamp: string): void
//   }>();
  
    const events = computed(() => {
        const result: HistoryEvent[] = [];
        if (props.gamesDbObj && props.gamesDbObj.radarEntries?.length > 0) {
            result.push(...props.gamesDbObj.radarEntries.map(radarObj => ({type: "radar", created: radarObj.created, text: `Radar ${radarObj.hit ? 'Hit' : 'Miss'}`})));
        }
        if (props.gamesDbObj && props.gamesDbObj.polygonEntries?.length > 0) {
            result.push(...props.gamesDbObj.polygonEntries.map(polygon => ({type: "polygon", created: polygon.created, text: "Polygon"})));
        }
        if (props.gamesDbObj && props.gamesDbObj.customPins?.length > 0) {
          result.push(...props.gamesDbObj.customPins.map(customPin => ({type: "customPin", created: customPin.created, text: "Custom Pin"})))
        }
        if (props.gamesDbObj && props.gamesDbObj.boundaryLineEntries?.length > 0) {
          result.push(...props.gamesDbObj.boundaryLineEntries.map(boundaryLine => ({type: "boundaryLine", created: boundaryLine.created, text: "Boundary Line"})))
        }
        return result;
    });

    const listItems = computed(() => events.value.sort((eventA, eventB) => new Date(eventA.created).getTime() - new Date(eventB.created).getTime()).map(event => ({
        title: `${new Date(event.created).toLocaleString()} - ${event.text}`,
        value: `${event.type}:${new Date(event.created).getTime()}`,
        props: {
            prependIcon: 'mdi-close',
        }
    })));

    const deleteEvent = async(item: { id: unknown; value: boolean; path: unknown[]; }) => {
        const itemType = (item.id as string).split(":")[0];
        const itemTimestamp = parseInt((item.id as string).split(":")[1]);
        if (itemType == "radar") {
            const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
            newObj.radarEntries = newObj.radarEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
            await set(
                props.gamesDbRef, newObj
            );
        } else if (itemType == "polygon") {
            const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
            newObj.polygonEntries = newObj.polygonEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
            await set(
                props.gamesDbRef, newObj
            );
        } else if (itemType == "customPin") {
            const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
            newObj.customPins = newObj.customPins.filter(item => new Date(item.created).getTime() != itemTimestamp);
            await set(
                props.gamesDbRef, newObj
            );
        } else if (itemType == "boundaryLine") {
            const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
            newObj.boundaryLineEntries = newObj.boundaryLineEntries.filter(item => new Date(item.created).getTime() != itemTimestamp);
            await set(
                props.gamesDbRef, newObj
            );
        }
        // model.value = false;
        notify({
            title: "Success",
            text: "History deleted",
        })
        
        // await new Promise(r => setTimeout(r, 2000));
        // window.location.reload();
    };

  </script>
  