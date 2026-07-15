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

import { useState, useEffect } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import GameModal from './GameModal'
import { GameSkeleton } from '../common/Skeletons'
import { useInfiniteScrollTrigger } from '../../hooks/useInfiniteScrollTrigger'
import { dedupeGamesByTitle } from '../../lib/gameTitle'
import PremiumUsername from '../common/PremiumUsername'

const GAMES_PER_PAGE = 20
const TRENDING_QUERY = 'The Last of Us'

export default function GameSearch({
  onUserClick,
  library,
}: {
  onUserClick?: (id: string) => void
  library: any[]
}) {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [searchMode, setSearchMode] = useState<'games' | 'users'>('games')

  const {
    data: gamesData,
    isLoading: loadingGames,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['game-search', activeQuery ?? TRENDING_QUERY],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.functions.invoke('search-igdb', {
        body: { searchQuery: activeQuery ?? TRENDING_QUERY, offset: pageParam, limit: GAMES_PER_PAGE },
      })
      if (error) throw error
      return Array.isArray(data) ? data : []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === GAMES_PER_PAGE ? allPages.length * GAMES_PER_PAGE : undefined,
    enabled: searchMode === 'games',
  })

  const gamesSentinelRef = useInfiniteScrollTrigger(
    () => fetchNextPage(),
    searchMode === 'games' && !!hasNextPage && !isFetchingNextPage,
  )

  const results = dedupeGamesByTitle(
    (gamesData?.pages.flat() ?? []).filter(
      (game: any, index: number, self: any[]) => index === self.findIndex((t) => t.id === game.id),
    ),
  )

  const [debouncedUserQuery, setDebouncedUserQuery] = useState('')
  useEffect(() => {
    if (searchMode !== 'users') return
    const delayDebounceFn = setTimeout(() => setDebouncedUserQuery(query), 300)
    return () => clearTimeout(delayDebounceFn)
  }, [query, searchMode])

  const { data: userResults = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['user-search', debouncedUserQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, is_premium, accent_color')
        .ilike('username', `%${debouncedUserQuery}%`)
        .limit(20)
      if (error) throw error
      return data ?? []
    },
    enabled: searchMode === 'users' && !!debouncedUserQuery.trim(),
  })

  const loading = searchMode === 'games' ? loadingGames : loadingUsers

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (searchMode === 'users') {
      setDebouncedUserQuery(query)
      return
    }
    setActiveQuery(query.trim() || null)
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => {
            setSearchMode('games')
            setQuery('')
          }}
          className={`pb-2 text-sm font-bold transition-colors ${
            searchMode === 'games'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Search Games
        </button>
        <button
          onClick={() => {
            setSearchMode('users')
            setQuery('')
            setDebouncedUserQuery('')
          }}
          className={`pb-2 text-sm font-bold transition-colors ${
            searchMode === 'users'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Find Users
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            searchMode === 'games'
              ? 'Search games, franchises, genres...'
              : 'Type a username to find friends...'
          }
          className="flex-1 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
        />
        <button
          type="submit"
          className="px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 font-bold text-sm text-zinc-800 dark:text-zinc-200 transition-colors"
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      <div className="mb-4 px-1">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {searchMode === 'games'
            ? activeQuery
              ? 'Search Results'
              : 'Trending & Recommendations'
            : debouncedUserQuery
              ? 'Matching Users'
              : 'Discover Community'}
        </h2>
      </div>

      {searchMode === 'games' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {loadingGames && Array.from({ length: 10 }).map((_, i) => <GameSkeleton key={i} />)}

            {!loadingGames &&
              results.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 cursor-pointer group hover:border-indigo-500 transition-all flex flex-col"
                >
                  <div className="aspect-3/4 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 mb-3 border border-zinc-200/50 dark:border-zinc-800/50">
                    {game.cover?.url ? (
                      <img
                        src={game.cover.url.replace('t_thumb', 't_cover_big')}
                        alt={game.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-xs font-semibold">
                        No Artwork
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 text-center px-1 mt-auto group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {game.name}
                  </h3>
                </div>
              ))}
          </div>

          {!loadingGames && results.length > 0 && (
            <div ref={gamesSentinelRef} className="flex justify-center mt-6 mb-2 h-8">
              {isFetchingNextPage && (
                <span className="text-zinc-500 text-sm font-bold animate-pulse">Loading more...</span>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userResults.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserClick && onUserClick(user.id)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-indigo-500 transition-colors flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 overflow-hidden shrink-0 group-hover:border-indigo-500 transition-colors">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  <PremiumUsername username={user.username} isPremium={user.is_premium} accentColor={user.accent_color} />
                </h3>
                {user.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{user.bio}</p>}
              </div>
            </div>
          ))}

          {userResults.length === 0 && debouncedUserQuery && !loadingUsers && (
            <div className="col-span-full text-center py-10 text-zinc-500 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
              No users found matching "{debouncedUserQuery}"
            </div>
          )}
          {!debouncedUserQuery && (
            <div className="col-span-full text-center py-10 text-zinc-500 text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
              Type a username to start searching...
            </div>
          )}
        </div>
      )}

      {selectedGame && (
        <GameModal
          game={selectedGame}
          userGame={library.find((g) => (g.igdb_id || g.id) === selectedGame.id)}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  )
}
