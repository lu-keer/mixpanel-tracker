import { defineComponent, h } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

export default defineComponent({
  name: 'App',
  setup() {
    return () =>
      h('div', { class: 'app-shell' }, [
        h('header', { class: 'topbar' }, [
          h('div', { class: 'brand' }, 'Mixpanel Tracker Vue Example'),
          h('nav', { class: 'nav' }, [
            h(RouterLink, { to: '/' }, { default: () => 'Home' }),
            h(RouterLink, { to: '/settings' }, { default: () => 'Settings' }),
          ]),
        ]),
        h('main', { class: 'main' }, [h(RouterView)]),
      ])
  },
})