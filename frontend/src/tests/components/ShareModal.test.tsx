import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

const { html2canvasMock, supabaseMock } = vi.hoisted(() => {
  const html2canvasMock = vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/jpeg;base64,stub',
  })
  const profilesSingleMock = vi.fn().mockResolvedValue({ data: { username: 'bernam07' }, error: null })
  const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })

  const supabaseMock = {
    auth: {
      getUser: getUserMock,
    },
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          single: profilesSingleMock,
        }),
      }),
    })),
  }

  return { html2canvasMock, supabaseMock }
})

vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
}))

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}))

import ShareModal from '../../components/game/ShareModal'
import { renderIntoDocument } from '../testUtils'

describe('ShareModal', () => {
  it('renders and downloads the review card', async () => {
    const onClose = vi.fn()
    const game = {
      id: 1,
      name: 'Halo',
      cover: { url: 'https://example.com/t_thumb.jpg' },
    } as any

    const userGame = {
      id: '1',
      igdb_id: 1,
      status: 'completed',
      user_id: 'user-1',
      rating: 4,
      review: 'Great game.',
    } as any

    const originalCreateElement = document.createElement.bind(document)
    const clickSpy = vi.fn()
    const createElementSpy = vi.spyOn(document, 'createElement')
    createElementSpy.mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          click: clickSpy,
          set download(_value: string) {},
          set href(_value: string) {},
        } as unknown as HTMLAnchorElement
      }

      return originalCreateElement(tagName)
    })

    const { cleanup } = renderIntoDocument(
      <ShareModal game={game} userGame={userGame} onClose={onClose} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(document.body.textContent).toContain('Save to Device')
    expect(document.body.textContent).toContain('Halo')
    expect(document.body.textContent).toContain('Great game.')
    expect(document.body.textContent).toContain('@bernam07')

    const downloadButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Save to Device'),
    )

    await act(async () => {
      downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(html2canvasMock).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    const closeButton = document.body.querySelector('button[aria-label="Close"]') as HTMLButtonElement

    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(onClose).toHaveBeenCalled()
    cleanup()
    createElementSpy.mockRestore()
  })
})
