/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../stores'
import router from '../router'
import { VueFire, VueFireAuth } from 'vuefire'
import firebaseApp from '@/firebase/index'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
    .use(VueFire, {
      firebaseApp: firebaseApp,
      modules: [
        VueFireAuth()
      ]
    })
}
