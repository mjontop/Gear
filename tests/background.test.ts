import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { COMMAND_NAMES, MESSAGE_TYPES } from '@/constants'

describe('background script', () => {
  let commandListener: (cmd: string) => Promise<void>
  let messageListener: (msg: any, sender: any, sendResponse: any) => boolean

  beforeAll(async () => {
    ;(globalThis as any).chrome.commands.onCommand.addListener = (fn: any) => {
      commandListener = fn
    }
    ;(globalThis as any).chrome.runtime.onMessage.addListener = (fn: any) => {
      messageListener = fn
    }

    await import('@/background')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles toggle-spotlight command on unrestricted tab', async () => {
    ;(globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
      { id: 101, url: 'https://example.com' },
    ])

    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT)

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(101, {
      type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT,
    })
  })

  it('ignores toggle-spotlight on restricted tab', async () => {
    ;(globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
      { id: 102, url: 'chrome://extensions' },
    ])

    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT)

    expect((globalThis as any).chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })

  it('handles copy-current-url command', async () => {
    ;(globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
      { id: 103, url: 'https://github.com' },
    ])

    await commandListener(COMMAND_NAMES.COPY_CURRENT_URL)

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(103, {
      type: MESSAGE_TYPES.COPY_CURRENT_URL,
      url: 'https://github.com',
    })
  })

  it('handles open-spotlight-with-url command', async () => {
    ;(globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
      { id: 104, url: 'https://vitest.dev' },
    ])

    await commandListener(COMMAND_NAMES.OPEN_SPOTLIGHT_WITH_URL)

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(104, {
      type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
      url: 'https://vitest.dev',
    })
  })

  it('handles runtime message: GET_OPEN_TABS', async () => {
    ;(globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
      { id: 1, title: 'Tab 1', url: 'https://tab1.com', active: false, index: 0, windowId: 1 },
    ])

    const sendResponse = vi.fn()
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_OPEN_TABS },
      { tab: { id: 2 } },
      sendResponse
    )

    expect(willRespond).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect(sendResponse).toHaveBeenCalled()
  })

  it('handles runtime message: SWITCH_TO_TAB', async () => {
    const sendResponse = vi.fn()
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.SWITCH_TO_TAB, tabId: 5, windowId: 1 },
      {},
      sendResponse
    )

    expect(willRespond).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
  })

  it('handles runtime message: OPEN_URL', async () => {
    const sendResponse = vi.fn()
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.OPEN_URL, url: 'https://newsite.com' },
      {},
      sendResponse
    )

    expect(willRespond).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect((globalThis as any).chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://newsite.com' })
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
  })

  it('handles runtime message: GET_SEARCH_SUGGESTIONS', async () => {
    const sendResponse = vi.fn()
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS, query: '   ', provider: 'google' },
      {},
      sendResponse
    )

    expect(willRespond).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect(sendResponse).toHaveBeenCalledWith({ suggestions: [] })
  })

  it('handles runtime message: GET_BOOKMARKS', async () => {
    const sendResponse = vi.fn()
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_BOOKMARKS, query: 'test' },
      {},
      sendResponse
    )

    expect(willRespond).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect(sendResponse).toHaveBeenCalled()
  })

  it('handles runtime message: GET_HISTORY', async () => {
    const sendResponse = vi.fn()
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_HISTORY, query: 'test' },
      {},
      sendResponse
    )

    expect(willRespond).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect(sendResponse).toHaveBeenCalled()
  })

  it('returns false for unknown runtime messages', () => {
    const sendResponse = vi.fn()
    const willRespond = messageListener({ type: 'UNKNOWN_ACTION' } as any, {}, sendResponse)
    expect(willRespond).toBe(false)
  })
})
