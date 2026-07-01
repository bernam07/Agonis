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

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import GameModal from './GameModal'

export default function MyLibrary() {
  const [library, setLibrary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<any>(null)

  const fetchMyGames = async () => {
    const { data: userGames } = await supabase.from('user_games').select('*')
    if (!userGames || userGames.length === 0) {
      setLibrary([])
      setLoading(false)
      return
    }

    const gameIds = userGames.map(g => g.igdb_id)
    const { data: igdbGames } = await supabase.functions.invoke('fetch-games', { body: { gameIds } })

    if (igdbGames) {
      const combined = userGames.map(dbGame => ({ ...dbGame, ...igdbGames.find((g: any) => g.id === dbGame.igdb_id) }))
      setLibrary(combined)
    }
    setLoading(false)
  }

  useEffect(() => { fetchMyGames() }, [])

  const cardClass = "bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#111827,-8px_-8px_16px_#374151] rounded-3xl p-4 cursor-pointer transform transition-transform hover:-translate-y-1 relative"

  if (loading) return <p>Loading library...</p>
  if (library.length === 0) return <p>Your library is empty. Go add some games!</p>

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {library.map((game) => (
          <div key={game.id} onClick={() => setSelectedGame(game)} className={cardClass}>
            
            {/* Status Badge */}
            <span className="absolute top-6 right-6 z-10 text-xs font-bold bg-gray-900/80 text-white px-3 py-1 rounded-full capitalize backdrop-blur-md">
              {game.status.replace('_', ' ')}
            </span>

            {game.cover?.url && (
              <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full aspect-[3/4] object-cover rounded-2xl mb-4 shadow-inner" />
            )}
            
            <h3 className="font-bold text-center mb-1 line-clamp-1">{game.name}</h3>
            
            {/* Stars on Card */}
            <div className="flex justify-center text-yellow-500 text-sm">
              {'★'.repeat(game.rating || 0)}{'☆'.repeat(5 - (game.rating || 0))}
            </div>
          </div>
        ))}
      </div>

      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          userGame={selectedGame}
          onClose={() => setSelectedGame(null)} 
          onRefresh={fetchMyGames}
        />
      )}
    </div>
  )
}