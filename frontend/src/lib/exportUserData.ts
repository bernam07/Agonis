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

import { supabase } from './supabase'

// Covers the GDPR right of access (Art. 15): every table where this user's own
// personal data lives, not just a curated subset.
export async function exportUserData(userId: string) {
  const [
    profile, userGames, posts, comments, likes, lists, screenshots,
    following, followers, blocked, notifications, kofiPayments,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_games').select('*').eq('user_id', userId),
    supabase.from('posts').select('*').eq('user_id', userId),
    supabase.from('comments').select('*').eq('user_id', userId),
    supabase.from('likes').select('*').eq('user_id', userId),
    supabase.from('lists').select('*').eq('user_id', userId),
    supabase.from('game_screenshots').select('*').eq('user_id', userId),
    supabase.from('follows').select('*').eq('follower_id', userId),
    supabase.from('follows').select('*').eq('following_id', userId),
    supabase.from('blocked_users').select('*').eq('blocker_id', userId),
    supabase.from('notifications').select('*').eq('receiver_id', userId),
    supabase.from('kofi_payments').select('*').eq('matched_user_id', userId),
  ])

  const listIds = (lists.data ?? []).map((l: any) => l.id)
  const listGames = listIds.length > 0
    ? await supabase.from('list_games').select('*').in('list_id', listIds)
    : { data: [] as any[] }

  const gameIds = [...new Set((userGames.data ?? []).map((g: any) => g.igdb_id).filter(Boolean))]
  const { data: igdbGames } = gameIds.length > 0
    ? await supabase.functions.invoke('fetch-games', { body: { gameIds } })
    : { data: [] as any[] }

  const games = (userGames.data ?? []).map((g: any) => ({
    ...g,
    name: igdbGames?.find((game: any) => Number(game.id) === Number(g.igdb_id))?.name ?? null,
  }))

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    games,
    posts: posts.data,
    comments: comments.data,
    likes: likes.data,
    lists: lists.data,
    list_games: listGames.data,
    game_screenshots: screenshots.data,
    following: following.data,
    followers: followers.data,
    blocked_users: blocked.data,
    notifications: notifications.data,
    kofi_payments: kofiPayments.data,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `agonis-data-export-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
