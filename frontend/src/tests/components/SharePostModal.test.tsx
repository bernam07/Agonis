import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import SharePostModal from '../../components/SharePostModal'
import { renderIntoDocument } from '../testUtils'

const { toPngMock } = vi.hoisted(() => ({
  toPngMock: vi.fn().mockResolvedValue('data:image/png;base64,stub'),
}))

vi.mock('html-to-image', () => ({
  toPng: toPngMock,
}))

describe('SharePostModal', () => {
  it('renders a post card and actions', () => {
    const post = {
      content: 'A short post',
      image_url: '',
      game_name: 'Game Title',
      game_cover: 'cover-url',
      profiles: {
        username: 'bernam07',
        avatar_url: '',
      },
    }

    const { container, cleanup } = renderIntoDocument(
      <SharePostModal post={post} onClose={() => {}} />,
    )

    expect(container.textContent).toContain('A short post')
    expect(container.textContent).toContain('Download Story')
    expect(container.textContent).toContain('@bernam07')

    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement')
    const clickSpy = vi.fn()
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

    const buttons = container.querySelectorAll('button')
    act(() => {
      buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(toPngMock).toHaveBeenCalled()

    cleanup()
    createElementSpy.mockRestore()
  })
})
