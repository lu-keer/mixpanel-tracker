import { defineNuxtConfig } from 'nuxt/config'
import mixpanelTracker from '../../src/integrations/nuxt'

const token = process.env.NUXT_PUBLIC_MIXPANEL_TOKEN || ''

export default defineNuxtConfig({
  modules: [mixpanelTracker],
  devtools: {
    enabled: false,
  },
  typescript: {
    strict: true,
  },
  mixpanelTracker: {
    token,
    enabled: Boolean(token),
    debug: process.env.NODE_ENV === 'development',
    persistence: 'localStorage',
    commonProperties: {
      app_name: 'mixpanel-tracker-nuxt-example',
      platform: 'web',
      example: 'nuxt',
    },
    trackPageView: true,
    pageViewEventName: 'Page Viewed',
  },
})