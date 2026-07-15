import mixpanel from 'mixpanel-browser'
import type { Config } from 'mixpanel-browser'
import { mergeProperties, removeUndefinedProperties } from './properties'
import type {
  EventProperties,
  MixpanelTracker,
  MixpanelTrackerOptions,
  RegisteredMixpanelEventMap,
  ValidEventMap,
} from './types'

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function createMixpanelConfig(options: MixpanelTrackerOptions): Partial<Config> {
  const config: Partial<Config> = {}

  if (options.apiHost) {
    config.api_host = options.apiHost
  }

  if (options.debug !== undefined) {
    config.debug = options.debug
  }

  if (options.persistence === 'none') {
    config.disable_persistence = true
  } else if (options.persistence) {
    config.persistence = options.persistence
  }

  return config
}

export function createTracker<
  EventMap extends ValidEventMap<EventMap> = RegisteredMixpanelEventMap,
>(options: MixpanelTrackerOptions): MixpanelTracker<EventMap> {
  const runtimeCommonProperties: EventProperties = {}
  const browser = isBrowserEnvironment()
  const enabled = options.enabled !== false
  let initialized = false

  const handleError = (error: unknown) => {
    try {
      options.onError?.(error)
    } catch (onErrorError) {
      if (options.debug) {
        console.error('[mixpanel-tracker] onError callback failed', onErrorError)
      }
    }

    if (options.debug) {
      console.error('[mixpanel-tracker]', error)
    }
  }

  if (enabled && browser) {
    if (!options.token) {
      handleError(new Error('Mixpanel token is required.'))
    } else {
      try {
        mixpanel.init(options.token, createMixpanelConfig(options))
        initialized = true
      } catch (error) {
        handleError(error)
      }
    }
  }

  const canUseMixpanel = () => enabled && browser && initialized

  const tracker: MixpanelTracker<Record<string, EventProperties>> = {
    track(eventName: string, properties: EventProperties = {}) {
      if (!canUseMixpanel()) {
        return
      }

      try {
        const mergedProperties = removeUndefinedProperties(
          mergeProperties(
            options.commonProperties,
            options.getCommonProperties?.(),
            runtimeCommonProperties,
            properties,
          ),
        )

        const beforeTrackResult = options.beforeTrack?.(eventName, mergedProperties)

        if (beforeTrackResult === false) {
          return
        }

        const finalProperties = removeUndefinedProperties(beforeTrackResult ?? mergedProperties)

        mixpanel.track(eventName, finalProperties)

        if (options.debug) {
          console.debug('[mixpanel-tracker] track', eventName, finalProperties)
        }
      } catch (error) {
        handleError(error)
      }
    },
    identify(userId: string) {
      if (!canUseMixpanel()) {
        return
      }

      try {
        mixpanel.identify(userId)

        if (options.debug) {
          console.debug('[mixpanel-tracker] identify', userId)
        }
      } catch (error) {
        handleError(error)
      }
    },
    setUserProperties(properties: EventProperties) {
      if (!canUseMixpanel()) {
        return
      }

      try {
        const sanitizedProperties = removeUndefinedProperties(properties)

        mixpanel.people.set(sanitizedProperties)

        if (options.debug) {
          console.debug('[mixpanel-tracker] set user properties', sanitizedProperties)
        }
      } catch (error) {
        handleError(error)
      }
    },
    registerCommonProperties(properties: EventProperties) {
      Object.assign(runtimeCommonProperties, properties)
    },
    unregisterCommonProperty(name: string) {
      delete runtimeCommonProperties[name]
    },
    reset() {
      for (const name of Object.keys(runtimeCommonProperties)) {
        delete runtimeCommonProperties[name]
      }

      if (!canUseMixpanel()) {
        return
      }

      try {
        mixpanel.reset()
      } catch (error) {
        handleError(error)
      }
    },
    getState() {
      return {
        enabled,
        initialized,
        browser,
      }
    },
  }

  return tracker as MixpanelTracker<EventMap>
}
