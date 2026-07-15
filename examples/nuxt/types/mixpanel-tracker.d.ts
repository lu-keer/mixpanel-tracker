import type { MixpanelEventMap as AppMixpanelEventMap } from '../analytics/events'

declare module '@mixchunk/mixpanel-tracker' {
  interface MixpanelEventRegistry {
    events: AppMixpanelEventMap
  }
}

export {}
