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
import Notifications from '@kyvg/vue3-notification';
import VueAngle from 'vue-angle';

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
    .use(Notifications)
    .use(VueAngle)
    .use(VueFire, {
      firebaseApp: firebaseApp,
      modules: [
        VueFireAuth()
      ]
    })
}
