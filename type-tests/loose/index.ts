import { createTracker } from '@mixchunk/mixpanel-tracker'

const tracker = createTracker({ token: 'test-token' })

tracker.track('Any Event')
tracker.track('Another Event', {
  arbitrary_property: true,
})

type LocalEventMap = {
  'Project Created': {
    project_id: string
    source: 'blank' | 'template'
  }
}

const localTracker = createTracker<LocalEventMap>({ token: 'test-token' })

localTracker.track('Project Created', {
  project_id: 'project-1',
  source: 'template',
})

// @ts-expect-error Unknown events are rejected for explicit event maps.
localTracker.track('Unknown Event', {})

// @ts-expect-error Event properties are required for explicit event maps.
localTracker.track('Project Created')

localTracker.track('Project Created', {
  // @ts-expect-error Event property values must match the event map.
  project_id: 1,
  source: 'template',
})
