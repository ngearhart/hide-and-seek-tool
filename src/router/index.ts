/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'

// import index from '@/pages/index.vue';

import { getCurrentUser } from 'vuefire'

// routes.push({
//     path: '/:pathMatch(.*)*',
//     component: index
// })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(Array.from(routes)),
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err: any, to: any) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})


router.beforeEach(async (to: any) => {
  // routes with `meta: { requiresAuth: true }` will check for the users, others won't
  const currentUser = await getCurrentUser()
  if (!currentUser && to.path != '/login') {
    return {
      path: '/login',
      query: {
        // we keep the current path in the query so we can redirect to it after login
        // with `router.push(route.query.redirect || '/')`
        redirect: to.fullPath,
      },
    }
  } else if (currentUser && to.path == '/login') {
    return {
      path: '/'
    }
  }
})


export default router
