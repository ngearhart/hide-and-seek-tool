<template>
  <router-view />
</template>

<script lang="ts" setup>
  
// import { useCurrentUser, isCurrentRouteAuthenticated } from 'vuefire'

// // App.vue
// const user = useCurrentUser()
// const router = useRouter()
// const route = useRoute()

// watch(user, async (currentUser, previousUser) => {
//   // redirect to login if they logout and the current
//   // route is only for authenticated users
//   if (
//     !currentUser &&
//     previousUser &&
//     route.fullPath != '/login'
//   ) {
//     return router.push({ name: 'login' })
//   }
//   // redirect the user if they are logged in but were
//   // rejected because the user wasn't ready yet, logged in
//   // then got back to this page
//   if (currentUser && typeof route.query.redirect === 'string') {
//     console.log("oooo");
//     return router.push(route.query.redirect)
//   }
// })

</script>
