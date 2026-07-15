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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

function blockedUsersQueryKey(userId?: string | null) {
  return ['blocked-users', userId] as const
}

export function useBlockedUsers(userId: string | null | undefined) {
  return useQuery({
    queryKey: blockedUsersQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId as string)
      if (error) throw error
      return (data ?? []).map((row: any) => row.blocked_id as string)
    },
    enabled: !!userId,
  })
}

export function useSetUserBlocked() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ blockerId, blockedId, blocked }: { blockerId: string; blockedId: string; blocked: boolean }) => {
      if (blocked) {
        const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_id: blockedId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('blocked_users').delete().match({ blocker_id: blockerId, blocked_id: blockedId })
        if (error) throw error
      }
    },
    onSuccess: (_data, { blockerId }) => {
      queryClient.invalidateQueries({ queryKey: blockedUsersQueryKey(blockerId) })
    },
  })
}
