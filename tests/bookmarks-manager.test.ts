import { describe, it, expect, vi } from 'vitest'
import {
  validateBookmark,
  fetchBookmarks,
  addBookmark,
  editBookmark,
  deleteBookmark,
} from '@/lib/bookmarks-manager'

describe('bookmarks-manager', () => {
  describe('validateBookmark', () => {
    it('rejects empty title', () => {
      const res = validateBookmark('', 'https://google.com')
      expect(res.isValid).toBe(false)
      expect(res.titleError).toBeDefined()
    })

    it('rejects empty URL', () => {
      const res = validateBookmark('Google', '')
      expect(res.isValid).toBe(false)
      expect(res.urlError).toBeDefined()
    })

    it('auto-prepends https:// when protocol is missing', () => {
      const res = validateBookmark('Google', 'google.com')
      expect(res.isValid).toBe(true)
      expect(res.normalizedUrl).toBe('https://google.com')
    })

    it('rejects unsupported protocols', () => {
      const res = validateBookmark('Hack', 'javascript:alert(1)')
      expect(res.isValid).toBe(false)
      expect(res.urlError).toBe('Invalid URL format.')
    })
  })

  describe('CRUD operations', () => {
    it('fetches recent bookmarks when query is empty', async () => {
      ;(globalThis as any).chrome.bookmarks.getRecent = vi.fn().mockResolvedValue([
        { id: '1', title: 'GitHub', url: 'https://github.com', dateAdded: 100 },
        { id: '2', title: 'Folder', dateAdded: 200 },
      ])

      const list = await fetchBookmarks('')
      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('GitHub')
    })

    it('searches bookmarks when query is provided', async () => {
      ;(globalThis as any).chrome.bookmarks.search = vi.fn().mockResolvedValue([
        { id: '3', title: 'Vitest Docs', url: 'https://vitest.dev', dateAdded: 300 },
      ])

      const list = await fetchBookmarks('vitest')
      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('Vitest Docs')
    })

    it('adds bookmark via chrome.bookmarks.create', async () => {
      const created = await addBookmark('New Tab', 'https://newtab.com')
      expect(created).toBeDefined()
      expect(created?.title).toBe('New Tab')
      expect((globalThis as any).chrome.bookmarks.create).toHaveBeenCalledWith({
        title: 'New Tab',
        url: 'https://newtab.com',
      })
    })

    it('updates bookmark via chrome.bookmarks.update', async () => {
      await editBookmark('1', 'Updated Title', 'https://updated.com')
      expect((globalThis as any).chrome.bookmarks.update).toHaveBeenCalledWith('1', {
        title: 'Updated Title',
        url: 'https://updated.com',
      })
    })

    it('removes bookmark via chrome.bookmarks.remove', async () => {
      await deleteBookmark('1')
      expect((globalThis as any).chrome.bookmarks.remove).toHaveBeenCalledWith('1')
    })
  })
})
