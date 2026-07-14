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
import GameModal from '../game/GameModal'
import StarDisplay from '../common/StarDisplay'
import { LibraryGridSkeleton } from '../common/Skeletons'
import type { CombinedGame} from '../../types'
import { useUserGames } from '../../hooks/useUserGames'

interface MyLibraryProps {
  userId: string | null;
}

export default function MyLibrary({ userId }: MyLibraryProps) {
  const { data: library = [], isLoading, refetch } = useUserGames(userId)
  const [selectedGame, setSelectedGame] = useState<CombinedGame | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filteredLibrary = library.filter((game) => filter === 'all' || game.status === filter)

  if (isLoading) return <LibraryGridSkeleton />

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-900 pb-4">
        {['all', 'backlog', 'playing', 'completed', 'dropped', '100_percent'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors capitalize ${
              filter === status
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredLibrary.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 font-medium">
          No games found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredLibrary.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 cursor-pointer group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col"
            >
              <span className="absolute top-5 right-5 z-10 text-[10px] font-black bg-white/90 dark:bg-zinc-950/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md capitalize backdrop-blur-sm">
                {game.status.replace('_', ' ')}
              </span>

              <div className="aspect-3/4 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 mb-3 border border-zinc-200/50 dark:border-zinc-800/50">
                {game.cover?.url && (
                  <img
                    src={game.cover.url.replace('t_thumb', 't_cover_big')}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-1 text-center px-1 mb-1">
                {game.name}
              </h3>

              <div className="flex justify-center mt-auto">
                <StarDisplay rating={game.rating} size={12} />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedGame && (
        <GameModal
          game={selectedGame}
          userGame={selectedGame}
          onClose={() => setSelectedGame(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
