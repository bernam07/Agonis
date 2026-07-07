import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseMock } = vi.hoisted(() => {
  const searchInvokeMock = vi.fn((functionName: string, payload?: { body?: { searchQuery?: string } }) => {
    if (functionName === 'search-igdb' && payload?.body?.searchQuery === 'The Last of Us') {
      return Promise.resolve({
        data: [{ id: 1, name: 'The Last of Us', cover: { url: 'https://example.com/t_thumb.jpg' } }],
        error: null,
      })
    }

    if (functionName === 'search-igdb') {
      return Promise.resolve({
        data: [{ id: 2, name: 'Halo Infinite', cover: { url: 'https://example.com/t_thumb.jpg' } }],
        error: null,
      })
    }

    return Promise.resolve({ data: [], error: null })
  })

  const profilesLimitMock = vi.fn().mockResolvedValue({
    data: [{ id: 'user-1', username: 'sam', avatar_url: '', bio: 'Speedrunner' }],
    error: null,
  })

  const supabaseMock = {
    functions: {
      invoke: searchInvokeMock,
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            ilike: () => ({
              limit: profilesLimitMock,
            }),
          }),
        }
      }

      return {}
    }),
  }

  return { supabaseMock }
})

vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
}))

vi.mock('../../components/GameModal', () => ({
  default: () => <div data-testid="game-modal" />,
}))

import GameSearch from '../../components/GameSearch'
import { renderIntoDocument } from '../testUtils'

describe('GameSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders game recommendations and searches for users', async () => {
    const onUserClick = vi.fn()
    const { container, cleanup } = renderIntoDocument(
      <GameSearch library={[]} onUserClick={onUserClick} onRefreshLibrary={() => {}} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Trending & Recommendations')
    expect(container.textContent).toContain('The Last of Us')

    const buttons = Array.from(container.querySelectorAll('button'))
    const usersButton = buttons.find((button) => button.textContent?.includes('Find Users'))
    expect(usersButton).toBeTruthy()

    await act(async () => {
      usersButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    const input = container.querySelector('input') as HTMLInputElement
    await act(async () => {
      Object.defineProperty(input, 'value', {
        value: 'sam',
        writable: true,
      })
      input.dispatchEvent(new Event('input', { bubbles: true }))
      vi.advanceTimersByTime(350)
      await Promise.resolve()
    })

    expect(container.textContent).toContain('@sam')
    expect(container.textContent).toContain('Speedrunner')

    const userCard = Array.from(container.querySelectorAll('div.cursor-pointer')).find((node) =>
      node.textContent?.includes('@sam'),
    )
    expect(userCard).toBeTruthy()

    await act(async () => {
      userCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(onUserClick).toHaveBeenCalledWith('user-1')
    cleanup()
  })
})
