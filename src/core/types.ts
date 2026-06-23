export type EventPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | EventPropertyValue[]
  | { [key: string]: EventPropertyValue }

export type EventProperties = Record<string, EventPropertyValue>

export type EventName<EventMap> = keyof EventMap & string

export interface MixpanelTrackerOptions {
  token: string
  enabled?: boolean
  debug?: boolean
  apiHost?: string
  persistence?: 'cookie' | 'localStorage' | 'none'
  commonProperties?: EventProperties
  getCommonProperties?: () => EventProperties
  beforeTrack?: (
    eventName: string,
    properties: EventProperties,
  ) => false | EventProperties | void
  onError?: (error: unknown) => void
}

export interface MixpanelTrackerState {
  enabled: boolean
  initialized: boolean
  browser: boolean
}

export interface MixpanelTracker<
  EventMap extends Record<string, EventProperties> = Record<string, EventProperties>,
> {
  track<Event extends EventName<EventMap>>(
    eventName: Event,
    properties: EventMap[Event],
  ): void
  track(eventName: string, properties?: EventProperties): void
  identify(userId: string): void
  setUserProperties(properties: EventProperties): void
  registerCommonProperties(properties: EventProperties): void
  unregisterCommonProperty(name: string): void
  reset(): void
  getState(): MixpanelTrackerState
}