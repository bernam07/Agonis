import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'

const { supabaseMock } = vi.hoisted(() => {
  const userGamesData = [
    { id: 1, igdb_id: 1, status: 'completed', rating: 5, created_at: '2026-01-02T00:00:00.000Z' },
    { id: 2, igdb_id: 2, status: 'backlog', rating: 2, created_at: '2026-01-01T00:00:00.000Z' },
  ]
  const igdbGames = [
    { id: 1, name: 'Game One', cover: { url: 'https://example.com/t_thumb.jpg' } },
    { id: 2, name: 'Game Two', cover: { url: 'https://example.com/t_thumb.jpg' } },
  ]

  const supabaseMock = {
    from: vi.fn((table: string) => {
      if (table === 'user_games') {
        return { select: () => ({ eq: () => Promise.resolve({ data: userGamesData, error: null }) }) }
      }
      return {}
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: igdbGames, error: null }),
    },
  }

  return { supabaseMock }
})

vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
}))

vi.mock('../../components/game/GameModal', () => ({
  default: () => <div data-testid="game-modal" />,
}))

import MyLibrary from '../../components/library/MyLibrary'
import { renderIntoDocument, waitFor } from '../testUtils'

describe('MyLibrary', () => {
  it('filters games by status', async () => {
    const { container, cleanup } = renderIntoDocument(<MyLibrary userId="user-1" />)

    await waitFor(() => {
      expect(container.textContent).toContain('Game One')
      expect(container.textContent).toContain('Game Two')
    })

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
