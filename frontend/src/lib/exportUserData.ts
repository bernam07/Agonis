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

export async function exportUserData(userId: string) {
  const [profile, userGames, comments, likes, blocked] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_games').select('igdb_id, status, rating').eq('user_id', userId),
    supabase.from('comments').select('*').eq('user_id', userId),
    supabase.from('likes').select('*').eq('user_id', userId),
    supabase.from('blocked_users').select('*').eq('blocker_id', userId),
  ])

  const gameIds = [...new Set((userGames.data ?? []).map((g: any) => g.igdb_id).filter(Boolean))]
  const { data: igdbGames } = gameIds.length > 0
    ? await supabase.functions.invoke('fetch-games', { body: { gameIds } })
    : { data: [] as any[] }

  const games = (userGames.data ?? []).map((g: any) => ({
    name: igdbGames?.find((game: any) => Number(game.id) === Number(g.igdb_id))?.name ?? null,
    igdb_id: g.igdb_id,
    status: g.status,
    rating: g.rating,
  }))

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    games,
    comments: comments.data,
    likes: likes.data,
    blocked_users: blocked.data,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `agonis-data-export-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
