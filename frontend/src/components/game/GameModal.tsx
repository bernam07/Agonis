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
import { Star } from 'lucide-react'
import type { Game, UserGame } from '../../types'
import GameDetailsTab from './GameDetailsTab'
import ReviewFormTab from './ReviewFormTab'
import GameScreenshotsTab from './GameScreenshotsTab'
import GameCommunityTab from './GameCommunityTab'

interface GameModalProps {
  game: Game;
  userGame?: UserGame;
  onClose: () => void;
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

export default function GameModal({ game, userGame, onClose, onRefresh, isReadOnly = false }: GameModalProps) {
  const [status, setStatus] = useState(userGame?.status || 'backlog')
  const [rating, setRating] = useState(userGame?.rating || 0)
  const [review, setReview] = useState(userGame?.review || '')
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'track' | 'details' | 'screenshots' | 'community'>('track')
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
      const { data } = await supabase.functions.invoke('fetch-games', { body: { gameIds: [igdbId] } })
      if (data && data.length > 0) setFullGameDetails({ ...game, ...data[0] })
    } catch (err) {
      console.error(err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const loadCommunityData = async () => {
    if (!igdbId) return
    setCommunityLoading(true)
    const { data } = await supabase
      .from('user_games')
      .select('rating, review, profiles ( username, avatar_url )')
      .eq('igdb_id', igdbId)
      .not('rating', 'is', null)

    if (data) {
      const ratedGames = data.filter((d: any) => d.rating && d.rating > 0)
      const avg = ratedGames.length > 0
          ? (ratedGames.reduce((acc: any, d: any) => acc + d.rating, 0) / ratedGames.length).toFixed(1)
          : '0.0'
      setCommunityAvg(avg)
      setCommunityReviews(data.filter((d: any) => d.review && d.review.trim() !== ''))
    }
    setCommunityLoading(false)
  }

  const loadMyLists = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('lists').select('*').eq('user_id', user.id).order('name', { ascending: true })
      if (data) setMyLists(data)
    }
  }

  const handleAddToList = async () => {
    if (!userGame || !userGame.id) {
      alert("You need to 'Save Changes' and add this game to your library first before putting it in a list!")
      return
    }
    const { error } = await supabase.from('list_games').insert([{
      list_id: selectedListId,
      igdb_id: igdbId,
      game_name: game.name || game.game_name,
      game_cover: game.cover?.url || game.game_cover || null,
    }])

    if (error) {
      console.error(error)
      alert("Error adding to list.")
    } else {
      alert("Game added to the list!")
      setSelectedListId("")
    }
  }

  const loadScreenshots = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !igdbId) return
    const { data } = await supabase.from('game_screenshots').select('*').eq('igdb_id', igdbId).eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setScreenshots(data)
  }

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !igdbId) return
      setUploadingScreenshot(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('screenshots').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('screenshots').getPublicUrl(filePath)
      await supabase.from('game_screenshots').insert([{ user_id: user.id, igdb_id: igdbId, url: publicData.publicUrl }])
      loadScreenshots()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const saveGame = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && igdbId) {
      const completedDate = (status === 'completed' || status === '100_percent') ? (userGame?.completed_at || new Date().toISOString()) : null

      await supabase.from('list_games').upsert({ id: igdbId, game_name: game.name || game.game_name, game_cover: game.cover?.url || game.game_cover || null })
      await supabase.from('user_games').upsert(
        { user_id: user.id, igdb_id: igdbId, status: status, rating: rating > 0 ? rating : null, review: review.trim() === '' ? null : review, completed_at: completedDate },
        { onConflict: 'user_id,igdb_id' }
      )
      if (onRefresh) onRefresh()
    }
    setLoading(false)
    onClose()
  }

  const deleteGame = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && igdbId) {
      await supabase.from('user_games').delete().match({ user_id: user.id, igdb_id: igdbId })
      if (onRefresh) onRefresh()
    }
    onClose()
  }

  const displayGame = fullGameDetails || game

  return (
    <div className={`fixed inset-0 z-50 p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center ${showShare ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 text-zinc-900 dark:text-zinc-100 m-auto shadow-2xl relative">
        <div className="flex gap-5 mb-6 shrink-0">
          <div className="w-28 aspect-3/4 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-lg">
            {displayGame.cover?.url && (
              <img
                src={displayGame.cover.url.replace('t_thumb', 't_cover_big')}
                alt={displayGame.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 leading-tight truncate">
              {displayGame.name || displayGame.game_name}
            </h2>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const fillWidth = rating >= star ? '100%' : rating >= star - 0.5 ? '50%' : '0%';
                return (
                  <div key={star} className={`relative w-6 h-6 ${!isReadOnly && 'hover:scale-110'} transition-transform`}>
                    <Star className="absolute top-0 left-0 w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                    <div className="absolute top-0 left-0 h-full overflow-hidden text-amber-400 pointer-events-none" style={{ width: fillWidth }}>
                      <Star className="w-6 h-6 max-w-none" fill="currentColor" />
                    </div>
                    {!isReadOnly && (
                      <div className="absolute inset-0 flex">
                        <button type="button" onClick={() => setRating(star - 0.5)} className="w-1/2 h-full outline-none cursor-pointer" title={`${star - 0.5} Stars`} />
                        <button type="button" onClick={() => setRating(star)} className="w-1/2 h-full outline-none cursor-pointer" title={`${star} Stars`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-6 overflow-x-auto custom-scrollbar shrink-0">
          <button onClick={() => setActiveTab('track')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'track' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Track Status</button>
          <button onClick={() => setActiveTab('details')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Game Details</button>
          <button onClick={() => setActiveTab('screenshots')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'screenshots' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Screenshots</button>
          <button onClick={() => setActiveTab('community')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${activeTab === 'community' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Community ({communityReviews.length})</button>
        </div>

        <div className="mt-2 space-y-4 pb-4">
          
          {/* USAR O NOVO COMPONENTE REVIEW FORM */}
          {activeTab === 'track' && (
            <ReviewFormTab
              status={status}
              setStatus={setStatus}
              review={review}
              setReview={setReview}
              isReadOnly={isReadOnly}
              myLists={myLists}
              selectedListId={selectedListId}
              setSelectedListId={setSelectedListId}
              handleAddToList={handleAddToList}
            />
          )}

          {/* USAR O NOVO COMPONENTE GAME DETAILS */}
          {activeTab === 'details' && (
            <GameDetailsTab displayGame={displayGame} detailsLoading={detailsLoading} />
          )}

          {activeTab === 'screenshots' && (
            <GameScreenshotsTab
              screenshots={screenshots} uploadingScreenshot={uploadingScreenshot}
              handleScreenshotUpload={handleScreenshotUpload}
            />
          )}

          {activeTab === 'community' && (
            <GameCommunityTab
              communityLoading={communityLoading} communityAvg={communityAvg} communityReviews={communityReviews}
            />
          )}
        </div>

        {userGame && (
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <button onClick={() => setShowShare(true)} className="w-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300/50 dark:border-indigo-500/30 hover:border-indigo-500 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
              Export Review Card
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-bold transition-colors">Close</button>
          {!isReadOnly && (
            <div className="flex gap-3">
              {userGame && (
                <button onClick={deleteGame} className="px-5 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-bold transition-colors">Remove</button>
              )}
              <button onClick={saveGame} disabled={loading} className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showShare && userGame && <ShareModal game={game} userGame={userGame} onClose={() => setShowShare(false)} />}
    </div>
  )
}