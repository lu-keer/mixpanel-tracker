import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createTracker } from '@mixchunk/mixpanel-tracker'
import { createVueMixpanel, setupVueRouterTracking } from '@mixchunk/mixpanel-tracker/vue'
import App from './App'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import './styles.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/settings', name: 'Settings', component: SettingsPage },
  ],
})

const token = import.meta.env.VITE_MIXPANEL_TOKEN || ''

const tracker = createTracker({
  token,
  enabled: Boolean(token),
  debug: import.meta.env.DEV,
  persistence: 'localStorage',
  commonProperties: {
    app_name: 'mixpanel-tracker-vue-example',
    platform: 'web',
    example: 'vue',
  },
  getCommonProperties: () => ({
    route_path: router.currentRoute.value.fullPath,
    route_name: String(router.currentRoute.value.name || ''),
  }),
  onError: (error) => {
    console.warn('[vue-example] tracking failed', error)
  },
})

tracker.registerCommonProperties({
  example_session_id: `vue-${Date.now()}`,
})

setupVueRouterTracking(router, tracker, {
  eventName: 'Page Viewed',
})

createApp(App).use(router).use(createVueMixpanel(tracker)).mount('#app')