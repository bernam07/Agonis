import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  supabaseMock,
  listGamesUpsertMock,
  listGamesInsertMock,
  userGamesUpsertMock,
  userGamesDeleteMatchMock,
} = vi.hoisted(() => {
  const listGamesUpsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const listGamesInsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const userGamesUpsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const userGamesDeleteMatchMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const loadListsOrderMock = vi.fn().mockResolvedValue({ data: [{ id: 'list-1', name: 'Favorites' }] })
  const loadScreenshotsOrderMock = vi.fn().mockResolvedValue({ data: [] })
  const communityNotMock = vi.fn().mockResolvedValue({
    data: [
      {
        rating: 5,
        review: 'One of the best games ever.',
        profiles: { username: 'sam', avatar_url: '' },
      },
    ],
    error: null,
  })
  const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })

  const supabaseMock = {
    auth: {
      getUser: getUserMock,
    },
    from: vi.fn((table: string) => {
      if (table === 'lists') {
        return {
          select: () => ({
            eq: () => ({
              order: loadListsOrderMock,
            }),
          }),
        }
      }

      if (table === 'game_screenshots') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: loadScreenshotsOrderMock,
              }),
            }),
          }),
        }
      }

      if (table === 'user_games') {
        return {
          select: () => ({
            eq: () => ({
              not: communityNotMock,
            }),
          }),
          upsert: userGamesUpsertMock,
          delete: () => ({
            match: userGamesDeleteMatchMock,
          }),
        }
      }

      if (table === 'list_games') {
        return {
          upsert: listGamesUpsertMock,
          insert: listGamesInsertMock,
        }
      }

      if (table === 'notifications') {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }

      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { username: 'sam' }, error: null }),
            }),
          }),
        }
      }

      return {}
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.png' } }),
      })),
    },
  }

  return {
    supabaseMock,
    listGamesUpsertMock,
    listGamesInsertMock,
    userGamesUpsertMock,
    userGamesDeleteMatchMock,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
}))

vi.mock('../../components/game/ShareModal', () => ({
  default: () => <div data-testid="share-modal" />,
}))

import GameModal from '../../components/game/GameModal'
import { renderIntoDocument } from '../testUtils'

const game = {
  id: 1,
  igdb_id: 1,
  name: 'Halo',
  cover: { url: 'https://example.com/t_thumb.jpg' },
  summary: 'A legendary sci-fi shooter.',
  platforms: [{ id: 1, name: 'PC' }],
}

const userGame = {
  status: 'playing',
  rating: 4,
  review: 'Great game.',
  completed_at: null,
}

describe('GameModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('renders details and saves changes', async () => {
    const onClose = vi.fn()
    const onRefresh = vi.fn()
    const { container, cleanup } = renderIntoDocument(
      <GameModal game={game} userGame={userGame} onClose={onClose} onRefresh={onRefresh} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Halo')
    expect(container.textContent).toContain('Track Status')
    expect(container.textContent).toContain('Game Details')
    expect(container.textContent).toContain('Screenshots')
    expect(container.textContent).toContain('Community')
    expect(container.textContent).toContain('Save Changes')

    const buttons = Array.from(container.querySelectorAll('button'))
    const saveButton = buttons.find((button) => button.textContent?.includes('Save Changes'))
    expect(saveButton).toBeTruthy()

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(listGamesUpsertMock).toHaveBeenCalled()
    expect(userGamesUpsertMock).toHaveBeenCalled()
    expect(onRefresh).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()

    cleanup()
  })

  it('removes the game from the library', async () => {
    const onClose = vi.fn()
    const onRefresh = vi.fn()
    const { container, cleanup } = renderIntoDocument(
      <GameModal game={game} userGame={userGame} onClose={onClose} onRefresh={onRefresh} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    const removeButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Remove from Library'),
    )

    expect(removeButton).toBeTruthy()

    await act(async () => {
      removeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(userGamesDeleteMatchMock).toHaveBeenCalled()
    expect(onRefresh).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()

    cleanup()
  })

  it('adds the game to a custom list and opens the share modal', async () => {
    const onClose = vi.fn()
    const onRefresh = vi.fn()
    const { container, cleanup } = renderIntoDocument(
      <GameModal game={game} userGame={userGame} onClose={onClose} onRefresh={onRefresh} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    const select = container.querySelector('select') as HTMLSelectElement
    await act(async () => {
      Object.defineProperty(select, 'value', {
        value: 'list-1',
        writable: true,
      })
      select.dispatchEvent(new Event('change', { bubbles: true }))
      await Promise.resolve()
    })

    const addButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add'),
    )

    expect(addButton).toBeTruthy()

    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(listGamesInsertMock).toHaveBeenCalled()

    const exportButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Export Review Card'),
    )
    expect(exportButton).toBeTruthy()

    await act(async () => {
      exportButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="share-modal"]')).toBeTruthy()

    cleanup()
  })
})
