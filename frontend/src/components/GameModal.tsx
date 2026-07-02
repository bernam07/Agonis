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
import ShareModal from './ShareModal'

const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'playing', label: 'Playing' },
  { id: 'completed', label: 'Completed' },
  { id: 'dropped', label: 'Dropped' },
  { id: '100_percent', label: '100%' }
]

export default function GameModal({ game, userGame, onClose, onRefresh }: any) {
  const [status, setStatus] = useState(userGame?.status || 'backlog')
  const [rating, setRating] = useState(userGame?.rating || 0)
  const [review, setReview] = useState(userGame?.review || '')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'track' | 'details'>('track')
  const [showShare, setShowShare] = useState(false)

  const saveGame = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const completedDate = status === 'completed' || status === '100_percent' 
        ? (userGame?.completed_at || new Date().toISOString()) 
        : null

      await supabase.from('user_games').upsert({
        user_id: user.id,
        igdb_id: game.id || game.igdb_id,
        status: status,
        rating: rating > 0 ? rating : null,
        review: review.trim() === '' ? null : review,
        completed_at: completedDate
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 my-8 shadow-2xl">
        
        <div className="flex gap-5 mb-6">
          <div className="w-28 aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shrink-0">
            {game.cover?.url && (
              <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-black text-white mb-2 leading-tight">{game.name}</h2>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-105 ${rating >= star ? 'text-amber-400' : 'text-zinc-700'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex border-b border-zinc-800 mb-6 gap-4">
          <button 
            onClick={() => setActiveTab('track')}
            className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'track' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500'}`}
          >
            Track Status
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500'}`}
          >
            Game Details
          </button>
        </div>

        {activeTab === 'track' ? (
          <div>
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Status</label>
              <div className="grid grid-cols-5 bg-zinc-950 p-1 border border-zinc-800 rounded-xl gap-1">
                {STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    className={`py-2 text-center rounded-lg font-bold text-xs transition-colors ${
                      status === s.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Notes & Review</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your logs or thoughts here..."
                rows={4}
                className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 outline-none resize-none text-sm font-medium focus:border-zinc-700 transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {game.summary && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Summary</h4>
                <p className="text-zinc-300 text-sm leading-relaxed font-medium">{game.summary}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Get this game</h4>
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={`https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`} 
                  target="_blank" rel="noreferrer"
                  className="bg-[#171a21] hover:bg-[#2a475e] text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#2a475e]"
                >
                  Steam
                </a>
                <a 
                  href={`https://store.playstation.com/search/${encodeURIComponent(game.name)}`} 
                  target="_blank" rel="noreferrer"
                  className="bg-[#00439c] hover:bg-[#0070d1] text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#0070d1]"
                >
                  PlayStation
                </a>
                <a 
                  href={`https://www.instant-gaming.com/en/search/?q=${encodeURIComponent(game.name)}`} 
                  target="_blank" rel="noreferrer"
                  className="bg-[#ff6000] hover:bg-[#ff7b2b] text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#ff7b2b] col-span-2"
                >
                  Find deals on Instant Gaming
                </a>
              </div>
            </div>

            {game.platforms && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Platforms</h4>
                <div className="flex flex-wrap gap-1.5">
                  {game.platforms.map((p: any) => (
                    <span key={p.id} className="text-xs bg-zinc-950 border border-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-md font-medium">{p.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {userGame && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button 
              onClick={() => setShowShare(true)}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-indigo-500 text-zinc-300 hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              Export Review Card
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-colors">
            Close
          </button>
          <div className="flex gap-2">
            {userGame && (
              <button onClick={deleteGame} className="px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-bold transition-colors">
                Remove
              </button>
            )}
            <button onClick={saveGame} disabled={loading} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
              {loading ? '...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>

      {showShare && (
        <ShareModal game={game} userGame={userGame} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}