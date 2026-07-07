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
import { supabase } from '../../lib/supabase'

export default function Notifications({ onUserClick }: { onUserClick: (id: string) => void }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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

  const handleAcceptRequest = async (notif: any) => {
    if (!notif.profiles) return

    await supabase
      .from('follows')
      .insert([{ follower_id: notif.profiles.id, following_id: notif.receiver_id }])
    await supabase
      .from('follow_requests')
      .delete()
      .match({ sender_id: notif.profiles.id, receiver_id: notif.receiver_id })
    await supabase
      .from('notifications')
      .update({ type: 'follow', is_read: true })
      .eq('id', notif.id)
    await supabase
      .from('notifications')
      .insert([
        { receiver_id: notif.profiles.id, actor_id: notif.receiver_id, type: 'follow_accepted' },
      ])
    fetchNotifications()
  }

  const handleRejectRequest = async (notif: any) => {
    if (!notif.profiles) return

    await supabase
      .from('follow_requests')
      .delete()
      .match({ sender_id: notif.profiles.id, receiver_id: notif.receiver_id })
    await supabase.from('notifications').delete().eq('id', notif.id)
    fetchNotifications()
  }

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select(
        `
        id, type, is_read, created_at,
        profiles!notifications_actor_id_fkey (id, username, avatar_url)
      `
      )
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  const markAsRead = async () => {
    if (unreadCount === 0) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)
      setUnreadCount(0)
    }
  }

  const toggleDropdown = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) markAsRead()
  }

  const clearAllNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setNotifications([])
    setUnreadCount(0)

    await supabase.from('notifications').delete().eq('receiver_id', user.id)
  }

  const clearSingleNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== notifId))

    await supabase.from('notifications').delete().eq('id', notifId)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[10px] font-bold text-zinc-500 hover:text-rose-500 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors"
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
                  className={`group relative p-4 border-b border-zinc-800/50 flex items-start gap-3 cursor-pointer hover:bg-zinc-800 transition-colors ${!notif.is_read ? 'bg-indigo-950/10' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 mt-0.5">
                    {notif.profiles?.avatar_url ? (
                      <img src={notif.profiles.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 text-sm">
                        {notif.profiles?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="text-sm flex-1 pr-4">
                    <span className="font-bold text-zinc-200">
                      @{notif.profiles?.username || 'unknown'}{' '}
                    </span>
                    <span className="text-zinc-400">
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
                            handleAcceptRequest(notif)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-md transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRejectRequest(notif)
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-1 rounded-md transition-colors"
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
