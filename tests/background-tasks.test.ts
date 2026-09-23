import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBookmarks } from '@/background-tasks/bookmarks'
import { getHistory } from '@/background-tasks/history'
import { getOpenTabs } from '@/background-tasks/open-tabs'
import { getSearchSuggestions } from '@/background-tasks/search-suggestions'
import { switchToTab } from '@/background-tasks/switch-tab'

describe('background-tasks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('bookmarks', () => {
    it('fetches and deduplicates bookmarks', async () => {
      ;(globalThis as any).chrome.bookmarks.getRecent = vi.fn().mockResolvedValue([
        { id: '1', title: 'Repo 1', url: 'https://github.com/repo' },
        { id: '2', title: 'Repo 2', url: 'https://github.com/repo' },
        { id: '3', title: 'Empty Folder' },
      ])

      const res = await getBookmarks('')
      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('1')
    })
  })

  describe('history', () => {
    it('fetches and deduplicates history items', async () => {
      ;(globalThis as any).chrome.history.search = vi.fn().mockResolvedValue([
        { id: 'h1', title: 'Google', url: 'https://google.com', lastVisitTime: 1000 },
        { id: 'h2', title: 'Google Duplicate', url: 'https://google.com', lastVisitTime: 2000 },
        { id: 'h3', title: 'Invalid' },
      ])

      const res = await getHistory('google')
      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('h1')
    })
  })

  describe('open-tabs', () => {
    it('excludes current tab and sorts active tab first', async () => {
      ;(globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
        { id: 10, windowId: 1, title: 'Background Tab', url: 'https://tab1.com', active: false, index: 1 },
        { id: 11, windowId: 1, title: 'Active Tab', url: 'https://tab2.com', active: true, index: 2 },
        { id: 99, windowId: 1, title: 'Current Spotlight Tab', url: 'https://current.com', active: true, index: 0 },
      ])

      const tabs = await getOpenTabs(99)
      expect(tabs).toHaveLength(2)
      expect(tabs[0].id).toBe(11)
      expect(tabs[1].id).toBe(10)
    })
  })

  describe('search-suggestions', () => {
    it('returns empty array for empty query', async () => {
      const res = await getSearchSuggestions('   ')
      expect(res).toEqual([])
    })

    it('fetches suggestions from search engine API and formats results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ['react', ['react query', 'react router']],
      }) as any

      const res = await getSearchSuggestions('react', 'google')
      expect(res).toHaveLength(3)
      expect(res[0].query).toBe('react')
      expect(res[1].query).toBe('react query')
    })

    it('falls back to single search suggestion when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any

      const res = await getSearchSuggestions('vite', 'duckduckgo')
      expect(res).toHaveLength(1)
      expect(res[0].query).toBe('vite')
    })
  })

  describe('switch-tab', () => {
    it('focuses window and activates target tab', async () => {
      await switchToTab(42, 1)
      expect((globalThis as any).chrome.windows.update).toHaveBeenCalledWith(1, { focused: true })
      expect((globalThis as any).chrome.tabs.update).toHaveBeenCalledWith(42, { active: true })
    })
  })
})
