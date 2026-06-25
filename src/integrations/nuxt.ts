import { addPluginTemplate, addTypeTemplate, defineNuxtModule } from '@nuxt/kit'
import type { EventProperties, MixpanelTracker, MixpanelTrackerOptions } from '../core/types'
import { createTracker } from '../core/tracker'

export interface NuxtMixpanelTrackerOptions extends MixpanelTrackerOptions {
  trackPageView?: boolean
  pageViewEventName?: string
}

export interface NuxtMixpanelTrackerModuleOptions {
  token?: string
  enabled?: boolean
  debug?: boolean
  apiHost?: string
  persistence?: MixpanelTrackerOptions['persistence']
  commonProperties?: EventProperties
  trackPageView?: boolean
  pageViewEventName?: string
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    mixpanelTracker?: NuxtMixpanelTrackerModuleOptions
  }

  interface NuxtOptions {
    mixpanelTracker?: NuxtMixpanelTrackerModuleOptions
  }
}
function removeUndefinedOptions(
  options: NuxtMixpanelTrackerModuleOptions,
): NuxtMixpanelTrackerModuleOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as NuxtMixpanelTrackerModuleOptions
}

function createRuntimePluginContents(): string {
  return `import { defineNuxtPlugin, useRoute, useRuntimeConfig } from '#app'
import { createTracker } from '@mixchunk/mixpanel-tracker'
import type { MixpanelTracker } from '@mixchunk/mixpanel-tracker'
import { setupVueRouterTracking } from '@mixchunk/mixpanel-tracker/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  const moduleOptions = runtimeConfig.public.mixpanelTracker || {}
  const route = useRoute()

  const tracker: MixpanelTracker = createTracker({
    token: moduleOptions.token || '',
    enabled: moduleOptions.enabled,
    debug: moduleOptions.debug,
    apiHost: moduleOptions.apiHost,
    persistence: moduleOptions.persistence,
    commonProperties: moduleOptions.commonProperties,
    getCommonProperties: () => ({
      route_path: route.fullPath,
      route_name: String(route.name || ''),
    }),
  })

  if (moduleOptions.trackPageView) {
    setupVueRouterTracking(nuxtApp.$router, tracker, {
      eventName: moduleOptions.pageViewEventName || 'Page Viewed',
    })
  }

  return {
    provide: {
      mixpanel: tracker,
    },
  }
})
`
}

function createRuntimeTypesContents(): string {
  return `import type { NuxtMixpanelTrackerModuleOptions } from '@mixchunk/mixpanel-tracker/nuxt'

declare module 'nuxt/schema' {
  interface NuxtConfig {
    mixpanelTracker?: NuxtMixpanelTrackerModuleOptions
  }

  interface NuxtOptions {
    mixpanelTracker?: NuxtMixpanelTrackerModuleOptions
  }

  interface PublicRuntimeConfig {
    mixpanelTracker?: NuxtMixpanelTrackerModuleOptions
  }
}

export {}
`
}

export function createNuxtMixpanelTracker(
  options: NuxtMixpanelTrackerOptions,
): MixpanelTracker {
  return createTracker(options)
}

export default defineNuxtModule<NuxtMixpanelTrackerModuleOptions>({
  meta: {
    name: '@mixchunk/mixpanel-tracker/nuxt',
    configKey: 'mixpanelTracker',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  defaults: {
    enabled: true,
    trackPageView: false,
    pageViewEventName: 'Page Viewed',
  },
  setup(options, nuxt) {
    const runtimeConfig = nuxt.options.runtimeConfig
    const publicConfig = runtimeConfig.public as Record<string, unknown>
    const existingOptions = (publicConfig.mixpanelTracker || {}) as NuxtMixpanelTrackerModuleOptions

    publicConfig.mixpanelTracker = {
      ...existingOptions,
      ...removeUndefinedOptions(options),
    }

    addPluginTemplate({
      filename: 'mixpanel-tracker.client.ts',
      mode: 'client',
      write: true,
      getContents: createRuntimePluginContents,
    })

    addTypeTemplate({
      filename: 'types/mixpanel-tracker.d.ts',
      getContents: createRuntimeTypesContents,
    })
  },
})
