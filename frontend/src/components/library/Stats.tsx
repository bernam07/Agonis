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

import { useMemo } from 'react'

export default function Stats({ library }: { library: any[] }) {
  const stats = useMemo(() => {
    const total = library.length
    const completed = library.filter(
      (g) => g.status === 'completed' || g.status === '100_percent'
    ).length
    const backlog = library.filter((g) => g.status === 'backlog').length

    const ratedGames = library.filter((g) => g.rating && g.rating > 0)
    const averageRating = ratedGames.length
      ? (ratedGames.reduce((acc, g) => acc + g.rating, 0) / ratedGames.length).toFixed(1)
      : '0.0'

    const favorites = library.filter((g) => g.rating === 5)

    return { total, completed, backlog, averageRating, favorites }
  }, [library])

  const cardClass =
    'bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#111827,-8px_-8px_16px_#374151] rounded-3xl p-6 flex flex-col items-center justify-center'

  if (library.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 font-bold text-xl">
        Add games to your library to see stats!
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className={cardClass}>
          <span className="text-gray-500 dark:text-gray-400 font-bold mb-2">Total Games</span>
          <span className="text-4xl font-extrabold text-blue-600">{stats.total}</span>
        </div>
        <div className={cardClass}>
          <span className="text-gray-500 dark:text-gray-400 font-bold mb-2">Completed</span>
          <span className="text-4xl font-extrabold text-green-500">{stats.completed}</span>
        </div>
        <div className={cardClass}>
          <span className="text-gray-500 dark:text-gray-400 font-bold mb-2">In Backlog</span>
          <span className="text-4xl font-extrabold text-orange-500">{stats.backlog}</span>
        </div>
        <div className={cardClass}>
          <span className="text-gray-500 dark:text-gray-400 font-bold mb-2">Avg. Rating</span>
          <span className="text-4xl font-extrabold text-yellow-500 flex items-center gap-2">
            {stats.averageRating} <span className="text-2xl">★</span>
          </span>
        </div>
      </div>

      {stats.favorites.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-extrabold mb-6 text-gray-700 dark:text-gray-200 px-2 border-l-4 border-yellow-500">
            Masterpieces (5 Stars)
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {stats.favorites.map((game) => (
              <div
                key={game.id}
                className="relative rounded-2xl overflow-hidden shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#111827,-6px_-6px_12px_#374151]"
              >
                {game.cover?.url ? (
                  <img
                    src={game.cover.url.replace('t_thumb', 't_cover_big')}
                    alt={game.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-gray-700"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                  <span className="text-white text-xs font-bold line-clamp-1">{game.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
