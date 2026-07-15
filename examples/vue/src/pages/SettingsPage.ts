import { defineComponent, h } from 'vue'
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'

export default defineComponent({
  name: 'SettingsPage',
  setup() {
    const mixpanel = useMixpanel()

    return () =>
      h('section', { class: 'panel' }, [
        h('h1', 'Settings'),
        h('p', 'Runtime common properties are registered during app startup.'),
        h('div', { class: 'actions' }, [
          h(
            'button',
            {
              class: 'button',
              onClick: () =>
                mixpanel.track('CTA Clicked', {
                  button_name: 'Save Settings',
                  page_name: 'Settings',
                }),
            },
            'Track Save Settings',
          ),
        ]),
      ])
  },
})
