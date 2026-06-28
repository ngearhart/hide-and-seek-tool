<template>
  <v-app id="inspire">
    <v-app-bar class="px-3" density="compact" flat>
      <!-- <v-avatar
        class="hidden-md-and-up"
        color="grey-darken-1"
        size="32"
      ></v-avatar> -->

      <v-spacer></v-spacer>

      <v-tabs align-tabs="center" color="grey-darken-2" v-model="currentTab">
        <v-tab v-for="link in links" :key="link" :text="link" :value="link">
        </v-tab>
      </v-tabs>
      <v-spacer></v-spacer>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn color="primary" v-bind="props">
            <div v-if="userManager.user.value" style="margin-right: 10px;" class="hidden-sm-and-down">
              Logged in as {{ userManager.user.value?.providerData[0].displayName }}
            </div>

            <v-avatar color="grey-darken-1" size="32">
              <v-img alt="Your avatar" :src="userManager.user.value?.photoURL ?? ''"></v-img>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <template v-slot:default>
              Copy User ID
            </template>
            <template v-slot:append>
              <v-btn icon="mdi-clipboard-multiple-outline" variant="text" @click="copyUidToClipboard"></v-btn>
            </template>
          </v-list-item>
          <v-list-item v-if="userRecordObj?.currentGameId">
            <template v-slot:default>
              Current game code: {{ userRecordObj?.currentGameId }}
            </template>
            <template v-slot:append>
              <v-btn icon="mdi-clipboard-multiple-outline" variant="text" @click="copyGameCodeToClipboard"></v-btn>
            </template>
          </v-list-item>
          <v-list-item v-if="userRecordObj?.teamName">
            Team: {{ userRecordObj?.teamName }}
          </v-list-item>
          <v-list-item v-if="gamesObj?.region">
            Region: {{ gamesObj?.region }}
          </v-list-item>
          <v-list-item v-if="userRecordObj?.teamName">
            <v-btn color="primary" v-on:click="switchTeam" prepend-icon="mdi-swap-horizontal" block>Change team</v-btn>
          </v-list-item>
          <v-list-item v-if="userRecordObj?.teamName">
            <v-btn color="yellow" v-on:click="exitGame" prepend-icon="mdi-close" block>Exit game</v-btn>
          </v-list-item>
          <v-list-item>
            <v-btn color="red" v-on:click="logOut" prepend-icon="mdi-logout" block>Log out</v-btn>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-app-bar>

    <v-main>
      <router-view v-if="currentTab === 'RegionEditor' || (gamesObj && gamesObj.region)" />
      <EarthAnimation v-else>
        hi
      </EarthAnimation>
    </v-main>
    <AppFooter />
    <GameSelector :current-tab="currentTab" />
    <Notifications position="bottom right" />
  </v-app>
</template>

<script lang="ts" setup>
import type { GameRecord, UserRecord } from '@/utils';
import { Notifications } from '@kyvg/vue3-notification';
import { getDatabase, ref as dbRef, set } from 'firebase/database';
import { useCurrentUser, useDatabaseObject, useFirebaseAuth } from 'vuefire';
import { useRoute, useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'

import { useNotification } from "@kyvg/vue3-notification";
import { useUserManager } from '@/firebase/user';

const { notify }  = useNotification();

const userManager = useUserManager();
const userRecordObj = useDatabaseObject<UserRecord | null>(userManager.userRecordDbRef);
const gameCodeEntered = computed(() => userRecordObj.value?.currentGameId);
const gamesDbRef = computed(() => dbRef(getDatabase(), 'games/' + gameCodeEntered.value));
const gamesObj = useDatabaseObject<GameRecord | null>(gamesDbRef);

const route = useRoute()
const router = useRouter()
const currentTab = ref('');

const auth = useFirebaseAuth()!;


let links = [
  'Map',
  'Timer',
  'Rules',
  'Curses',
]

const exitGame = async() => {
  await userManager.save({
    currentGameId: null,
    teamName: null
  });
  notify({
    title: "Notice",
    text: "Leaving game..."
  })
  await new Promise(r => setTimeout(r, 1000));
  window.location.reload();
}

// This is a little bit of a hack but whatever.
const switchTeam = async() => {
  await userManager.save({
    currentGameId: userRecordObj.value?.currentGameId,
    teamName: null
  });
  notify({
    title: "Notice",
    text: "Switching teams..."
  })
  await new Promise(r => setTimeout(r, 1000));
  window.location.reload();
}

onMounted(() => {
  if (route.name != '/') {
    currentTab.value = route.name.substring(1, 2).toUpperCase() + route.name.substring(2);
  }
});

const redirect = (link: any) => {
  router.push('/' + (link === 'Map' ? '' : link.toLowerCase()));
};

watch(currentTab, redirect);

const copyGameCodeToClipboard = async() => {
  if (userRecordObj?.value?.currentGameId) {
    await navigator.clipboard.writeText(userRecordObj.value.currentGameId);
  }
};

const copyUidToClipboard = async() => {
  if (userManager.user.value?.uid) {
    await navigator.clipboard.writeText(userManager.user.value.uid);
  }
};

const logOut = async() => {
  await signOut(auth);
  window.location.reload();
}

</script>
