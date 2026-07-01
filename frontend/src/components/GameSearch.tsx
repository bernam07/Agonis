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

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import GameModal from './GameModal'

export default function GameSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<any>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.functions.invoke('search-igdb', { body: { searchQuery: query } })
    if (!error) setResults(data)
    setLoading(false)
  }

  const cardClass = "bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#111827,-8px_-8px_16px_#374151] rounded-3xl p-4 cursor-pointer transform transition-transform hover:-translate-y-1"

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-4 mb-10">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search IGDB..."
          className="flex-1 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 outline-none shadow-[inset_6px_6px_10px_#d1d5db,inset_-6px_-6px_10px_#ffffff] dark:shadow-[inset_6px_6px_10px_#111827,inset_-6px_-6px_10px_#374151]"
        />
        <button type="submit" className="px-8 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-blue-600 font-bold shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#111827,-6px_-6px_12px_#374151]">
          {loading ? '...' : 'Search'}
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {results.map((game) => (
          <div key={game.id} onClick={() => setSelectedGame(game)} className={cardClass}>
            {game.cover?.url && (
              <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full aspect-[3/4] object-cover rounded-2xl mb-4 shadow-inner" />
            )}
            <h3 className="font-bold text-center mb-2 line-clamp-2">{game.name}</h3>
          </div>
        ))}
      </div>

      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
          onRefresh={() => {}}
        />
      )}
    </div>
  )
}