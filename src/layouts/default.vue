<template>
  <v-app id="inspire">
    <v-app-bar class="px-3" density="compact" flat>
      <!-- <v-avatar
        class="hidden-md-and-up"
        color="grey-darken-1"
        size="32"
      ></v-avatar> -->

      <v-spacer></v-spacer>

      <v-tabs align-tabs="center" color="grey-darken-2">
        <v-tab v-for="link in links" :key="link" :text="link"></v-tab>
      </v-tabs>
      <v-spacer></v-spacer>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn color="primary" v-bind="props">
            <div v-if="user" style="margin-right: 10px;" class="hidden-sm-and-down">
              Logged in as {{ user.providerData[0].displayName }}
            </div>

            <v-avatar color="grey-darken-1" size="32">
              <v-img alt="Your avatar" :src="user?.photoURL ?? ''"></v-img>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            Current game code: {{ userRecordObj?.currentGameId }}
          </v-list-item>
          <v-list-item>
            <v-btn color="primary" v-on:click="exitGame">Exit game</v-btn>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
    <AppFooter />
    <GameSelector />
    <Notifications position="bottom right" />
  </v-app>
</template>

<script lang="ts" setup>
import { useCurrentUserMock } from '@/firebase/mock';
import type { UserRecord } from '@/utils';
import { Notifications } from '@kyvg/vue3-notification';
import { getDatabase, ref as dbRef, set } from 'firebase/database';
import { useDatabaseObject } from 'vuefire';

import { useNotification } from "@kyvg/vue3-notification";

const { notify }  = useNotification();

const user = useCurrentUserMock();
const userRecordDbRef = computed(() => dbRef(getDatabase(), 'users/' + user?.uid));
const userRecordObj = useDatabaseObject<UserRecord | null>(userRecordDbRef);



let links = [
  'Map',
  'Timer',
  'Rules',
  'Curses',
]

const exitGame = async() => {
  await set(userRecordDbRef.value, {
    currentGameId: null
  });
  notify({
    title: "Notice",
    text: "Leaving game..."
  })
  await new Promise(r => setTimeout(r, 1000));
  window.location.reload();
}
</script>
