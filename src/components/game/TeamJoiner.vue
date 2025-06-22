<template>
    <v-dialog max-width="600" v-model="isDialogOpen" transition="dialog-bottom-transition" persistent>
        <v-card title="Join a Team" :disabled="loading" :loading="loading">
            <template v-slot:loader="{ isActive }">
                <v-progress-linear :active="isActive" color="deep-purple" height="4"
                    indeterminate></v-progress-linear>
            </template>
            <v-form @submit.prevent="submit">
                <v-card-text>
                    <v-container>
                        <v-row align="center" justify="center">
                            <v-col cols="12" md="12" v-for="team in teams" :key="team.name">
                                <v-btn block color="primary" @click="submit(team.name)">{{ team.name }}</v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>

import { useCurrentUserMock } from '@/firebase/mock';
import type { GameRecord, UserRecord } from '@/utils';
import { getDatabase, ref as dbRef, push, set, get } from 'firebase/database';
import { useCurrentUser, useDatabaseList, useDatabaseObject } from 'vuefire';

const emit = defineEmits<{
  (e: 'submit', team: string): void
}>();

const user = useCurrentUserMock();
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user.value?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gameCodeEntered = computed(() => userRecordObj.value?.currentGameId);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + gameCodeEntered.value));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const teams = computed(() => gamesObj.value?.teams);

const isDialogOpen = defineModel<boolean>();
const loading = ref(false);

const submit = (name: any) => {
    loading.value = true;
    emit('submit', name);
};

</script>