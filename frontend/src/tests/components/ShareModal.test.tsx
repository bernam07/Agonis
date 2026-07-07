import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

const { toPngMock, supabaseMock } = vi.hoisted(() => {
  const toPngMock = vi.fn().mockResolvedValue('data:image/png;base64,stub')
  const profilesSingleMock = vi.fn().mockResolvedValue({ data: { username: 'bernam07' }, error: null })

  const supabaseMock = {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          single: profilesSingleMock,
        }),
      }),
    })),
  }

  return { toPngMock, supabaseMock }
})

vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
}))

vi.mock('html-to-image', () => ({
  toPng: toPngMock,
}))

import ShareModal from '../../components/game/ShareModal'
import { renderIntoDocument } from '../testUtils'

describe('ShareModal', () => {
  it('renders and downloads the review card', async () => {
    const onClose = vi.fn()
    const game = {
      name: 'Halo',
      cover: { url: 'https://example.com/t_thumb.jpg' },
    }
    const userGame = {
      user_id: 'user-1',
      rating: 4,
      review: 'Great game.',
    }

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

    const { container, cleanup } = renderIntoDocument(
      <ShareModal game={game} userGame={userGame} onClose={onClose} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Download Card')
    expect(container.textContent).toContain('Halo')
    expect(container.textContent).toContain('Great game.')
    expect(container.textContent).toContain('@bernam07')

    const downloadButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Download Card'),
    )

    await act(async () => {
      downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(toPngMock).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    const closeButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Cancel'),
    )

    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(onClose).toHaveBeenCalled()
    cleanup()
    createElementSpy.mockRestore()
  })
})
