import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import ContentApp from '@/content/views/App'
import PopupApp from '@/popup/App'

describe('Application Root Views', () => {
  describe('Content App (content/views/App.tsx)', () => {
    it('renders ContentApp and sets data-theme on host container', () => {
      const hostElem = document.createElement('div')
      hostElem.id = 'crxjs-app'
      document.body.appendChild(hostElem)

      let container: any
      act(() => {
        const rendered = render(<ContentApp />)
        container = rendered.container
      })
      expect(container).toBeInTheDocument()
      expect(hostElem.getAttribute('data-theme')).toBeTruthy()

      document.body.removeChild(hostElem)
    })
  })

  describe('Popup App (popup/App.tsx)', () => {
    it('renders PopupApp with default Bangs tab and switches tabs', async () => {
      render(<PopupApp />)

      expect(screen.getByText('Gear Manager')).toBeInTheDocument()
      expect(screen.getByText('Add Custom Bang')).toBeInTheDocument()

      const prefixInput = screen.getByPlaceholderText('e.g. !gh, !ddg')
      fireEvent.change(prefixInput, { target: { value: '!myb' } })
      const urlInput = screen.getByPlaceholderText('https://github.com/search?q=%s')
      fireEvent.change(urlInput, { target: { value: 'https://mysite.com?q=%s' } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Add Bang/i }))
      })

      fireEvent.click(screen.getByText('Bookmarks'))
      expect(screen.getByText('Add New Bookmark')).toBeInTheDocument()

      const titleInput = screen.getByPlaceholderText('e.g. !f Facebook, GitHub Dashboard')
      fireEvent.change(titleInput, { target: { value: 'My Book' } })
      const bmUrlInput = screen.getByPlaceholderText('https://facebook.com')
      fireEvent.change(bmUrlInput, { target: { value: 'https://mybook.com' } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Add Bookmark/i }))
      })

      fireEvent.click(screen.getByText('Sources'))
      expect(screen.getByText('Spotlight Sources')).toBeInTheDocument()

      const bookmarksToggle = screen.getByLabelText(/Include Bookmarks/i)
      await act(async () => {
        fireEvent.click(bookmarksToggle)
      })
      expect(screen.getByText('Preferences saved')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Settings'))
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(screen.getByText('Backup & Restore')).toBeInTheDocument()

      const exportBtn = screen.getByRole('button', { name: /Export Backup/i })
      await act(async () => {
        fireEvent.click(exportBtn)
      })
    })
  })
})
