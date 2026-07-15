/*
 Copyright 2026 Bernardo Miguel Fernandes Martins

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Bell } from 'lucide-react'
import { useCurrentUserId } from '../../hooks/useCurrentUserId'
import PremiumUsername from '../common/PremiumUsername'

async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      id, type, is_read, created_at,
      profiles!notifications_actor_id_fkey (id, username, avatar_url, is_premium, accent_color)
    `
    )
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data as any[]) ?? []
}

export default function Notifications({ onUserClick }: { onUserClick: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { data: userId } = useCurrentUserId()
  const notificationsQueryKey = ['notifications', userId] as const

  const { data: notifications = [] } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => fetchNotifications(userId as string),
    enabled: !!userId,
  })

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const acceptRequestMutation = useMutation({
    mutationFn: async (notif: any) => {
      await supabase.from('follows').insert([{ follower_id: notif.profiles.id, following_id: notif.receiver_id }])
      await supabase.from('follow_requests').delete().match({ sender_id: notif.profiles.id, receiver_id: notif.receiver_id })
      await supabase.from('notifications').update({ type: 'follow', is_read: true }).eq('id', notif.id)
      await supabase.from('notifications').insert([
        { receiver_id: notif.profiles.id, actor_id: notif.receiver_id, type: 'follow_accepted' },
      ])
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  })

  const rejectRequestMutation = useMutation({
    mutationFn: async (notif: any) => {
      await supabase.from('follow_requests').delete().match({ sender_id: notif.profiles.id, receiver_id: notif.receiver_id })
      await supabase.from('notifications').delete().eq('id', notif.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  })

  const markAsRead = async () => {
    if (unreadCount === 0 || !userId) return
    queryClient.setQueryData(notificationsQueryKey, (old: any[] = []) => old.map((n) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', userId).eq('is_read', false)
  }

  const toggleDropdown = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) markAsRead()
  }

  const clearAllNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userId) return

    queryClient.setQueryData(notificationsQueryKey, [])
    await supabase.from('notifications').delete().eq('receiver_id', userId)
  }

  const clearSingleNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation()
    queryClient.setQueryData(notificationsQueryKey, (old: any[] = []) => old.filter((n) => n.id !== notifId))
    await supabase.from('notifications').delete().eq('id', notifId)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-50 dark:border-zinc-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[10px] font-bold text-zinc-500 hover:text-rose-500 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-medium">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    setIsOpen(false)
                    if (notif.profiles?.id) onUserClick(notif.profiles.id)
                  }}
                  className={`group relative p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-start gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${!notif.is_read ? 'bg-indigo-50 dark:bg-indigo-950/10' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 mt-0.5">
                    {notif.profiles?.avatar_url ? (
                      <img src={notif.profiles.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 text-sm">
                        {notif.profiles?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="text-sm flex-1 pr-4">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      <PremiumUsername
                        username={notif.profiles?.username}
                        isPremium={notif.profiles?.is_premium}
                        accentColor={notif.profiles?.accent_color}
                        iconClassName="w-3 h-3"
                      />{' '}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {notif.type === 'like' && 'liked your post.'}
                      {notif.type === 'follow' && 'started following you.'}
                      {notif.type === 'follow_request' && 'sent you a follow request.'}
                      {notif.type === 'follow_accepted' && 'accepted your follow request.'}
                      {notif.type === 'comment' && 'commented on your post.'}
                      {notif.type === 'mention' && 'mentioned you in a post or comment.'}
                    </span>

                    {notif.type === 'follow_request' && notif.profiles && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            acceptRequestMutation.mutate(notif)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-md transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            rejectRequestMutation.mutate(notif)
                          }}
                          className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold px-3 py-1 rounded-md transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {new Date(notif.created_at).toLocaleDateString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => clearSingleNotification(e, notif.id)}
                    className="absolute top-3 right-3 text-zinc-600 hover:text-rose-500 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Remove notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
