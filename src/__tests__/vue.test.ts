import { createApp, defineComponent } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MixpanelTracker } from '../core/types'
import {
  createVueMixpanel,
  setupVueRouterTracking,
  useMixpanel,
} from '../integrations/vue'

function createMockTracker(): MixpanelTracker {
  return {
    track: vi.fn(),
    identify: vi.fn(),
    setUserProperties: vi.fn(),
    registerCommonProperties: vi.fn(),
    unregisterCommonProperty: vi.fn(),
    reset: vi.fn(),
    getState: vi.fn(() => ({
      enabled: true,
      initialized: true,
      browser: true,
    })),
  } as unknown as MixpanelTracker
}

function createRoute(
  route: Partial<RouteLocationNormalizedLoaded>,
): RouteLocationNormalizedLoaded {
  return {
    fullPath: '',
    name: undefined,
    ...route,
  } as RouteLocationNormalizedLoaded
}

describe('Vue integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('provides the tracker through createVueMixpanel and useMixpanel', () => {
    const tracker = createMockTracker()
    let injectedTracker: MixpanelTracker | undefined

    const App = defineComponent({
      setup() {
        injectedTracker = useMixpanel()
        return () => null
      },
    })

    const root = document.createElement('div')
    const app = createApp(App)

    app.use(createVueMixpanel(tracker))
    app.mount(root)

    expect(injectedTracker).toBe(tracker)

    app.unmount()
  })

  it('throws a clear error when useMixpanel is called without a provider', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(() => useMixpanel()).toThrow(
      'Mixpanel tracker is not provided. Did you install createVueMixpanel?',
    )
  })

  it('sets $mixpanel on app global properties', () => {
    const tracker = createMockTracker()
    const app = createApp({})

    app.use(createVueMixpanel(tracker))

    expect(app.config.globalProperties.$mixpanel).toBe(tracker)
  })

  it('registers a router afterEach hook and returns the remove function', () => {
    const tracker = createMockTracker()
    const removeHook = vi.fn()
    const afterEach = vi.fn(() => removeHook)
    const router = { afterEach } as unknown as Router

    const remove = setupVueRouterTracking(router, tracker)

    expect(afterEach).toHaveBeenCalledWith(expect.any(Function))
    expect(remove).toBe(removeHook)
  })

  it('tracks page views with default route properties', () => {
    const tracker = createMockTracker()
    let hook: Parameters<Router['afterEach']>[0] | undefined
    const router = {
      afterEach: vi.fn((registeredHook: Parameters<Router['afterEach']>[0]) => {
        hook = registeredHook
        return vi.fn()
      }),
    } as unknown as Router

    setupVueRouterTracking(router, tracker)

    hook?.(
      createRoute({ fullPath: '/projects', name: 'Projects' }),
      createRoute({ fullPath: '/home', name: 'Home' }),
      undefined,
    )

    expect(tracker.track).toHaveBeenCalledWith('Page Viewed', {
      page_path: '/projects',
      page_name: 'Projects',
      referrer_path: '/home',
    })
  })

  it('supports custom event names and route properties', () => {
    const tracker = createMockTracker()
    let hook: Parameters<Router['afterEach']>[0] | undefined
    const router = {
      afterEach: vi.fn((registeredHook: Parameters<Router['afterEach']>[0]) => {
        hook = registeredHook
        return vi.fn()
      }),
    } as unknown as Router

    setupVueRouterTracking(router, tracker, {
      eventName: 'Route Changed',
      getProperties: (to, from) => ({
        to_path: to.fullPath,
        from_path: from.fullPath,
      }),
    })

    hook?.(
      createRoute({ fullPath: '/settings' }),
      createRoute({ fullPath: '/projects' }),
      undefined,
    )

    expect(tracker.track).toHaveBeenCalledWith('Route Changed', {
      to_path: '/settings',
      from_path: '/projects',
    })
  })

  it('skips tracking when getProperties returns false', () => {
    const tracker = createMockTracker()
    let hook: Parameters<Router['afterEach']>[0] | undefined
    const router = {
      afterEach: vi.fn((registeredHook: Parameters<Router['afterEach']>[0]) => {
        hook = registeredHook
        return vi.fn()
      }),
    } as unknown as Router

    setupVueRouterTracking(router, tracker, {
      getProperties: () => false,
    })

    hook?.(createRoute({ fullPath: '/skip' }), createRoute({ fullPath: '/' }), undefined)

    expect(tracker.track).not.toHaveBeenCalled()
  })
})