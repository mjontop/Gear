import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isFirefoxBrowser, getFaviconUrl } from '@/lib/favicon'

describe('favicon', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    ;(globalThis as any).chrome.runtime.getURL = vi.fn(
      (path: string) => `chrome-extension://test-id${path.startsWith('/') ? path : `/${path}`}`
    )
  })

  it('detects Chromium by default', () => {
    expect(isFirefoxBrowser()).toBe(false)
  })

  it('detects Firefox via moz-extension scheme', () => {
    ;(globalThis as any).chrome.runtime.getURL = vi.fn(() => 'moz-extension://some-uuid/')
    expect(isFirefoxBrowser()).toBe(true)
  })

  it('detects Firefox via userAgent fallback', () => {
    const originalChrome = (globalThis as any).chrome
    ;(globalThis as any).chrome = undefined

    const originalNavigator = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:142.0) Gecko/20100101 Firefox/142.0' },
      configurable: true,
    })

    expect(isFirefoxBrowser()).toBe(true)

    ;(globalThis as any).chrome = originalChrome
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })

  it('returns empty string for invalid or non-http URLs', () => {
    expect(getFaviconUrl('')).toBe('')
    expect(getFaviconUrl('about:blank')).toBe('')
    expect(getFaviconUrl('file:///C:/test.txt')).toBe('')
  })

  it('generates Chrome-native _favicon URL when in Chromium', () => {
    const url = getFaviconUrl('https://github.com/manikantjha', 32)
    expect(url).toContain('chrome-extension://test-id/_favicon/')
    expect(url).toContain('pageUrl=https%3A%2F%2Fgithub.com%2Fmanikantjha')
    expect(url).toContain('size=32')
  })

  it('generates Google S2 favicon URL when in Firefox', () => {
    ;(globalThis as any).chrome.runtime.getURL = vi.fn(() => 'moz-extension://some-uuid/')
    const url = getFaviconUrl('https://github.com/manikantjha', 32)
    expect(url).toContain('https://www.google.com/s2/favicons')
    expect(url).toContain('domain_url=https%3A%2F%2Fgithub.com%2Fmanikantjha')
    expect(url).toContain('sz=32')
  })
})
