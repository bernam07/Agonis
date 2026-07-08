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
import { supabase } from '../../lib/supabase'
import GameModal from './GameModal'
import { GameSkeleton } from '../common/Skeletons'

export default function GameSearch({ 
  onUserClick, 
  library, 
  onRefreshLibrary 
}: { 
  onUserClick?: (id: string) => void
  library: any[]
  onRefreshLibrary: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [userResults, setUserResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<any>(null)

  const [searchMode, setSearchMode] = useState<'games' | 'users'>('games')

  const loadRecommendations = async () => {
    setLoading(true)
    const { data, error } = await supabase.functions.invoke('search-igdb', {
      body: { searchQuery: 'The Last of Us' },
    })
    if (!error && data) setResults(data)
    setLoading(false)
  }

  useEffect(() => {
    loadRecommendations()
  }, [])

  useEffect(() => {
    if (searchMode === 'users') {
      const delayDebounceFn = setTimeout(() => {
        searchUsers()
      }, 300)
      return () => clearTimeout(delayDebounceFn)
    }
  }, [query, searchMode])

  const searchUsers = async () => {
    if (!query.trim()) {
      setUserResults([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${query}%`)
      .limit(20)

    if (!error && data) setUserResults(data)
    else setUserResults([])
    setLoading(false)
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (searchMode === 'users') {
      searchUsers()
      return
    }

    if (!query.trim()) return loadRecommendations()
    setLoading(true)

    const { data, error } = await supabase.functions.invoke('search-igdb', {
      body: { searchQuery: query },
    })

    if (error) {
      console.error(error)
      setResults([])
      setLoading(false)
      return
    }

    if (Array.isArray(data)) {
      const uniqueGames = data.filter((game: any, index: number, self: any[]) =>
        index === self.findIndex((t) => t.id === game.id)
      );
      setResults(uniqueGames)
    } else {
      console.error('Erro da API:', data)
      setResults([])
    }
    setLoading(false)
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button
          onClick={() => {
            setSearchMode('games')
            setQuery('')
            if (results.length === 0) loadRecommendations()
          }}
          className={`pb-2 text-sm font-bold transition-colors ${
            searchMode === 'games'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Search Games
        </button>
        <button
          onClick={() => {
            setSearchMode('users')
            setQuery('')
            setUserResults([])
          }}
          className={`pb-2 text-sm font-bold transition-colors ${
            searchMode === 'users'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-zinc-500 hover:text-zinc-300'
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
          className="flex-1 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
        />
        <button
          type="submit"
          className="px-6 py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500 font-bold text-sm text-zinc-200 transition-colors"
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      <div className="mb-4 px-1">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {searchMode === 'games'
            ? query
              ? 'Search Results'
              : 'Trending & Recommendations'
            : query
              ? 'Matching Users'
              : 'Discover Community'}
        </h2>
      </div>

      {searchMode === 'games' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading && Array.from({ length: 10 }).map((_, i) => <GameSkeleton key={i} />)}
          
          {!loading && Array.isArray(results) &&
            results.map((game) => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 cursor-pointer group hover:border-indigo-500 transition-all flex flex-col"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 mb-3 border border-zinc-800/50">
                  {game.cover?.url ? (
                    <img
                      src={game.cover.url.replace('t_thumb', 't_cover_big')}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-semibold">
                      No Artwork
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm text-zinc-200 line-clamp-2 text-center px-1 mt-auto group-hover:text-indigo-300 transition-colors">
                  {game.name}
                </h3>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userResults.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserClick && onUserClick(user.id)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-indigo-500 transition-colors flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 group-hover:border-indigo-500 transition-colors">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                  @{user.username}
                </h3>
                {user.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{user.bio}</p>}
              </div>
            </div>
          ))}

          {userResults.length === 0 && query && !loading && (
            <div className="col-span-full text-center py-10 text-zinc-500 text-sm font-medium bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              No users found matching "{query}"
            </div>
          )}
          {userResults.length === 0 && !query && (
            <div className="col-span-full text-center py-10 text-zinc-500 text-sm font-medium bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
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
          onRefresh={onRefreshLibrary}
        />
      )}
    </div>
  )
}
