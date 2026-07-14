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

import { Trash2 } from 'lucide-react'

interface ProfileCustomListsProps {
  lists: any[];
  isCurrentUser: boolean;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  listName: string;
  setListName: (name: string) => void;
  listDesc: string;
  setListDesc: (desc: string) => void;
  handleCreateList: (e: React.FormEvent) => void;
  handleDeleteList: (id: string) => void;
  toggleListExpansion: (id: string) => void;
  expandedListId: string | null;
  listGames: any[];
  userLibrary: any[];
  handleGameClick: (game: any) => void;
  setSelectedGame: (game: any) => void;
  handleRemoveGameFromList: (gameId: string, listId: string) => void;
}

export default function ProfileCustomLists({
  lists, isCurrentUser, showCreateForm, setShowCreateForm,
  listName, setListName, listDesc, setListDesc,
  handleCreateList, handleDeleteList, toggleListExpansion,
  expandedListId, listGames, userLibrary,
  handleGameClick, setSelectedGame, handleRemoveGameFromList
}: ProfileCustomListsProps) {

  return (
    <div className="space-y-4">
      {isCurrentUser && (
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              + Create Custom List
            </button>
          ) : (
            <form onSubmit={handleCreateList} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 max-w-md">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">List Name</label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., My Top 10 RPGs"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition-colors font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  placeholder="Optional details about this collection..."
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition-colors font-medium resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 rounded-xl text-zinc-500 dark:text-zinc-400 text-xs font-bold hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!listName.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors">
                  Create List
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 font-medium text-sm">
          No custom lists found.
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div onClick={() => toggleListExpansion(list.id)} className="p-5 flex justify-between items-center cursor-pointer select-none">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{list.name}</h3>
                  {list.description && <p className="text-xs text-zinc-500 font-medium mt-1">{list.description}</p>}
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {isCurrentUser && (
                    <button onClick={() => handleDeleteList(list.id)} className="text-zinc-500 hover:text-rose-500 transition-colors p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <span className="text-zinc-500 text-xs font-bold">
                    {expandedListId === list.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedListId === list.id && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-5">
                  {listGames.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-600 font-medium py-2">
                      This list is empty. You can add games from your library details.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {listGames.map((g) => (
                        <div key={g.id} className="relative group/game bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2 flex flex-col items-center">
                          <div
                            className="aspect-3/4 w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/40 cursor-pointer"
                            onClick={() => {
                              const trackedGame = userLibrary.find((libGame) => libGame.igdb_id === g.igdb_id)
                              if (trackedGame) {
                                handleGameClick(trackedGame)
                              } else {
                                setSelectedGame({
                                  game: { id: g.igdb_id, name: g.game_name, cover: { url: g.game_cover } },
                                  userGame: null,
                                })
                              }
                            }}
                          >
                            {g.game_cover && (
                              <img src={g.game_cover.replace('t_thumb', 't_cover_big')} alt={g.game_name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mt-2 text-center line-clamp-1 px-1 w-full">
                            {g.game_name}
                          </span>
                          {isCurrentUser && (
                            <button
                              onClick={() => handleRemoveGameFromList(g.id, list.id)}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black opacity-0 group-hover/game:opacity-100 transition-opacity shadow-md"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}