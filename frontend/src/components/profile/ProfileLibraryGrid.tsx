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

import StarDisplay from '../common/StarDisplay'

interface ProfileLibraryGridProps {
  userLibrary: any[];
  filteredAndSortedLibrary: any[];
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  sortOrder: 'recent' | 'rating' | 'name';
  setSortOrder: (val: 'recent' | 'rating' | 'name') => void;
  handleGameClick: (game: any) => void;
}

export default function ProfileLibraryGrid({
  userLibrary, filteredAndSortedLibrary, filterStatus, setFilterStatus,
  sortOrder, setSortOrder, handleGameClick
}: ProfileLibraryGridProps) {

  return (
    <div className="space-y-6">
      {userLibrary.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 justify-between items-center">
          <div className="flex gap-3 w-full sm:w-auto">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition-colors flex-1 sm:flex-none">
              <option value="all">All Statuses</option>
              <option value="playing">Playing</option>
              <option value="backlog">Backlog</option>
              <option value="completed">Completed</option>
              <option value="100_percent">100%</option>
              <option value="dropped">Dropped</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition-colors flex-1 sm:flex-none">
              <option value="recent">Recently Added</option>
              <option value="rating">Highest Rating</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
          <div className="text-xs font-bold text-zinc-500">Showing {filteredAndSortedLibrary.length} games</div>
        </div>
      )}
      {filteredAndSortedLibrary.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 font-medium">No games found matching your filters.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filteredAndSortedLibrary.map((game) => (
            <div key={game.id} onClick={() => handleGameClick(game)} className="cursor-pointer bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex flex-col relative group transition-transform hover:scale-105">
              <span className="absolute top-3 right-3 z-10 text-[9px] font-black bg-zinc-950/90 text-zinc-300 border border-zinc-800 px-1.5 py-0.5 rounded capitalize">
                {game.status.replace('_', ' ')}
              </span>
              <div className="aspect-3/4 rounded-lg overflow-hidden bg-zinc-950 mb-2">
                {game.cover?.url ? <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex justify-center mt-auto">
                {game.rating > 0 && <StarDisplay rating={game.rating} size={10} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
