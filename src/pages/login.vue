<template>
  <v-container class="fill-height" fluid>
    <v-row align='center' align-content='center' justify='center'>
      <v-col align-self='center' style='text-align: center'>
        <p class='mb-2'>{{ message }}</p>
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { getCurrentUser, useFirebaseAuth } from "vuefire"; 
import router from '../router';
import { useRoute } from 'vue-router'
import { signInWithRedirect, getRedirectResult } from 'firebase/auth'
import firebase from "firebase/compat/app"
import { onMounted, ref } from 'vue'
import "firebase/compat/auth"
import "firebase/compat/firestore"

const message = ref('Loading...')

const auth = useFirebaseAuth()!;

const LOGGING_IN = 'Logging you in...'
const REDIRECTING = 'Successfully logged in. Redirecting...'

onMounted(async () => {
  const route = useRoute()
  const currentUser = await getCurrentUser()
  if (currentUser) {
    message.value = REDIRECTING
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('logged in')
      // notify({
      //   'title': 'Success',
      //   'text': 'You are logged in.'
      // })
    } // Otherwise, you are already logged in.

    const to =
        route.query.redirect && typeof route.query.redirect === 'string'
        ? route.query.redirect
        : '/'

    router.push(to)
  } else {
    message.value = LOGGING_IN
    const provider = new firebase.auth.GoogleAuthProvider()
    signInWithRedirect(auth, provider).then(() => {
      message.value = REDIRECTING
    })
  }
})

</script>
