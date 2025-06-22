<template>
    <v-dialog max-width="500" v-model="model">
        <template v-slot:default="{ isActive }">
            <v-card title="Confirm Map Reset" :disabled="loading" :loading="loading">
                <template v-slot:loader="{ isActive }">
                    <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
                </template>
                <v-card-text>
                    Are you sure you want to clear the map? This will remove all markers, custom shapes, radars, and
                    boundary lines from the map for all players.
                    This should be used between turns.
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-container>
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-btn text="Confirm" @click="confirm" block color="green" variant="tonal" prepend-icon="mdi-restart"></v-btn>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-btn text="Cancel" @click="isActive.value = false" block color="gray" variant="tonal" prepend-icon="mdi-cancel"></v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script lang="ts" setup>

  import type { GameRecord } from '@/utils';
import { notify } from '@kyvg/vue3-notification';
import { set, type DatabaseReference } from 'firebase/database';
import type { VueDatabaseDocumentData } from 'vuefire';

const model = defineModel<boolean>()
const loading = shallowRef(false)
const props = defineProps<{
    gamesDbRef: DatabaseReference,
    gamesDbObj: VueDatabaseDocumentData<GameRecord | null> | undefined
}>();


const confirm = async() => {
    loading.value = true

    // Make the user think about their choices.
    await new Promise(r => setTimeout(r, 2000))

    const newObj: GameRecord = JSON.parse(JSON.stringify(props.gamesDbObj));
    newObj.boundaryLineEntries = [];
    newObj.customPins = [];
    newObj.polygonEntries = [];
    newObj.radarEntries = [];
    await set(
        props.gamesDbRef, newObj
    );
    loading.value = false
    model.value = false
    notify({
        title: "Success",
        text: "Map reset",
    })
}

</script>