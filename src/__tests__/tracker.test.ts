import mixpanel from 'mixpanel-browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTracker } from '../core/tracker'

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

const mockedMixpanel = vi.mocked(mixpanel)

describe('createTracker', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates a tracker with the base API', () => {
    const tracker = createTracker({ token: 'test-token' })

    expect(tracker).toEqual({
      track: expect.any(Function),
      identify: expect.any(Function),
      setUserProperties: expect.any(Function),
      registerCommonProperties: expect.any(Function),
      unregisterCommonProperty: expect.any(Function),
      reset: expect.any(Function),
      getState: expect.any(Function),
    })
  })

  it('initializes mixpanel in browser environments when enabled', () => {
    createTracker({
      token: 'test-token',
      debug: true,
      apiHost: 'https://api.mixpanel.com',
      persistence: 'localStorage',
    })

    expect(mockedMixpanel.init).toHaveBeenCalledWith('test-token', {
      api_host: 'https://api.mixpanel.com',
      debug: true,
      persistence: 'localStorage',
    })
  })

  it('does not call beforeTrack when disabled', () => {
    const beforeTrack = vi.fn()
    const tracker = createTracker({
      token: 'test-token',
      enabled: false,
      beforeTrack,
    })

    tracker.track('Page Viewed')

    expect(mockedMixpanel.init).not.toHaveBeenCalled()
    expect(beforeTrack).not.toHaveBeenCalled()
  })

  it('does not initialize or track outside browser environments', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    const tracker = createTracker({ token: 'test-token' })

    tracker.track('Page Viewed')

    expect(mockedMixpanel.init).not.toHaveBeenCalled()
    expect(mockedMixpanel.track).not.toHaveBeenCalled()
    expect(tracker.getState()).toEqual({
      enabled: true,
      initialized: false,
      browser: false,
    })
  })

  it('reports empty token errors and enters no-op mode', () => {
    const onError = vi.fn()
    const tracker = createTracker({ token: '', onError })

    tracker.track('Page Viewed')

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(mockedMixpanel.init).not.toHaveBeenCalled()
    expect(mockedMixpanel.track).not.toHaveBeenCalled()
    expect(tracker.getState().initialized).toBe(false)
  })

  it('merges properties with the expected precedence and removes undefined values', () => {
    const tracker = createTracker({
      token: 'test-token',
      commonProperties: {
        source: 'static',
        app_name: 'console',
      },
      getCommonProperties: () => ({
        source: 'dynamic',
        route_name: 'home',
      }),
    })

    tracker.registerCommonProperties({
      source: 'runtime',
      tenant_id: 'tenant-1',
    })

    tracker.track('Project Created', {
      source: 'event',
      project_id: 'project-1',
      ignored: undefined,
    })

    expect(mockedMixpanel.track).toHaveBeenCalledWith('Project Created', {
      app_name: 'console',
      route_name: 'home',
      tenant_id: 'tenant-1',
      source: 'event',
      project_id: 'project-1',
    })
  })

  it('reads dynamic common properties for every track call', () => {
    const getCommonProperties = vi
      .fn()
      .mockReturnValueOnce({ count: 1 })
      .mockReturnValueOnce({ count: 2 })

    const tracker = createTracker({
      token: 'test-token',
      getCommonProperties,
    })

    tracker.track('Page Viewed')
    tracker.track('Page Viewed')

    expect(getCommonProperties).toHaveBeenCalledTimes(2)
    expect(mockedMixpanel.track).toHaveBeenNthCalledWith(1, 'Page Viewed', {
      count: 1,
    })
    expect(mockedMixpanel.track).toHaveBeenNthCalledWith(2, 'Page Viewed', {
      count: 2,
    })
  })

  it('lets beforeTrack block events', () => {
    const tracker = createTracker({
      token: 'test-token',
      beforeTrack: () => false,
    })

    tracker.track('Blocked Event')

    expect(mockedMixpanel.track).not.toHaveBeenCalled()
  })

  it('lets beforeTrack replace final properties', () => {
    const tracker = createTracker({
      token: 'test-token',
      commonProperties: {
        source: 'common',
      },
      beforeTrack: () => ({
        replaced: true,
      }),
    })

    tracker.track('Replaced Event', {
      source: 'event',
    })

    expect(mockedMixpanel.track).toHaveBeenCalledWith('Replaced Event', {
      replaced: true,
    })
  })

  it('calls identify, people.set, and reset on mixpanel', () => {
    const tracker = createTracker({ token: 'test-token' })

    tracker.identify('user-1')
    tracker.setUserProperties({
      user_role: 'admin',
      ignored: undefined,
    })
    tracker.reset()

    expect(mockedMixpanel.identify).toHaveBeenCalledWith('user-1')
    expect(mockedMixpanel.people.set).toHaveBeenCalledWith({
      user_role: 'admin',
    })
    expect(mockedMixpanel.reset).toHaveBeenCalled()
  })

  it('clears runtime common properties on reset', () => {
    const tracker = createTracker({ token: 'test-token' })

    tracker.registerCommonProperties({ tenant_id: 'tenant-1' })
    tracker.reset()
    tracker.track('Page Viewed')

    expect(mockedMixpanel.track).toHaveBeenCalledWith('Page Viewed', {})
  })

  it('sends SDK errors to onError without throwing to the caller', () => {
    const onError = vi.fn()
    mockedMixpanel.track.mockImplementationOnce(() => {
      throw new Error('track failed')
    })

    const tracker = createTracker({ token: 'test-token', onError })

    expect(() => tracker.track('Broken Event')).not.toThrow()
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('maps persistence none to disabled persistence', () => {
    createTracker({
      token: 'test-token',
      persistence: 'none',
    })

    expect(mockedMixpanel.init).toHaveBeenCalledWith('test-token', {
      disable_persistence: true,
    })
  })
})