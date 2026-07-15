import type { App, InjectionKey, Plugin } from 'vue'
import { inject } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type {
  EventProperties,
  MixpanelTracker,
  RegisteredMixpanelEventMap,
  ValidEventMap,
} from '../core/types'

export const mixpanelTrackerKey: InjectionKey<MixpanelTracker> = Symbol('mixpanel-tracker')

export interface VueRouterTrackingOptions {
  eventName?: string
  getProperties?: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
  ) => EventProperties | false
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $mixpanel: MixpanelTracker
  }
}

export function createVueMixpanel<
  EventMap extends ValidEventMap<EventMap> = RegisteredMixpanelEventMap,
>(tracker: MixpanelTracker<EventMap>): Plugin {
  return {
    install(app: App) {
      app.provide(mixpanelTrackerKey, tracker as MixpanelTracker)
      app.config.globalProperties.$mixpanel = tracker
    },
  }
}

export function useMixpanel<
  EventMap extends ValidEventMap<EventMap> = RegisteredMixpanelEventMap,
>(): MixpanelTracker<EventMap> {
  const tracker = inject(mixpanelTrackerKey)

  if (!tracker) {
    throw new Error('Mixpanel tracker is not provided. Did you install createVueMixpanel?')
  }

  return tracker as MixpanelTracker<EventMap>
}

export function setupVueRouterTracking<
  EventMap extends ValidEventMap<EventMap> = RegisteredMixpanelEventMap,
>(
  router: Router,
  tracker: MixpanelTracker<EventMap>,
  options: VueRouterTrackingOptions = {},
): () => void {
  const eventName = options.eventName ?? 'Page Viewed'
  const runtimeTracker = tracker as unknown as MixpanelTracker<
    Record<string, EventProperties>
  >

  return router.afterEach((to, from) => {
    const properties = options.getProperties
      ? options.getProperties(to, from)
      : {
          page_path: to.fullPath,
          page_name: String(to.name || ''),
          referrer_path: from.fullPath,
        }

    if (properties === false) {
      return
    }

    runtimeTracker.track(eventName, properties)
  })
}
