import { addPluginTemplate, addTypeTemplate } from '@nuxt/kit'
import mixpanel from 'mixpanel-browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import nuxtModule, { createNuxtMixpanelTracker } from '../integrations/nuxt'

vi.mock('@nuxt/kit', () => ({
  addPluginTemplate: vi.fn((plugin) => ({
    src: plugin.filename,
    ...plugin,
  })),
  addTypeTemplate: vi.fn((template) => ({
    dst: template.filename,
    ...template,
  })),
  defineNuxtModule: vi.fn((definition) => definition),
}))

vi.mock('mixpanel-browser', () => ({
  default: {
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    people: {
      set: vi.fn(),
    },
  },
}))

interface TestNuxtModuleDefinition {
  setup: (
    options: Record<string, unknown>,
    nuxt: {
      options: {
        runtimeConfig: {
          public: Record<string, unknown>
        }
      }
    },
  ) => void
}

describe('Nuxt integration', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registers a client plugin template', () => {
    const moduleDefinition = nuxtModule as unknown as TestNuxtModuleDefinition
    const nuxt = {
      options: {
        runtimeConfig: {
          public: {},
        },
      },
    }

    moduleDefinition.setup({}, nuxt)

    expect(addPluginTemplate).toHaveBeenCalledWith({
      filename: 'mixpanel-tracker.client.mjs',
      mode: 'client',
      getContents: expect.any(Function),
    })
  })

  it('merges module options into public runtime config', () => {
    const moduleDefinition = nuxtModule as unknown as TestNuxtModuleDefinition
    const nuxt = {
      options: {
        runtimeConfig: {
          public: {
            mixpanelTracker: {
              token: 'runtime-token',
              debug: false,
            },
          },
        },
      },
    }

    moduleDefinition.setup(
      {
        token: 'module-token',
        debug: true,
        trackPageView: true,
        pageViewEventName: 'Route Changed',
        commonProperties: {
          app_name: 'nuxt-app',
        },
      },
      nuxt,
    )

    expect(nuxt.options.runtimeConfig.public.mixpanelTracker).toEqual({
      token: 'module-token',
      debug: true,
      trackPageView: true,
      pageViewEventName: 'Route Changed',
      commonProperties: {
        app_name: 'nuxt-app',
      },
    })
  })

  it('omits undefined module options when merging runtime config', () => {
    const moduleDefinition = nuxtModule as unknown as TestNuxtModuleDefinition
    const nuxt = {
      options: {
        runtimeConfig: {
          public: {
            mixpanelTracker: {
              token: 'runtime-token',
            },
          },
        },
      },
    }

    moduleDefinition.setup(
      {
        token: undefined,
        enabled: false,
      },
      nuxt,
    )

    expect(nuxt.options.runtimeConfig.public.mixpanelTracker).toEqual({
      token: 'runtime-token',
      enabled: false,
    })
  })

  it('generates a client plugin that creates and provides the tracker', () => {
    const moduleDefinition = nuxtModule as unknown as TestNuxtModuleDefinition
    const nuxt = {
      options: {
        runtimeConfig: {
          public: {},
        },
      },
    }

    moduleDefinition.setup({}, nuxt)

    const plugin = vi.mocked(addPluginTemplate).mock.calls[0]?.[0]
    const contents = typeof plugin === 'object' ? plugin.getContents?.({} as never) : ''

    expect(contents).toContain("import { defineNuxtPlugin, useRoute, useRuntimeConfig } from '#app'")
    expect(contents).toContain("import { createTracker } from '@mixchunk/mixpanel-tracker'")
    expect(contents).toContain("import { setupVueRouterTracking } from '@mixchunk/mixpanel-tracker/vue'")
    expect(contents).toContain("nuxtApp.provide('mixpanel', tracker)")
    expect(contents).toContain('setupVueRouterTracking(nuxtApp.$router, tracker')
  })

  it('generates Nuxt app and component types for the injected tracker', () => {
    const moduleDefinition = nuxtModule as unknown as TestNuxtModuleDefinition
    const nuxt = {
      options: {
        runtimeConfig: {
          public: {},
        },
      },
    }

    moduleDefinition.setup({}, nuxt)

    const template = vi.mocked(addTypeTemplate).mock.calls[0]?.[0]
    const contents = typeof template === 'object' ? template.getContents?.({} as never) : ''

    expect(addTypeTemplate).toHaveBeenCalledWith({
      filename: 'types/mixpanel-tracker.d.ts',
      getContents: expect.any(Function),
    })
    expect(contents).toContain("import type { MixpanelTracker } from '@mixchunk/mixpanel-tracker'")
    expect(contents).toContain("declare module '#app'")
    expect(contents).toContain("declare module 'nuxt/app'")
    expect(contents).toContain("declare module 'vue'")
    expect(contents).toContain('$mixpanel: MixpanelTracker')
  })

  it('keeps createNuxtMixpanelTracker as a manual helper', () => {
    const tracker = createNuxtMixpanelTracker({ token: 'test-token' })

    expect(tracker.getState().initialized).toBe(true)
    expect(mixpanel.init).toHaveBeenCalledWith('test-token', {})
  })
})
