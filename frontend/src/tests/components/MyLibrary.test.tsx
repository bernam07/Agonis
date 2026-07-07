import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../components/GameModal', () => ({
  default: () => <div data-testid="game-modal" />,
}))

import MyLibrary from '../../components/MyLibrary'
import { renderIntoDocument } from '../testUtils'

describe('MyLibrary', () => {
  it('filters games by status', async () => {
    const setLibrary = vi.fn()
    const library = [
      {
        id: 1,
        name: 'Game One',
        status: 'completed',
        rating: 5,
        cover: { url: 'https://example.com/t_thumb.jpg' },
      },
      {
        id: 2,
        name: 'Game Two',
        status: 'backlog',
        rating: 2,
        cover: { url: 'https://example.com/t_thumb.jpg' },
      },
    ]

    const { container, cleanup } = renderIntoDocument(<MyLibrary library={library} setLibrary={setLibrary} />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Game One')
    expect(container.textContent).toContain('Game Two')

    const completedButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('completed'),
    )

    await act(async () => {
      completedButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Game One')
    expect(container.textContent).not.toContain('Game Two')

    const backlogButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('backlog'),
    )

    await act(async () => {
      backlogButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Game Two')
    expect(container.textContent).not.toContain('Game One')

    cleanup()
  })
})
