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
import { supabase } from '../lib/supabase'
import GameModal from './GameModal'

export default function GameSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<any>(null)

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setResults(data)
    } else {
      console.error('Erro da API:', data)
      setResults([])
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games, franchises, genres..."
          className="flex-1 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors text-sm font-medium"
        />
        <button
          type="submit"
          className="px-6 py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-bold text-sm text-zinc-200 transition-colors"
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      <div className="mb-4 px-1">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {query ? 'Search Results' : 'Trending & Recommendations'}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.isArray(results) &&
          results.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 cursor-pointer group hover:border-zinc-700 transition-all flex flex-col"
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 mb-3 border border-zinc-800/50">
                {game.cover?.url ? (
                  <img
                    src={game.cover.url.replace('t_thumb', 't_cover_big')}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-semibold">
                    No Artwork
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm text-zinc-200 line-clamp-2 text-center px-1 mt-auto">
                {game.name}
              </h3>
            </div>
          ))}
      </div>

      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} onRefresh={() => {}} />
      )}
    </div>
  )
}
