import { defineComponent, h } from 'vue'
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'
import type { ExampleEventMap } from '../analytics'

export default defineComponent({
  name: 'HomePage',
  setup() {
    const mixpanel = useMixpanel<ExampleEventMap>()

    const trackCta = () => {
      mixpanel.track('CTA Clicked', {
        button_name: 'Create Project',
        page_name: 'Home',
      })
    }

    const trackProject = () => {
      mixpanel.track('Project Created', {
        project_id: `project-${Date.now()}`,
        source: 'template',
      })
    }

    return () =>
      h('section', { class: 'panel' }, [
        h('h1', 'Vue tracking example'),
        h(
          'p',
          'This page demonstrates createTracker, createVueMixpanel, useMixpanel, and Vue Router page-view tracking.',
        ),
        h('div', { class: 'actions' }, [
          h('button', { class: 'button', onClick: trackCta }, 'Track CTA Clicked'),
          h('button', { class: 'button secondary', onClick: trackProject }, 'Track Project Created'),
        ]),
        h(
          'p',
          { class: 'status' },
          import.meta.env.VITE_MIXPANEL_TOKEN
            ? 'Tracking is enabled with VITE_MIXPANEL_TOKEN.'
            : 'Tracking is disabled until VITE_MIXPANEL_TOKEN is configured.',
        ),
      ])
  },
})