/// <reference types="vite/client" />

import type { ExampleEventMap } from './analytics'

declare module '@mixchunk/mixpanel-tracker' {
  interface MixpanelEventRegistry {
    events: ExampleEventMap
  }
}
