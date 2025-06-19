<template>
  <v-container style="max-width: 800px">
    <v-row align="center" justify="center">
      <v-col cols="12" md="12">
        <span>{{ t(stopwatch.hours) }}</span>:<span>{{ t(stopwatch.minutes) }}</span>:<span>{{ t(stopwatch.seconds) }}</span>
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-col>
        <v-btn block>Start Hiding Timer (45 minutes)</v-btn>
      </v-col>
    </v-row>
    <v-row align="center" justify="center" v-for="team in teams" :key="team.name">
        <v-col cols="12" md="12">
            <v-btn block color="primary" @click="$emit('submit', team.name)">Start Stopwatch for team {{ team.name }}</v-btn>
        </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>

import { useStopwatch } from 'vue-timer-hook';
import { useCurrentUserMock } from '@/firebase/mock';
import type { GameRecord, UserRecord } from '@/utils';
import { getDatabase, ref as dbRef, push, set, get } from 'firebase/database';
import { useCurrentUser, useDatabaseList, useDatabaseObject } from 'vuefire';

const emit = defineEmits<{
  (e: 'submit', team: string): void
}>();

const user = useCurrentUserMock();
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + (user as any)?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gameCodeEntered = computed(() => userRecordObj.value?.currentGameId);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + gameCodeEntered.value));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const teams = computed(() => gamesObj.value?.teams);

const stopwatch = useStopwatch();

const t = (val: Ref<number, number>): string => {
  if (val.value < 10) {
    return '0' + val.value;
  }
  return '' + val.value;
}

</script>
