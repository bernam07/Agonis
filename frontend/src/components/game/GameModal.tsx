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
import { supabase } from '../../lib/supabase'
import ShareModal from './ShareModal'
import { Star, Lock } from 'lucide-react'

const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'playing', label: 'Playing' },
  { id: 'completed', label: 'Completed' },
  { id: 'dropped', label: 'Dropped' },
  { id: '100_percent', label: '100%' },
]

export default function GameModal({ game, userGame, onClose, onRefresh, isReadOnly = false }: any) {
  const [status, setStatus] = useState(userGame?.status || 'backlog')
  const [rating, setRating] = useState(userGame?.rating || 0)
  const [review, setReview] = useState(userGame?.review || '')
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'track' | 'details' | 'screenshots' | 'community'>(
    'track'
  )
  const [showShare, setShowShare] = useState(false)

  const [screenshots, setScreenshots] = useState<any[]>([])
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)

  const [myLists, setMyLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState('')

  const [fullGameDetails, setFullGameDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [communityReviews, setCommunityReviews] = useState<any[]>([])
  const [communityAvg, setCommunityAvg] = useState<string>('0.0')
  const [communityLoading, setCommunityLoading] = useState(false)

  const igdbId = game?.igdb_id || game?.id

  useEffect(() => {
    if (igdbId) {
      loadScreenshots()
      loadMyLists()
      fetchGameDetails()
      loadCommunityData()
    }
  }, [igdbId])

  useEffect(() => {
    // Tranca o ecrã inteiro
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [])

  const fetchGameDetails = async () => {
    if (!igdbId) return

    if (game.summary && game.platforms) {
      setFullGameDetails(game)
      return
    }

    setDetailsLoading(true)
    try {
      const { data } = await supabase.functions.invoke('fetch-games', {
        body: { gameIds: [igdbId] },
      })
      if (data && data.length > 0) {
        setFullGameDetails({ ...game, ...data[0] })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const loadCommunityData = async () => {
    if (!igdbId) return
    setCommunityLoading(true)

    const { data, error } = await supabase
      .from('user_games')
      .select(
        `
    rating, 
    review, 
    profiles ( username, avatar_url )
  `
      )
      .eq('igdb_id', igdbId)
      .not('rating', 'is', null)

    if (error) {
      alert('ERRO DO SUPABASE: ' + error.message)
      console.error('Erro completo:', error)

      const fallback = await supabase
        .from('user_games')
        .select('rating, review')
        .eq('igdb_id', igdbId)
      if (fallback.data && fallback.data.length > 0) {
        alert('As notas existem! O erro está na Foreign Key dos profiles.')
      }
    }

    if (data) {
      const ratedGames = data.filter((d: any) => d.rating && d.rating > 0)
      const avg =
        ratedGames.length > 0
          ? (
              ratedGames.reduce((acc: any, d: any) => acc + d.rating, 0) / ratedGames.length
            ).toFixed(1)
          : '0.0'
      setCommunityAvg(avg)

      const withReviews = data.filter((d: any) => d.review && d.review.trim() !== '')
      setCommunityReviews(withReviews)
    }

    setCommunityLoading(false)
  }

  const loadMyLists = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      if (data) setMyLists(data)
    }
  }

  const handleAddToList = async () => {
    if (!userGame || !userGame.id) {
      alert("You need to 'Save Changes' and add this game to your library first before putting it in a list!")
      return
    }

    const { error } = await supabase.from('list_games').insert({
      list_id: selectedListId,
      game_id: userGame.id
    })

    if (error) {
      console.error(error)
      alert("Error adding to list.")
    } else {
      alert("Game added to the list!")
      setSelectedListId("")
    }
  }

  const loadScreenshots = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !igdbId) return

    const { data } = await supabase
      .from('game_screenshots')
      .select('*')
      .eq('igdb_id', igdbId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setScreenshots(data)
  }

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !igdbId) return
      setUploadingScreenshot(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('screenshots').getPublicUrl(filePath)

      await supabase.from('game_screenshots').insert([
        {
          user_id: user.id,
          igdb_id: igdbId,
          url: publicData.publicUrl,
        },
      ])

      loadScreenshots()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const saveGame = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && igdbId) {
      const completedDate =
        status === 'completed' || status === '100_percent'
          ? userGame?.completed_at || new Date().toISOString()
          : null

      await supabase.from('list_games').upsert({
        id: igdbId,
        game_name: game.name || game.game_name,
        game_cover: game.cover?.url || game.game_cover || null,
      })

      await supabase.from('user_games').upsert(
        {
          user_id: user.id,
          igdb_id: igdbId,
          status: status,
          rating: rating > 0 ? rating : null,
          review: review.trim() === '' ? null : review,
          completed_at: completedDate,
        },
        { onConflict: 'user_id,igdb_id' }
      )

      if (onRefresh) onRefresh()
    }
    setLoading(false)
    onClose()
  }

  const deleteGame = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && igdbId) {
      await supabase.from('user_games').delete().match({ user_id: user.id, igdb_id: igdbId })
      if (onRefresh) onRefresh()
    }
    onClose()
  }

  const displayGame = fullGameDetails || game

  return (
    <div className={`fixed inset-0 z-50 p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center ${showShare ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-zinc-100 m-auto shadow-2xl relative">
        <div className="flex gap-5 mb-6 shrink-0">
          <div className="w-28 aspect-3/4 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-lg">
            {displayGame.cover?.url && (
              <img
                src={displayGame.cover.url.replace('t_thumb', 't_cover_big')}
                alt={displayGame.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-2xl font-black text-white mb-2 leading-tight truncate">
              {displayGame.name || displayGame.game_name}
            </h2>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const fillWidth = rating >= star ? '100%' : rating >= star - 0.5 ? '50%' : '0%';

                return (
                  <div key={star} className={`relative w-6 h-6 ${!isReadOnly && 'hover:scale-110'} transition-transform`}>
                    
                    {/* Estrela Cinzenta (Fundo) */}
                    <Star className="absolute top-0 left-0 w-6 h-6 text-zinc-700" />
                    
                    {/* Estrela Amarela (Preenchimento cortado) */}
                    <div 
                      className="absolute top-0 left-0 h-full overflow-hidden text-amber-400 pointer-events-none"
                      style={{ width: fillWidth }}
                    >
                      <Star className="w-6 h-6 max-w-none" fill="currentColor" />
                    </div>

                    {/* Zonas de clique invisíveis (Esquerda = 0.5, Direita = Inteiro) */}
                    {!isReadOnly && (
                      <div className="absolute inset-0 flex">
                        <button 
                          type="button" 
                          onClick={() => setRating(star - 0.5)} 
                          className="w-1/2 h-full outline-none cursor-pointer"
                          title={`${star - 0.5} Stars`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setRating(star)} 
                          className="w-1/2 h-full outline-none cursor-pointer"
                          title={`${star} Stars`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex border-b border-zinc-800 mb-6 gap-6 overflow-x-auto custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('track')}
            className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'track' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Track Status
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Game Details
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'screenshots' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Screenshots
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'community' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Community ({communityReviews.length})
          </button>
        </div>

        <div className="mt-2">
          {activeTab === 'track' && !isReadOnly && (
            <div className="max-w-full">
              {' '}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 bg-zinc-950 p-1 border border-zinc-800 rounded-xl gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={`py-2.5 px-2 text-center rounded-lg font-bold text-[11px] sm:text-xs transition-colors truncate ${
                        status === s.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {myLists.length > 0 && (
                <div className="mb-6 bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
                  <div className="flex-1 w-full min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Add to Custom List
                    </label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none truncate"
                    >
                      <option value="">Select a list...</option>
                      {myLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToList}
                    disabled={!selectedListId}
                    className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Notes & Review
                </label>
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

          {activeTab === 'track' && isReadOnly && (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <p className="text-zinc-400 text-sm font-bold">Viewing another user's log.</p>
              <p className="text-zinc-600 text-xs mt-1">Editing is disabled.</p>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-8 pb-4">
              {detailsLoading ? (
                <div className="text-zinc-500 text-xs font-bold text-center py-8 animate-pulse">
                  Loading details...
                </div>
              ) : (
                <>
                  {displayGame.summary && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                          About
                        </h4>
                        <div className="h-px flex-1 bg-zinc-800"></div>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed font-medium bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        {displayGame.summary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayGame.platforms && displayGame.platforms.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                          Platforms
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {displayGame.platforms.map((p: any) => (
                            <span
                              key={p.id}
                              className="text-[11px] bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg font-bold shadow-sm"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                        Get this game
                      </h4>
                      <div className="flex gap-2">
                        <a
                          href={`https://store.steampowered.com/search/?term=${encodeURIComponent(displayGame.name || displayGame.game_name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-[#171a21] hover:bg-[#2a475e] text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          Steam
                        </a>
                        <a
                          href={`https://store.playstation.com/search/${encodeURIComponent(displayGame.name || displayGame.game_name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-[#00439c] hover:bg-[#0070d1] text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          PlayStation
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'screenshots' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Your Gallery
                </h4>
                <label className="text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm">
                  {uploadingScreenshot ? 'Uploading...' : '+ Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScreenshotUpload}
                    disabled={uploadingScreenshot}
                  />
                </label>
              </div>

              {screenshots.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 font-medium text-sm border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                  No screenshots yet. <br />
                  Upload one or attach an image to a feed post!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {screenshots.map((shot) => (
                    <div
                      key={shot.id}
                      className="rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-zinc-950 shadow-md"
                    >
                      <img
                        src={shot.url}
                        alt="Game screenshot"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'community' && (
            <div className="space-y-6">
              {communityLoading ? (
                <div className="text-zinc-500 text-xs font-bold text-center py-8 animate-pulse">
                  Loading community insights...
                </div>
              ) : (
                <>
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">
                      Global Agonis Rating
                    </span>
                    <div className="text-5xl font-black text-amber-400 drop-shadow-md flex items-baseline gap-1">
                      {communityAvg} <span className="text-2xl text-zinc-600">/ 5</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        Community Reviews
                      </h4>
                      <div className="h-px flex-1 bg-zinc-800"></div>
                    </div>

                    {communityReviews.length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 font-medium text-sm border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30">
                        No written reviews yet. Be the first to share your thoughts!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {communityReviews.map((rev, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                  {rev.profiles?.avatar_url ? (
                                    <img
                                      src={rev.profiles.avatar_url}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                      {rev.profiles?.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-zinc-200">
                                  @{rev.profiles?.username || 'unknown'}
                                </span>
                              </div>
                              {rev.rating > 0 && (
                                <div className="flex items-center gap-0.5 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="w-3 h-3"
                                      fill={rev.rating >= star ? 'currentColor' : 'none'}
                                      strokeWidth={rev.rating >= star ? 0 : 2}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                              {rev.review}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {userGame && (
          <div className="mt-6 pt-4 border-t border-zinc-800 shrink-0">
            <button
              onClick={() => setShowShare(true)}
              className="w-full bg-indigo-950/30 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              Export Review Card
            </button>
          </div>
        )}

        {/* RODAPÉ SEMPRE VISÍVEL */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-colors"
          >
            Close
          </button>
          {!isReadOnly && (
            <div className="flex gap-3">
              {userGame && (
                <button
                  onClick={deleteGame}
                  className="px-5 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-bold transition-colors"
                >
                  Remove
                </button>
              )}
              <button
                onClick={saveGame}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showShare && (
        <ShareModal game={displayGame} userGame={userGame} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
