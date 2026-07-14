import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import SharePostModal from '../../components/feed/SharePostModal'
import { renderIntoDocument } from '../testUtils'

const { toPngMock } = vi.hoisted(() => ({
  toPngMock: vi.fn().mockResolvedValue('data:image/png;base64,stub'),
}))

vi.mock('html-to-image', () => ({
  toPng: toPngMock,
}))

describe('SharePostModal', () => {
  it('renders a post card and actions', async () => {
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

    const { cleanup } = renderIntoDocument(
      <SharePostModal post={post} onClose={() => {}} />,
    )

    expect(document.body.textContent).toContain('A short post')
    expect(document.body.textContent).toContain('Download Story')
    expect(document.body.textContent).toContain('@bernam07')

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

    const buttons = document.body.querySelectorAll('button')
    await act(async () => {
      buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(toPngMock).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    cleanup()
    createElementSpy.mockRestore()
  })
})
