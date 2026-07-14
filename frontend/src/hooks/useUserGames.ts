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

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function userGamesQueryKey(userId?: string | null) {
  return ['user-games', userId] as const
}

async function fetchUserGames(userId: string) {
  const { data, error } = await supabase.from('user_games').select('*').eq('user_id', userId)
  if (error) throw error
  if (!data || data.length === 0) return []

  const gameIds = [...new Set(data.map((item: any) => item.igdb_id).filter(Boolean))]
  const { data: igdbGames, error: igdbError } = await supabase.functions.invoke('fetch-games', {
    body: { gameIds },
  })

  if (igdbError) {
    console.error('Erro a carregar metadados da IGDB:', igdbError)
    return data
  }

  return data
    .map((item: any) => ({
      ...item,
      ...(igdbGames?.find((g: any) => Number(g.id) === Number(item.igdb_id)) ?? {}),
    }))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function useUserGames(userId: string | null | undefined) {
  return useQuery({
    queryKey: userGamesQueryKey(userId),
    queryFn: () => fetchUserGames(userId as string),
    enabled: !!userId,
  })
}

export function useInvalidateUserGames() {
  const queryClient = useQueryClient()
  return (userId?: string | null) => queryClient.invalidateQueries({ queryKey: ['user-games', ...(userId ? [userId] : [])] })
}
