import { createTracker } from '@mixchunk/mixpanel-tracker'
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'
import type { ComponentCustomProperties } from 'vue'

type AppEventMap = {
  'Project Created': {
    project_id: string
    source: 'blank' | 'template'
  }
  'Invite Sent': {
    invitee_role: 'admin' | 'member'
  }
}

declare module '@mixchunk/mixpanel-tracker' {
  interface MixpanelEventRegistry {
    events: AppEventMap
  }
}

const tracker = createTracker({ token: 'test-token' })
const injectedTracker = useMixpanel()
declare const component: ComponentCustomProperties

tracker.track('Project Created', {
  project_id: 'project-1',
  source: 'template',
})
injectedTracker.track('Invite Sent', {
  invitee_role: 'member',
})
component.$mixpanel.track('Invite Sent', {
  invitee_role: 'admin',
})

// @ts-expect-error Registered trackers reject unknown events.
tracker.track('Unknown Event', {})

// @ts-expect-error Registered event properties are required.
injectedTracker.track('Project Created')

component.$mixpanel.track('Invite Sent', {
  // @ts-expect-error Registered event property literals are enforced.
  invitee_role: 'owner',
})
