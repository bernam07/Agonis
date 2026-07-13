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

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import GameModal from '../game/GameModal'
import { Trophy, Star, Users, Flame, Lock } from 'lucide-react'
import StarDisplay from '../common/StarDisplay'
import ProfileHeader from './ProfileHeader'
import ProfileActivity from './ProfileActivity'
import ProfileCustomLists from './ProfileCustomLists'

export default function Profile({
  userId,
  onBack,
  onUserClick,
}: {
  userId?: string | null
  onBack?: () => void
  onUserClick?: (id: string) => void
}) {
  const [profile, setProfile] = useState<any>(null)
  const [userLibrary, setUserLibrary] = useState<any[]>([])
  const [myPosts, setMyPosts] = useState<any[]>([])

  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState<'activity' | 'library' | 'lists'>('activity')
  const [isPlatformsExpanded, setIsPlatformsExpanded] = useState(false)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'recent' | 'rating' | 'name'>('recent')

  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isRequested, setIsRequested] = useState(false)

  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [followModalData, setFollowModalData] = useState<{ title: string; users: any[] } | null>(null)

  const [lists, setLists] = useState<any[]>([])
  const [listName, setListName] = useState('')
  const [listDesc, setListDesc] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const [listGames, setListGames] = useState<any[]>([])

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const targetId = userId || user?.id
    if (!targetId) return

    setIsCurrentUser(user?.id === targetId)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', targetId).single()
    if (profileData) {
      setProfile(profileData)
      setEditUsername(profileData.username || '')
      setEditBio(profileData.bio || '')
      setEditAvatar(profileData.avatar_url || '')
      setEditIsPublic(profileData.is_public ?? true)
    }

    const { count: f1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetId)
    const { count: f2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetId)
    setFollowersCount(f1 || 0)
    setFollowingCount(f2 || 0)

    if (user && user.id !== targetId) {
      const { data: followData } = await supabase.from('follows').select('*').match({ follower_id: user.id, following_id: targetId }).maybeSingle()
      setIsFollowing(!!followData)

      const { data: requestData } = await supabase.from('follow_requests').select('*').match({ sender_id: user.id, receiver_id: targetId }).maybeSingle()
      setIsRequested(!!requestData)
    }

    const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
    if (postsData) setMyPosts(postsData)

    fetchUserLists(targetId)

    const { data: gamesData } = await supabase.from('user_games').select('*').eq('user_id', targetId)
    if (gamesData && gamesData.length > 0) {
      const { data: igdbGames } = await supabase.functions.invoke('fetch-games', { body: { gameIds: gamesData.map((g:any) => g.igdb_id) } })
      if (igdbGames) {
        const combined = gamesData.map((dbGame:any) => ({
          ...dbGame,
          ...igdbGames.find((g: any) => Number(g.id) === Number(dbGame.igdb_id)),
        }))
        setUserLibrary(combined)
      } else setUserLibrary(gamesData)
    } else setUserLibrary([])

    setLoading(false)
  }

  const fetchUserLists = async (uid: string) => {
    const { data } = await supabase.from('lists').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (data) setLists(data)
  }

  const handleGameClick = (userGame: any) => {
    setSelectedGame({
      game: {
        ...userGame,
        id: userGame.igdb_id || userGame.id,
        name: userGame.game_name || userGame.name,
        cover: userGame.cover || { url: userGame.game_cover },
      },
      userGame: userGame,
    })
  }

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !profile) return

    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: user.id, following_id: profile.id })
      setFollowersCount((prev) => prev - 1)
      setIsFollowing(false)
    } else if (isRequested) {
      await supabase.from('follow_requests').delete().match({ sender_id: user.id, receiver_id: profile.id })
      await supabase.from('notifications').delete().match({ actor_id: user.id, receiver_id: profile.id, type: 'follow_request' })
      setIsRequested(false)
    } else {
      if (!profile.is_public) {
        await supabase.from('follow_requests').insert([{ sender_id: user.id, receiver_id: profile.id }])
        await supabase.from('notifications').insert([{ receiver_id: profile.id, actor_id: user.id, type: 'follow_request' }])
        setIsRequested(true)
      } else {
        await supabase.from('follows').insert([{ follower_id: user.id, following_id: profile.id }])
        await supabase.from('notifications').insert([{ receiver_id: profile.id, actor_id: user.id, type: 'follow' }])
        setFollowersCount((prev) => prev + 1)
        setIsFollowing(true)
      }
    }
  }

  const openFollowList = async (type: 'followers' | 'following') => {
    if (!canViewLibrary) return
    if (type === 'followers') {
      const { data } = await supabase.from('follows').select('profiles!follows_follower_id_fkey(id, username, avatar_url)').eq('following_id', profile.id)
      if (data) setFollowModalData({ title: 'Followers', users: data.map((d: any) => d.profiles) })
    } else {
      const { data } = await supabase.from('follows').select('profiles!follows_following_id_fkey(id, username, avatar_url)').eq('follower_id', profile.id)
      if (data) setFollowModalData({ title: 'Following', users: data.map((d: any) => d.profiles) })
    }
  }

  const deletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setMyPosts(myPosts.filter((p) => p.id !== postId))
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      if (!event.target.files || event.target.files.length === 0) return
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setEditAvatar(data.publicUrl)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    if (!editUsername.trim() || !isCurrentUser) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const updates = { username: editUsername.trim(), bio: editBio.trim(), avatar_url: editAvatar.trim(), is_public: editIsPublic }
      await supabase.from('profiles').update(updates).eq('id', user.id)
      setProfile({ ...profile, ...updates })
      setIsEditing(false)
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listName.trim() || !isCurrentUser) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('lists').insert([{ user_id: user.id, name: listName.trim(), description: listDesc.trim(), is_public: true }]).select().single()
    if (data) {
      setListName('')
      setListDesc('')
      setShowCreateForm(false)
      fetchUserLists(user.id)
    }
  }

  const handleDeleteList = async (id: string) => {
    if (!window.confirm('Delete this list?')) return
    await supabase.from('lists').delete().eq('id', id)
    if (profile?.id) fetchUserLists(profile.id)
    if (expandedListId === id) setExpandedListId(null)
  }

  const toggleListExpansion = async (listId: string) => {
    if (expandedListId === listId) {
      setExpandedListId(null)
      setListGames([])
      return
    }
    setExpandedListId(listId)
    const { data } = await supabase.from('list_games').select('*').eq('list_id', listId).order('created_at', { ascending: true })
    if (data) setListGames(data)
  }

  const handleRemoveGameFromList = async (gameId: string, listId: string) => {
    await supabase.from('list_games').delete().eq('id', gameId)
    const { data } = await supabase.from('list_games').select('*').eq('list_id', listId).order('created_at', { ascending: true })
    if (data) setListGames(data)
  }

  const libStats = useMemo(() => {
    const total = userLibrary.length
    let completed = 0, backlog = 0, playing = 0, dropped = 0, percent100 = 0
    let ratedCount = 0, ratingSum = 0
    const favorites: any[] = []
    const platforms: Record<string, number> = {}

    userLibrary.forEach((g) => {
      if (g.status === 'completed') completed++
      else if (g.status === 'backlog') backlog++
      else if (g.status === 'playing') playing++
      else if (g.status === 'dropped') dropped++
      else if (g.status === '100_percent') { percent100++; completed++ }

      if (g.rating && g.rating > 0) {
        ratedCount++
        ratingSum += g.rating
      }
      if (g.rating >= 4.5) favorites.push(g) // Modifiquei aqui para >= 4.5 para ser mais realista

      if (g.platforms) {
        g.platforms.forEach((p: any) => { platforms[p.name] = (platforms[p.name] || 0) + 1 })
      }
    })

    const averageRating: number = ratedCount > 0 ? parseFloat((ratingSum / ratedCount).toFixed(1)) : 0
    const platformData = Object.entries(platforms).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10)
    const statusData = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Playing', value: playing, color: '#818cf8' },
      { name: 'Backlog', value: backlog, color: '#fbbf24' },
      { name: 'Dropped', value: dropped, color: '#f43f5e' },
    ].filter((d) => d.value > 0)
    const maxPlatform = platformData.length > 0 ? Math.max(...platformData.map((p) => p.count)) : 1

    return { total, completed, backlog, playing, dropped, percent100, averageRating, favorites, platformData, statusData, maxPlatform }
  }, [userLibrary])

  const filteredAndSortedLibrary = useMemo(() => {
    let result = [...userLibrary]
    if (filterStatus !== 'all') result = result.filter((g) => g.status === filterStatus)
    result.sort((a, b) => {
      if (sortOrder === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortOrder === 'name') return (a.game_name || a.name || '').localeCompare(b.game_name || b.name || '')
      return 0
    })
    return result
  }, [userLibrary, sortOrder, filterStatus])

  const canViewLibrary = isCurrentUser || profile?.is_public

  if (loading) return <div className="text-zinc-500 text-center py-10 font-medium">Loading profile...</div>
  if (!profile) return <div className="text-zinc-500 text-center py-10 font-medium">User not found.</div>

  const renderBadges = () => {
    const badges = []
    if (libStats.completed >= 5) badges.push({ icon: <Trophy className="w-5 h-5 text-yellow-500" />, name: 'Completionist', desc: 'Completed 5+ games' })
    if (libStats.favorites.length >= 3) badges.push({ icon: <Star className="w-5 h-5 text-amber-400" fill="currentColor" />, name: 'Tastemaker', desc: '3+ Masterpieces' })
    if (followersCount >= 10) badges.push({ icon: <Users className="w-5 h-5 text-blue-400" />, name: 'Social Butterfly', desc: '10+ Followers' })
    if (libStats.total >= 20) badges.push({ icon: <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />, name: 'Veteran', desc: '20+ Games Tracked' })

    if (badges.length === 0) return null

    return (
      <div className="mb-8 animate-fade-in">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4 border-l-2 border-indigo-500 pl-3">Achievements</h3>
        <div className="flex gap-3 flex-wrap">
          {badges.map((b) => (
            <div key={b.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 w-max group hover:border-indigo-500 transition-colors shadow-sm">
              <div className="text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform">{b.icon}</div>
              <div>
                <div className="font-bold text-zinc-200 text-sm group-hover:text-indigo-400 transition-colors">{b.name}</div>
                <div className="text-[10px] text-zinc-500 font-medium">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      
      {/* ===== HEADER DO PERFIL ===== */}
      <ProfileHeader 
        profile={profile} isCurrentUser={isCurrentUser} isEditing={isEditing} setIsEditing={setIsEditing}
        followersCount={followersCount} followingCount={followingCount} isFollowing={isFollowing} isRequested={isRequested}
        toggleFollow={toggleFollow} openFollowList={openFollowList} canViewLibrary={canViewLibrary}
        onBack={onBack} userId={userId}
      />

      {/* ===== FORMULÁRIO DE SETTINGS (Mantido aqui por causa dos estados locais) ===== */}
      {isEditing && (
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-white font-bold border-b border-zinc-800 pb-2">Profile & Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                {editAvatar && <img src={editAvatar} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 text-left">
                <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block">
                  {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                </label>
              </div>
            </div>
            <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm" />
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about your gaming tastes..." rows={3} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm resize-none" />
          </div>
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800 mt-2">
            <span className="text-sm font-bold text-zinc-300">Public Profile</span>
            <button onClick={() => setEditIsPublic(!editIsPublic)} className={`w-12 h-6 rounded-full p-1 transition-colors ${editIsPublic ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${editIsPublic ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={saveProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-4 py-2 rounded-lg font-bold text-sm">Save Changes</button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* ===== CORPO DO PERFIL ===== */}
      {!canViewLibrary ? (
        <div className="flex flex-col items-center">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center w-full max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">This profile is private</h3>
            <p className="text-zinc-400 text-sm font-medium">Follow @{profile.username} to see their game library and posts.</p>
          </div>
        </div>
      ) : (
        <>
          {renderBadges()}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => setViewMode('library')} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center transition-all cursor-pointer hover:border-indigo-500 hover:bg-zinc-800">
              <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase flex items-center gap-1">Total Games</span>
              <span className="text-3xl font-black text-white">{libStats.total}</span>
            </button>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center">
              <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Completed</span>
              <span className="text-3xl font-black text-emerald-400">{libStats.completed}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center">
              <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Backlog</span>
              <span className="text-3xl font-black text-amber-400">{libStats.backlog}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center">
              <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Avg Rating</span>
              <span className="text-3xl font-black text-amber-400 mb-2 flex items-center gap-2">{libStats.averageRating}</span>
              {libStats.averageRating > 0 && <StarDisplay rating={libStats.averageRating} size={16} />}
            </div>
          </div>

          <div>
            <div className="flex gap-4 border-b border-zinc-800 mb-6 mt-8 overflow-x-auto custom-scrollbar">
              <button onClick={() => setViewMode('activity')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${viewMode === 'activity' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Feed Activity</button>
              <button onClick={() => setViewMode('library')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${viewMode === 'library' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Game Collection</button>
              <button onClick={() => setViewMode('lists')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${viewMode === 'lists' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Custom Lists ({lists.length})</button>
            </div>

            {/* ===== ABAS CONTEÚDO ===== */}
            {viewMode === 'activity' && <ProfileActivity myPosts={myPosts} isCurrentUser={isCurrentUser} deletePost={deletePost} />}
            
            {viewMode === 'lists' && (
              <ProfileCustomLists 
                lists={lists} isCurrentUser={isCurrentUser} showCreateForm={showCreateForm} setShowCreateForm={setShowCreateForm}
                listName={listName} setListName={setListName} listDesc={listDesc} setListDesc={setListDesc}
                handleCreateList={handleCreateList} handleDeleteList={handleDeleteList} toggleListExpansion={toggleListExpansion}
                expandedListId={expandedListId} listGames={listGames} userLibrary={userLibrary}
                handleGameClick={handleGameClick} setSelectedGame={setSelectedGame} handleRemoveGameFromList={handleRemoveGameFromList}
              />
            )}

            {/* A biblioteca mantivemos in-line porque é apenas a renderização dos botões e imagens */}
            {viewMode === 'library' && (
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
            )}
          </div>
        </>
      )}

      {selectedGame && (
        <GameModal
          game={selectedGame.game} userGame={selectedGame.userGame} isReadOnly={!!userId}
          onClose={() => setSelectedGame(null)} onRefresh={loadProfile}
        />
      )}

      {followModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setFollowModalData(null)}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-sm font-bold text-white">{followModalData.title}</h3>
              <button onClick={() => setFollowModalData(null)} className="text-zinc-500 hover:text-white font-bold">×</button>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {followModalData.users.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No users found.</div>
              ) : (
                followModalData.users.map((u: any) => (
                  <div key={u.id} onClick={() => { setFollowModalData(null); if (onUserClick) onUserClick(u.id); }} className="flex items-center gap-3 p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{u.username?.charAt(0).toUpperCase()}</div>}
                    </div>
                    <span className="font-bold text-zinc-200 text-sm">@{u.username}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}