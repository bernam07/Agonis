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
import { supabase } from '../lib/supabase'
import GameModal from './GameModal'

export default function Profile({ userId, onBack, onUserClick }: { userId?: string | null, onBack?: () => void, onUserClick?: (id: string) => void }) {
  const [profile, setProfile] = useState<any>(null)
  const [userLibrary, setUserLibrary] = useState<any[]>([])
  const [myPosts, setMyPosts] = useState<any[]>([])
  
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [viewMode, setViewMode] = useState<'activity' | 'library'>('activity')
  
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
  const [followModalData, setFollowModalData] = useState<{title: string, users: any[]} | null>(null)

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
      const { data: followData } = await supabase.from('follows').select('*').match({ follower_id: user.id, following_id: targetId }).single()
      setIsFollowing(!!followData)

      const { data: requestData } = await supabase.from('follow_requests').select('*').match({ sender_id: user.id, receiver_id: targetId }).single()
      setIsRequested(!!requestData)
    }

    const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
    if (postsData) setMyPosts(postsData)

    const { data: gamesData } = await supabase.from('user_games').select('*').eq('user_id', targetId)
    if (gamesData && gamesData.length > 0) {
      const { data: igdbGames } = await supabase.functions.invoke('fetch-games', { body: { gameIds: gamesData.map(g => g.igdb_id) } })
      if (igdbGames) {
        const combined = gamesData.map(dbGame => ({ ...dbGame, ...igdbGames.find((g: any) => g.id === dbGame.igdb_id) }))
        setUserLibrary(combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      } else setUserLibrary(gamesData)
    } else setUserLibrary([])
    
    setLoading(false)
  }

  const handleGameClick = (userGame: any) => {
    setSelectedGame({
      game: {
        id: userGame.igdb_id,
        name: userGame.game_name || userGame.name,
        cover: userGame.cover || { url: userGame.game_cover }
      },
      userGame: userGame
    })
  }

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !profile) return

    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: user.id, following_id: profile.id })
      setFollowersCount(prev => prev - 1)
      setIsFollowing(false)
    } else if (isRequested) {
      await supabase.from('follow_requests').delete().match({ sender_id: user.id, receiver_id: profile.id })
      await supabase.from('notifications').delete().match({ actor_id: user.id, receiver_id: profile.id, type: 'follow_request' })
      setIsRequested(false)
    } else {
      if (!profile.is_public) {
        await supabase.from('follow_requests').insert([{ sender_id: user.id, receiver_id: profile.id }])
        await supabase.from('notifications').insert([{
          receiver_id: profile.id,
          actor_id: user.id,
          type: 'follow_request'
        }])
        setIsRequested(true)
      } else {
        await supabase.from('follows').insert([{ follower_id: user.id, following_id: profile.id }])
        await supabase.from('notifications').insert([{
          receiver_id: profile.id,
          actor_id: user.id,
          type: 'follow'
        }])
        setFollowersCount(prev => prev + 1)
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
    if (!window.confirm("Are you sure you want to delete this post?")) return
    await supabase.from('posts').delete().eq('id', postId)
    setMyPosts(myPosts.filter(p => p.id !== postId))
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
      alert('Error uploading image: ' + error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    if (!editUsername.trim() || !isCurrentUser) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const updates = { 
        username: editUsername.trim(), 
        bio: editBio.trim(), 
        avatar_url: editAvatar.trim(),
        is_public: editIsPublic
      }
      await supabase.from('profiles').update(updates).eq('id', user.id)
      setProfile({ ...profile, ...updates })
      setIsEditing(false)
    }
  }

  const stats = useMemo(() => {
    const total = userLibrary.length
    const completed = userLibrary.filter(g => g.status === 'completed' || g.status === '100_percent').length
    const backlog = userLibrary.filter(g => g.status === 'backlog').length
    const ratedGames = userLibrary.filter(g => g.rating && g.rating > 0)
    const averageRating = ratedGames.length ? (ratedGames.reduce((acc, g) => acc + g.rating, 0) / ratedGames.length).toFixed(1) : '0.0'
    const favorites = userLibrary.filter(g => g.rating === 5)
    return { total, completed, backlog, averageRating, favorites }
  }, [userLibrary])

  const canViewLibrary = isCurrentUser || profile?.is_public

  if (loading) return <div className="text-zinc-500 text-center py-10 font-medium">Loading profile...</div>
  if (!profile) return <div className="text-zinc-500 text-center py-10 font-medium">User not found.</div>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      
      {!isCurrentUser && userId && (
        <div>
          <button onClick={onBack} className="text-zinc-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
            ← Back to Feed
          </button>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
        <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-950 flex items-center justify-center text-5xl font-black text-zinc-500 overflow-hidden shrink-0 shadow-xl">
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" /> : profile.username?.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 w-full text-center md:text-left">
          {isEditing ? (
            <div className="flex flex-col gap-4 w-full max-w-md mx-auto md:mx-0">
              <h3 className="text-white font-bold border-b border-zinc-800 pb-2">Profile & Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                    {editAvatar ? <img src={editAvatar} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 text-left">
                    <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block">
                      {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                    </label>
                  </div>
                </div>

                <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Username" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm" />
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell us about your gaming tastes..." rows={3} className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm resize-none" />
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
          ) : (
            <div>
              <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                <h2 className="text-3xl font-black text-white">@{profile.username}</h2>
                
                {isCurrentUser ? (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors">Settings</button>
                ) : (
                  <button 
                    onClick={toggleFollow} 
                    className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
                      isFollowing || isRequested ? 'bg-zinc-800 text-zinc-300 hover:bg-rose-500 hover:text-white' : 'bg-white text-zinc-950 hover:bg-zinc-200'
                    }`}
                  >
                    {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
                  </button>
                )}
              </div>
              
              <div className="flex gap-5 justify-center md:justify-start mb-4 text-sm">
                <button onClick={() => openFollowList('followers')} className={`flex gap-1 ${canViewLibrary ? 'hover:opacity-80' : 'cursor-default'}`}>
                  <span className="font-bold text-white">{followersCount}</span> <span className="text-zinc-400">followers</span>
                </button>
                <button onClick={() => openFollowList('following')} className={`flex gap-1 ${canViewLibrary ? 'hover:opacity-80' : 'cursor-default'}`}>
                  <span className="font-bold text-white">{followingCount}</span> <span className="text-zinc-400">following</span>
                </button>
              </div>

              {profile.bio && <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mb-2">{profile.bio}</p>}
            </div>
          )}
        </div>
      </div>

      {!canViewLibrary ? (
        <div className="flex flex-col items-center">
          <div className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center mb-8 max-w-xs mx-auto">
            <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Games Completed</span>
            <span className="text-4xl font-black text-emerald-400">{stats.completed}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center w-full max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-black text-white mb-2">This profile is private</h3>
            <p className="text-zinc-400 text-sm font-medium">Follow @{profile.username} to see their game library and posts.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => setViewMode('library')} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center transition-all cursor-pointer hover:border-indigo-500 hover:bg-zinc-800">
              <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase flex items-center gap-1">Total Games</span>
              <span className="text-3xl font-black text-white">{stats.total}</span>
            </button>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center"><span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Completed</span><span className="text-3xl font-black text-emerald-400">{stats.completed}</span></div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center"><span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Backlog</span><span className="text-3xl font-black text-amber-400">{stats.backlog}</span></div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center"><span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">Avg Rating</span><span className="text-3xl font-black text-yellow-500 flex items-center gap-1">{stats.averageRating}<span className="text-xl pb-1">★</span></span></div>
          </div>

          {stats.favorites.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 border-l-2 border-yellow-500 pl-3">Masterpieces</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {stats.favorites.map(game => (
                  <div key={game.id} onClick={() => handleGameClick(game)} className="cursor-pointer rounded-xl overflow-hidden border border-zinc-800 relative group">
                    {game.cover?.url ? <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full aspect-[3/4] object-cover transition-transform group-hover:scale-105" /> : <div className="w-full aspect-[3/4] bg-zinc-800 transition-transform group-hover:scale-105"></div>}
                    <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center"><span className="text-white text-xs font-bold line-clamp-2">{game.name || game.game_name}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex gap-4 border-b border-zinc-800 mb-6 mt-8">
              <button onClick={() => setViewMode('activity')} className={`pb-2 text-sm font-bold transition-colors ${viewMode === 'activity' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Feed Activity</button>
              <button onClick={() => setViewMode('library')} className={`pb-2 text-sm font-bold transition-colors ${viewMode === 'library' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Game Collection</button>
            </div>

            {viewMode === 'activity' && (
              <div>
                {myPosts.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm font-medium">No activity yet.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {myPosts.map(post => (
                      <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative">
                        {isCurrentUser && (
                          <button onClick={() => deletePost(post.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-rose-500 transition-colors" title="Delete Post">🗑️</button>
                        )}
                        {post.game_name && <div className="text-xs font-bold text-indigo-400 mb-2">{post.game_name}</div>}
                        <p className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed font-medium">{post.content}</p>
                        {post.image_url && <img src={post.image_url} className="mt-3 rounded-xl border border-zinc-800 w-full max-h-64 object-cover" />}
                        <div className="text-xs font-medium text-zinc-600 mt-4">{new Date(post.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'library' && (
              <div>
                {userLibrary.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-medium">This library is empty.</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {userLibrary.map((game) => (
                      <div key={game.id} onClick={() => handleGameClick(game)} className="cursor-pointer bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex flex-col relative group transition-transform hover:scale-105">
                        <span className="absolute top-3 right-3 z-10 text-[9px] font-black bg-zinc-950/90 text-zinc-300 border border-zinc-800 px-1.5 py-0.5 rounded capitalize">{game.status.replace('_', ' ')}</span>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-950 mb-2">
                          {game.cover?.url ? <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="flex justify-center text-amber-400 text-[10px] mt-auto">
                          {'★'.repeat(game.rating || 0)}{'☆'.repeat(5 - (game.rating || 0))}
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
          game={selectedGame.game} 
          userGame={selectedGame.userGame} 
          onClose={() => setSelectedGame(null)} 
          onRefresh={loadProfile} 
        />
      )}

      {followModalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setFollowModalData(null)}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-sm font-bold text-white">{followModalData.title}</h3>
              <button onClick={() => setFollowModalData(null)} className="text-zinc-500 hover:text-white font-bold">×</button>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {followModalData.users.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No users found.</div>
              ) : (
                followModalData.users.map((u: any) => (
                  <div 
                    key={u.id} 
                    onClick={() => {
                      setFollowModalData(null);
                      if (onUserClick) onUserClick(u.id);
                    }}
                    className="flex items-center gap-3 p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
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