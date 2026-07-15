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

interface ProfileMasterpiecesProps {
  favorites: any[];
  handleGameClick: (game: any) => void;
}

export default function ProfileMasterpieces({ favorites, handleGameClick }: ProfileMasterpiecesProps) {
  if (favorites.length === 0) return null

  return (
    <div className="animate-fade-in">
      <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4 border-l-2 border-amber-400 pl-3">
        Masterpieces
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {favorites.map((game) => (
          <div
            key={game.id}
            onClick={() => handleGameClick(game)}
            className="relative aspect-3/4 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 cursor-pointer group hover:border-amber-400 transition-colors"
          >
            {game.cover?.url && (
              <img
                src={game.cover.url.replace('t_thumb', 't_cover_big')}
                alt={game.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent flex items-end p-2">
              <span className="text-white text-[10px] font-bold line-clamp-2">{game.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
