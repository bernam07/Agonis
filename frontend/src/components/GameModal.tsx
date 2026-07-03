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
  
  const [activeTab, setActiveTab] = useState<'track' | 'details' | 'screenshots'>('track')
  const [showShare, setShowShare] = useState(false)

  const [screenshots, setScreenshots] = useState<any[]>([])
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)

  // Novos Estados (Fase 2)
  const [hltbData, setHltbData] = useState<any>(null)
  const [hltbLoading, setHltbLoading] = useState(false)
  const [trailerId, setTrailerId] = useState<string | null>(null)

  useEffect(() => {
    loadScreenshots()
    
    // Identificar o Trailer (procura o primeiro video_id do YouTube vindo do IGDB)
    if (game.videos && game.videos.length > 0) {
      const video = game.videos.find((v: any) => v.video_id)
      if (video) setTrailerId(video.video_id)
    }

    // Buscar dados do HowLongToBeat
    fetchHLTBData()
  }, [])

  const fetchHLTBData = async () => {
    setHltbLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('fetch-hltb', {
        body: { gameName: game.name || game.game_name }
      })
      if (data && !error) {
        setHltbData(data)
      }
    } catch (err) {
      console.error("Erro a carregar HLTB:", err)
    } finally {
      setHltbLoading(false)
    }
  }

  const loadScreenshots = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('game_screenshots')
      .select('*')
      .eq('igdb_id', game.id || game.igdb_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setScreenshots(data)
  }

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return
      setUploadingScreenshot(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('screenshots').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('screenshots').getPublicUrl(filePath)
      
      await supabase.from('game_screenshots').insert([{
        user_id: user.id,
        igdb_id: game.id || game.igdb_id,
        url: publicData.publicUrl
      }])

      loadScreenshots()
    } catch (error: any) {
      alert('Error uploading screenshot: ' + error.message)
    } finally {
      setUploadingScreenshot(false)
    }
  }

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
      
      if (onRefresh) onRefresh()
    }
    setLoading(false)
    onClose()
  }

  const deleteGame = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_games').delete().match({ user_id: user.id, igdb_id: game.id || game.igdb_id })
      if (onRefresh) onRefresh()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 my-8 shadow-2xl relative">
        
        <div className="flex gap-5 mb-6">
          <div className="w-28 aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-lg">
            {game.cover?.url && (
              <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">{game.name || game.game_name}</h2>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-zinc-700'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex border-b border-zinc-800 mb-6 gap-6">
          <button onClick={() => setActiveTab('track')} className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'track' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Track Status
          </button>
          <button onClick={() => setActiveTab('details')} className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Game Details
          </button>
          <button onClick={() => setActiveTab('screenshots')} className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'screenshots' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Screenshots
          </button>
        </div>

        <div className="min-h-[250px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {activeTab === 'track' && (
            <div>
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 bg-zinc-950 p-1 border border-zinc-800 rounded-xl gap-1">
                  {STATUSES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={`py-2 text-center rounded-lg font-bold text-xs transition-colors ${
                        status === s.id ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
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
                  rows={5}
                  className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 outline-none resize-none text-sm font-medium focus:border-indigo-500 transition-colors shadow-inner"
                />
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-8 pb-4">
              
              {/* HOWLONGTOBEAT SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Playtime</h4>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>
                {hltbLoading ? (
                  <div className="text-zinc-500 text-xs font-bold text-center py-4 animate-pulse">Calculating time to beat...</div>
                ) : hltbData ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Main Story</span>
                      <span className="text-xl font-black text-indigo-400">{hltbData.gameplayMain}h</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Main + Sides</span>
                      <span className="text-xl font-black text-indigo-400">{hltbData.gameplayMainExtra}h</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Completionist</span>
                      <span className="text-xl font-black text-rose-400">{hltbData.gameplayCompletionist}h</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-500 font-medium">
                    Playtime data not available for this title.
                  </div>
                )}
              </div>

              {/* TRAILER SECTION */}
              {trailerId && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Trailer</h4>
                    <div className="h-px flex-1 bg-zinc-800"></div>
                  </div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg">
                    <iframe 
                      src={`https://www.youtube.com/embed/${trailerId}?modestbranding=1&rel=0`}
                      title="Game Trailer"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* SUMMARY SECTION */}
              {game.summary && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">About</h4>
                    <div className="h-px flex-1 bg-zinc-800"></div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed font-medium bg-zinc-950 p-4 rounded-xl border border-zinc-800">{game.summary}</p>
                </div>
              )}
              
              {/* PLATFORMS & STORE LINKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.platforms?.map((p: any) => (
                      <span key={p.id} className="text-[11px] bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">{p.name}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">Get this game</h4>
                  <div className="flex gap-2">
                    <a href={`https://store.steampowered.com/search/?term=${encodeURIComponent(game.name || game.game_name)}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#171a21] hover:bg-[#2a475e] text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors">Steam</a>
                    <a href={`https://store.playstation.com/search/${encodeURIComponent(game.name || game.game_name)}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#00439c] hover:bg-[#0070d1] text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors">PlayStation</a>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'screenshots' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Your Gallery</h4>
                <label className="text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm">
                  {uploadingScreenshot ? 'Uploading...' : '+ Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} disabled={uploadingScreenshot} />
                </label>
              </div>

              {screenshots.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 font-medium text-sm border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                  No screenshots yet. <br/>Upload one or attach an image to a feed post!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {screenshots.map(shot => (
                    <div key={shot.id} className="rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-zinc-950 shadow-md">
                      <img src={shot.url} alt="Game screenshot" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {userGame && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button 
              onClick={() => setShowShare(true)}
              className="w-full bg-indigo-950/30 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              📷 Export Review Card
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-colors">
            Close
          </button>
          <div className="flex gap-3">
            {userGame && (
              <button onClick={deleteGame} className="px-5 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-bold transition-colors">
                Remove from Library
              </button>
            )}
            <button onClick={saveGame} disabled={loading} className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">
              {loading ? 'Saving...' : 'Save Changes'}
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