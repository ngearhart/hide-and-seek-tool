<template>
  <v-dialog max-width="600" v-model="isDialogOpen" transition="dialog-bottom-transition">
    <v-card title="Welcome to Hide & Seek Live!">
      <v-card-text>
        <v-container >
          <v-row align="center" justify="center">
            <v-col cols="12" md="8">
              <v-text-field v-model="gameCodeEntered" label="Enter a game code..."></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-btn block color="primary" v-on:click="joinGame">Join Game</v-btn>
            </v-col>
          </v-row>
          <v-row align="center" justify="center">
            <v-col cols="12" md="12">
              <v-btn block color="primary" v-on:click="createNewGame">+ Create a new game</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useCurrentUserMock } from '@/firebase/mock';
import type { GameRecord, UserRecord } from '@/utils';
import { getDatabase, ref as dbRef, push, set, get } from 'firebase/database';
import { useCurrentUser, useDatabaseList, useDatabaseObject } from 'vuefire';

import { useNotification } from "@kyvg/vue3-notification";

const { notify }  = useNotification()

// const games = ref(getDatabase(), 'games');

const isDialogOpen = ref(false);
const gameCodeEntered = ref('');

const user = useCurrentUserMock();

const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + gameCodeEntered.value));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const generateSlug = () => {
    let slug = '';
    const characters = 'ABCDEFGHKMNPQRSTWXYZ';
    for (let i = 0; i < 5; i++) {
        slug += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return slug;
}

const createNewGame = async () => {
  // Create game ID
  gameCodeEntered.value = generateSlug();

  await set(userRecordDbRef.value, {
    currentGameId: gameCodeEntered.value
  });

  await set(gamesDbRef.value, {
    created: new Date().toISOString()
  })

  console.log("Starting new game " + gameCodeEntered.value);
  isDialogOpen.value = false;
  
  notify({
    title: "Started game",
    text: "Successfully started game!",
  })
}

const joinGame = async() => {

  if (gameCodeEntered.value.length < 1) {
    notify({
      title: "Invalid",
      text: "Please enter a game code",
      type: 'warn'
    })
    return
  }

  await set(userRecordDbRef.value, {
    currentGameId: gameCodeEntered.value
  });

  try {
    const existingGame = await get(gamesDbRef.value);
    if (existingGame.exists()) {
      isDialogOpen.value = false;
      notify({
        title: "Joined game",
        text: "Successfully joined",
      })
      return
    }
  } catch {}
  notify({
    title: "Failed to join game",
    text: "Game does not exist",
    type: 'warn'
  })
}

onMounted(async () => {
  const userRef = await get(
    userRecordDbRef.value
  );
  if (!userRef.exists() || !userRef.val().currentGameId?.length) {
    isDialogOpen.value = true
  }
});

</script>
