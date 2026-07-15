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

// This interface is intentionally empty so applications can augment it.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MixpanelEventRegistry {}

export type ValidEventMap<EventMap> = {
  [Event in keyof EventMap]: EventProperties
}

export type RegisteredMixpanelEventMap = MixpanelEventRegistry extends {
  events: infer EventMap
}
  ? EventMap extends ValidEventMap<EventMap>
    ? EventMap
    : never
  : Record<string, EventProperties>

export type EventName<EventMap> = keyof EventMap & string

type TrackArguments<EventMap, Event extends EventName<EventMap>> =
  string extends EventName<EventMap>
    ? [properties?: EventProperties]
    : [properties: EventMap[Event]]

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
  EventMap extends ValidEventMap<EventMap> = RegisteredMixpanelEventMap,
> {
  track<Event extends EventName<EventMap>>(
    eventName: Event,
    ...args: TrackArguments<EventMap, Event>
  ): void
  identify(userId: string): void
  setUserProperties(properties: EventProperties): void
  registerCommonProperties(properties: EventProperties): void
  unregisterCommonProperty(name: string): void
  reset(): void
  getState(): MixpanelTrackerState
}
