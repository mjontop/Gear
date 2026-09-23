import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  getSpotlightPreferences,
  saveSpotlightPreferences,
  resolveTheme,
  useSpotlightPreferences,
  useTheme,
  DEFAULT_SPOTLIGHT_PREFERENCES,
} from '@/lib/preferences'

describe('preferences', () => {
  it('returns default preferences when none are stored', async () => {
    const prefs = await getSpotlightPreferences()
    expect(prefs).toEqual(DEFAULT_SPOTLIGHT_PREFERENCES)
  })

  it('saves and retrieves preferences using storage.sync', async () => {
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      theme: 'light',
      searchProvider: 'duckduckgo',
    })

    const updated = await getSpotlightPreferences()
    expect(updated.theme).toBe('light')
    expect(updated.searchProvider).toBe('duckduckgo')
  })

  it('resolves theme correctly', () => {
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')

    const matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: query.includes('light'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    window.matchMedia = matchMediaMock

    expect(resolveTheme('system')).toBe('light')
  })

  it('useSpotlightPreferences hook loads and updates state', async () => {
    const { result } = renderHook(() => useSpotlightPreferences())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    await act(async () => {
      await result.current.updatePreference('theme', 'light')
    })

    expect(result.current.preferences.theme).toBe('light')
  })

  it('useTheme hook resolves dynamic theme', () => {
    const { result } = renderHook(() => useTheme('light'))
    expect(result.current).toBe('light')
  })
})
