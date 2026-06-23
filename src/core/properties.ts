import type { EventProperties } from './types'

export function mergeProperties(...sources: Array<EventProperties | undefined>): EventProperties {
  return Object.assign({}, ...sources)
}

export function removeUndefinedProperties(properties: EventProperties): EventProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as EventProperties
}