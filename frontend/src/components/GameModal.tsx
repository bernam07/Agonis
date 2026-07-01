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

const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'playing', label: 'Playing' },
  { id: 'completed', label: 'Completed' },
  { id: 'dropped', label: 'Dropped' },
  { id: '100_percent', label: '100% Completed' }
]

export default function GameModal({ game, userGame, onClose, onRefresh }: any) {
  const [status, setStatus] = useState(userGame?.status || 'backlog')
  const [rating, setRating] = useState(userGame?.rating || 0)
  const [loading, setLoading] = useState(false)

  const saveGame = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('user_games').upsert({
        user_id: user.id,
        igdb_id: game.id || game.igdb_id,
        status: status,
        rating: rating > 0 ? rating : null,
      }, { onConflict: 'user_id,igdb_id' })
      
      onRefresh()
    }
    setLoading(false)
    onClose()
  }

  const deleteGame = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_games').delete().match({ user_id: user.id, igdb_id: game.id || game.igdb_id })
      onRefresh()
    }
    onClose()
  }

  const bgClass = "bg-gray-100 dark:bg-gray-800"
  const shadowClass = "shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] dark:shadow-[8px_8px_16px_#111827,-8px_-8px_16px_#374151]"
  const innerShadowClass = "shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#111827,inset_-4px_-4px_8px_#374151]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md p-6 rounded-3xl ${bgClass} ${shadowClass} text-gray-800 dark:text-gray-100`}>
        
        <div className="flex gap-4 mb-6">
          {game.cover?.url && (
            <img 
              src={game.cover.url.replace('t_thumb', 't_cover_big')} 
              alt={game.name} 
              className={`w-1/3 rounded-xl object-cover ${innerShadowClass}`}
            />
          )}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-xl font-bold mb-2">{game.name}</h2>
            
            {/* Sistema de 5 Estrelas */}
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-600'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dropdown de Status */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-gray-600 dark:text-gray-400">Current Status</label>
          <div className={`flex flex-col gap-2 p-2 rounded-2xl ${innerShadowClass}`}>
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`py-2 px-4 rounded-xl font-bold transition-all ${
                  status === s.id 
                    ? `bg-blue-500 text-white shadow-md` 
                    : `text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button onClick={onClose} className={`px-6 py-3 rounded-xl font-bold ${bgClass} ${shadowClass} hover:text-red-500`}>
            Cancel
          </button>
          
          <div className="flex gap-2">
            {userGame && (
              <button onClick={deleteGame} className={`px-4 py-3 rounded-xl font-bold text-red-500 ${bgClass} ${innerShadowClass}`}>
                Remove
              </button>
            )}
            <button onClick={saveGame} disabled={loading} className={`px-6 py-3 rounded-xl font-bold text-blue-500 ${bgClass} ${shadowClass} active:${innerShadowClass}`}>
              {loading ? 'Saving...' : 'Save Game'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}