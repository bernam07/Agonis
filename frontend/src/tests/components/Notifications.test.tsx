import { act } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { supabaseMock, updateEqMock, deleteEqMock } = vi.hoisted(() => {
  const notificationsData = [
    {
      id: 'notif-1',
      type: 'like',
      is_read: false,
      created_at: '2026-01-01T12:00:00.000Z',
      receiver_id: 'user-1',
      profiles: { id: 'actor-1', username: 'sam', avatar_url: '' },
    },
  ]

  const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const deleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const removeChannelMock = vi.fn()
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }

  const supabaseMock = {
    auth: {
      getUser: getUserMock,
    },
    channel: vi.fn(() => channelMock),
    removeChannel: removeChannelMock,
    from: vi.fn((table: string) => {
      if (table === 'notifications') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: notificationsData, error: null }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: updateEqMock,
            }),
          }),
          delete: () => ({
            eq: deleteEqMock,
          }),
          insert: insertMock,
        }
      }

      if (table === 'follows' || table === 'follow_requests') {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          delete: () => ({
            match: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }
      }

      return {}
    }),
  }

  return { supabaseMock, updateEqMock, deleteEqMock }
})

vi.mock('../../lib/supabase', () => ({
  supabase: supabaseMock,
}))

import Notifications from '../../components/notifications/Notifications'
import { renderIntoDocument, waitFor } from '../testUtils'

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows unread count and clears notifications', async () => {
    const onUserClick = vi.fn()
    const { container, cleanup } = renderIntoDocument(<Notifications onUserClick={onUserClick} />)

    expect(container.querySelector('button svg')).toBeTruthy()

    await waitFor(() => {
      expect(container.textContent).toContain('1')
    })

    const bellButton = container.querySelector('button') as HTMLButtonElement
    await act(async () => {
      bellButton.click()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(updateEqMock).toHaveBeenCalled()
    })
    expect(container.textContent).toContain('Notifications')
    expect(container.textContent).toContain('@sam')

    const clearAllButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Clear All'),
    )

    await act(async () => {
      clearAllButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(deleteEqMock).toHaveBeenCalled()
      expect(container.textContent).toContain('No notifications yet.')
    })

    cleanup()
  })
})
