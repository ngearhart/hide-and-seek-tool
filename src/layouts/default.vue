<template>
  <v-app id="inspire">
    <v-app-bar
      class="px-3"
      density="compact"
      flat
    >
      <v-avatar
        class="hidden-md-and-up"
        color="grey-darken-1"
        size="32"
      ></v-avatar>

      <v-spacer></v-spacer>

      <v-tabs
        align-tabs="center"
        color="grey-darken-2"
      >
        <v-tab
          v-for="link in links"
          :key="link"
          :text="link"
        ></v-tab>
      </v-tabs>
      <v-spacer></v-spacer>

      <div v-if="user" style="margin-right: 10px;">
        Logged in as {{ user.providerData[0].displayName }}
      </div>

      <v-avatar
        class="hidden-sm-and-down"
        color="grey-darken-1"
        size="32"
      >
        <v-img
          alt="Your avatar"
          :src="user?.photoURL ?? ''"
        ></v-img>
      </v-avatar>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
import { useCurrentUserMock } from '@/firebase/mock';


const user = useCurrentUserMock();

let links = [
      'Map',
      'Timer',
      'Rules',
      'Curses',
]
</script>
