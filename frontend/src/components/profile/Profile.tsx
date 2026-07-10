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
import { Trophy, Star, Users, Flame, Lock, Trash2, AlertTriangle } from 'lucide-react'
import StarDisplay from '../common/StarDisplay'

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
  const [followModalData, setFollowModalData] = useState<{ title: string; users: any[] } | null>(
    null
  )

  const [lists, setLists] = useState<any[]>([])
  const [listName, setListName] = useState('')
  const [listDesc, setListDesc] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const [listGames, setListGames] = useState<any[]>([])

  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const targetId = userId || user?.id
    if (!targetId) return

    setIsCurrentUser(user?.id === targetId)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single()
    if (profileData) {
      setProfile(profileData)
      setEditUsername(profileData.username || '')
      setEditBio(profileData.bio || '')
      setEditAvatar(profileData.avatar_url || '')
      setEditIsPublic(profileData.is_public ?? true)
    }

    const { count: f1 } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetId)
    const { count: f2 } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetId)
    setFollowersCount(f1 || 0)
    setFollowingCount(f2 || 0)

    if (user && user.id !== targetId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .match({ follower_id: user.id, following_id: targetId })
        .single()
      setIsFollowing(!!followData)

      const { data: requestData } = await supabase
        .from('follow_requests')
        .select('*')
        .match({ sender_id: user.id, receiver_id: targetId })
        .single()
      setIsRequested(!!requestData)
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
    if (postsData) setMyPosts(postsData)

    fetchUserLists(targetId)

    const { data: gamesData } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', targetId)
    if (gamesData && gamesData.length > 0) {
      const { data: igdbGames } = await supabase.functions.invoke('fetch-games', {
        body: { gameIds: gamesData.map((g:any) => g.igdb_id) },
      })
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
    const { data } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !profile) return

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: user.id, following_id: profile.id })
      setFollowersCount((prev) => prev - 1)
      setIsFollowing(false)
    } else if (isRequested) {
      await supabase
        .from('follow_requests')
        .delete()
        .match({ sender_id: user.id, receiver_id: profile.id })
      await supabase
        .from('notifications')
        .delete()
        .match({ actor_id: user.id, receiver_id: profile.id, type: 'follow_request' })
      setIsRequested(false)
    } else {
      if (!profile.is_public) {
        await supabase
          .from('follow_requests')
          .insert([{ sender_id: user.id, receiver_id: profile.id }])
        await supabase.from('notifications').insert([
          {
            receiver_id: profile.id,
            actor_id: user.id,
            type: 'follow_request',
          },
        ])
        setIsRequested(true)
      } else {
        await supabase.from('follows').insert([{ follower_id: user.id, following_id: profile.id }])
        await supabase.from('notifications').insert([
          {
            receiver_id: profile.id,
            actor_id: user.id,
            type: 'follow',
          },
        ])
        setFollowersCount((prev) => prev + 1)
        setIsFollowing(true)
      }
    }
  }

  const openFollowList = async (type: 'followers' | 'following') => {
    if (!canViewLibrary) return

    if (type === 'followers') {
      const { data } = await supabase
        .from('follows')
        .select('profiles!follows_follower_id_fkey(id, username, avatar_url)')
        .eq('following_id', profile.id)
      if (data) setFollowModalData({ title: 'Followers', users: data.map((d: any) => d.profiles) })
    } else {
      const { data } = await supabase
        .from('follows')
        .select('profiles!follows_following_id_fkey(id, username, avatar_url)')
        .eq('follower_id', profile.id)
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const updates = {
        username: editUsername.trim(),
        bio: editBio.trim(),
        avatar_url: editAvatar.trim(),
        is_public: editIsPublic,
      }
      await supabase.from('profiles').update(updates).eq('id', user.id)
      setProfile({ ...profile, ...updates })
      setIsEditing(false)
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listName.trim() || !isCurrentUser) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('lists')
      .insert([
        {
          user_id: user.id,
          name: listName.trim(),
          description: listDesc.trim(),
          is_public: true,
        },
      ])
      .select()
      .single()

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
    const { data } = await supabase
      .from('list_games')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })
    if (data) setListGames(data)
  }

  const handleRemoveGameFromList = async (gameId: string, listId: string) => {
    await supabase.from('list_games').delete().eq('id', gameId)
    const { data } = await supabase
      .from('list_games')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })
    if (data) setListGames(data)
  }

  const libStats = useMemo(() => {
    const total = userLibrary.length
    let completed = 0,
      backlog = 0,
      playing = 0,
      dropped = 0,
      percent100 = 0
    let ratedCount = 0,
      ratingSum = 0
    const favorites: any[] = []
    const platforms: Record<string, number> = {}

    userLibrary.forEach((g) => {
      if (g.status === 'completed') completed++
      else if (g.status === 'backlog') backlog++
      else if (g.status === 'playing') playing++
      else if (g.status === 'dropped') dropped++
      else if (g.status === '100_percent') {
        percent100++
        completed++
      }

      if (g.rating && g.rating > 0) {
        ratedCount++
        ratingSum += g.rating
      }
      if (g.rating === 5) favorites.push(g)

      if (g.platforms) {
        g.platforms.forEach((p: any) => {
          platforms[p.name] = (platforms[p.name] || 0) + 1
        })
      }
    })

    const averageRating: number = ratedCount > 0 ? parseFloat((ratingSum / ratedCount).toFixed(1)) : 0

    const platformData = Object.entries(platforms)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const statusData = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Playing', value: playing, color: '#818cf8' },
      { name: 'Backlog', value: backlog, color: '#fbbf24' },
      { name: 'Dropped', value: dropped, color: '#f43f5e' },
    ].filter((d) => d.value > 0)

    const maxPlatform = platformData.length > 0 ? Math.max(...platformData.map((p) => p.count)) : 1

    return {
      total,
      completed,
      backlog,
      playing,
      dropped,
      percent100,
      averageRating,
      favorites,
      platformData,
      statusData,
      maxPlatform,
    }
  }, [userLibrary])

  const filteredAndSortedLibrary = useMemo(() => {
    let result = [...userLibrary]

    if (filterStatus !== 'all') {
      result = result.filter((g) => g.status === filterStatus)
    }

    result.sort((a, b) => {
      if (sortOrder === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortOrder === 'rating') {
        return (b.rating || 0) - (a.rating || 0)
      }
      if (sortOrder === 'name') {
        const nameA = a.game_name || a.name || ''
        const nameB = b.game_name || b.name || ''
        return nameA.localeCompare(nameB)
      }
      return 0
    })

    return result
  }, [userLibrary, sortOrder, filterStatus])

  const canViewLibrary = isCurrentUser || profile?.is_public

  if (loading)
    return <div className="text-zinc-500 text-center py-10 font-medium">Loading profile...</div>
  if (!profile)
    return <div className="text-zinc-500 text-center py-10 font-medium">User not found.</div>

  const renderBadges = () => {
    const badges = []

    if (libStats.completed >= 5) {
      badges.push({
        icon: <Trophy className="w-5 h-5 text-yellow-500" />,
        name: 'Completionist',
        desc: 'Completed 5+ games',
      })
    }
    if (Number(libStats.favorites.length >= 3)) {
      badges.push({
        icon: <Star className="w-5 h-5 text-amber-400" fill="currentColor" />,
        name: 'Tastemaker',
        desc: '3+ Masterpieces',
      })
    }
    if (followersCount >= 10) {
      badges.push({
        icon: <Users className="w-5 h-5 text-blue-400" />,
        name: 'Social Butterfly',
        desc: '10+ Followers',
      })
    }
    if (libStats.total >= 20) {
      badges.push({
        icon: <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />,
        name: 'Veteran',
        desc: '20+ Games Tracked',
      })
    }

    if (badges.length === 0) return null

    return (
      <div className="mb-8 animate-fade-in">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4 border-l-2 border-indigo-500 pl-3">
          Achievements
        </h3>
        <div className="flex gap-3 flex-wrap">
          {badges.map((b) => (
            <div
              key={b.name}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 w-max group hover:border-indigo-500 transition-colors shadow-sm"
            >
              <div className="text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {b.icon}
              </div>
              <div>
                <div className="font-bold text-zinc-200 text-sm group-hover:text-indigo-400 transition-colors">
                  {b.name}
                </div>
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
      {!isCurrentUser && userId && (
        <div>
          <button
            onClick={onBack}
            className="text-zinc-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"
          >
            ← Back to Feed
          </button>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
        <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-950 flex items-center justify-center text-5xl font-black text-zinc-500 overflow-hidden shrink-0 shadow-xl">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            profile.username?.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 w-full text-center md:text-left">
          {isEditing ? (
            <div className="flex flex-col gap-4 w-full max-w-md mx-auto md:mx-0">
              <h3 className="text-white font-bold border-b border-zinc-800 pb-2">
                Profile & Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                    {editAvatar ? (
                      <img src={editAvatar} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-left">
                    <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block">
                      {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm"
                />
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about your gaming tastes..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800 mt-2">
                <span className="text-sm font-bold text-zinc-300">Public Profile</span>
                <button
                  onClick={() => setEditIsPublic(!editIsPublic)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${editIsPublic ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${editIsPublic ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveProfile}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-4 py-2 rounded-lg font-bold text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                <h2 className="text-3xl font-black text-white">@{profile.username}</h2>

                {isCurrentUser ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Settings
                  </button>
                ) : (
                  <button
                    onClick={toggleFollow}
                    className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
                      isFollowing || isRequested
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-rose-500 hover:text-white'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200'
                    }`}
                  >
                    {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
                  </button>
                )}
              </div>

              <div className="flex gap-5 justify-center md:justify-start mb-4 text-sm">
                <button
                  onClick={() => openFollowList('followers')}
                  className={`flex gap-1 ${canViewLibrary ? 'hover:opacity-80' : 'cursor-default'}`}
                >
                  <span className="font-bold text-white">{followersCount}</span>{' '}
                  <span className="text-zinc-400">followers</span>
                </button>
                <button
                  onClick={() => openFollowList('following')}
                  className={`flex gap-1 ${canViewLibrary ? 'hover:opacity-80' : 'cursor-default'}`}
                >
                  <span className="font-bold text-white">{followingCount}</span>{' '}
                  <span className="text-zinc-400">following</span>
                </button>
              </div>

              {profile.bio && (
                <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mb-2">
                  {profile.bio}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {!canViewLibrary ? (
        <div className="flex flex-col items-center">
          <div className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center mb-8 max-w-xs mx-auto">
            <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase">
              Games Completed
            </span>
            <span className="text-4xl font-black text-emerald-400">{libStats.completed}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center w-full max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">This profile is private</h3>
            <p className="text-zinc-400 text-sm font-medium">
              Follow @{profile.username} to see their game library and posts.
            </p>
          </div>
        </div>
      ) : (
        <>
          {renderBadges()}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setViewMode('library')}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center transition-all cursor-pointer hover:border-indigo-500 hover:bg-zinc-800"
            >
              <span className="text-zinc-500 font-semibold mb-1 text-xs uppercase flex items-center gap-1">
                Total Games
              </span>
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
              <span className="text-3xl font-black text-amber-400 mb-2 flex items-center gap-2">
                {libStats.averageRating}
              </span>
              {libStats.averageRating > 0 && (
                 <StarDisplay rating={libStats.averageRating} size={16} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center min-h-45 h-full">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-6 text-center">
                Library by Status
              </h3>

              {libStats.statusData.length > 0 ? (
                <>
                  <div className="w-full h-6 rounded-full overflow-hidden bg-zinc-950 flex mb-6 border border-zinc-800 shadow-inner">
                    {libStats.statusData.map((s) => (
                      <div
                        key={s.name}
                        title={`${s.name}: ${s.value}`}
                        className="h-full transition-all hover:brightness-110 cursor-pointer"
                        style={{
                          width: `${(s.value / libStats.total) * 100}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 justify-center">
                    {libStats.statusData.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-300"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: s.color }}
                        ></div>
                        {s.name} <span className="text-zinc-500 ml-1">({s.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-zinc-600 text-xs font-medium">
                  Add games to your library to see stats.
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center min-h-45 h-full">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-6 text-center">
                Top Platforms
              </h3>

              {libStats.platformData.length > 0 ? (
                <div className="space-y-4">
                  {(isPlatformsExpanded
                    ? libStats.platformData
                    : libStats.platformData.slice(0, 3)
                  ).map((p, index) => (
                    <div key={p.name} className="relative">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5 z-10 relative">
                        <span className="truncate pr-2">{p.name}</span>
                        <span className="text-indigo-400">{p.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{
                            width: `${(p.count / libStats.maxPlatform) * 100}%`,
                            opacity: 1 - index * 0.1,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  {libStats.platformData.length > 3 && (
                    <button
                      onClick={() => setIsPlatformsExpanded(!isPlatformsExpanded)}
                      className="w-full pt-2 flex items-center justify-center text-[10px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors"
                    >
                      {isPlatformsExpanded ? '▲ Show Less' : '▼ Show More'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-wider">
                  No platform data available yet.
                </div>
              )}
            </div>
          </div>

          {libStats.favorites.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 border-l-2 border-yellow-500 pl-3">
                Masterpieces
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {libStats.favorites.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleGameClick(game)}
                    className="cursor-pointer rounded-xl overflow-hidden border border-zinc-800 relative group"
                  >
                    {game.cover?.url ? (
                      <img
                        src={game.cover.url.replace('t_thumb', 't_cover_big')}
                        alt={game.name}
                        className="w-full aspect-3/4 object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full aspect-3/4 bg-zinc-800 transition-transform group-hover:scale-105"></div>
                    )}
                    <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-white text-xs font-bold line-clamp-2">
                        {game.name || game.game_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex gap-4 border-b border-zinc-800 mb-6 mt-8 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setViewMode('activity')}
                className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${viewMode === 'activity' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Feed Activity
              </button>
              <button
                onClick={() => setViewMode('library')}
                className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${viewMode === 'library' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Game Collection
              </button>
              <button
                onClick={() => setViewMode('lists')}
                className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors ${viewMode === 'lists' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Custom Lists ({lists.length})
              </button>
            </div>

            {viewMode === 'activity' && (
              <div>
                {myPosts.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm font-medium">
                    No activity yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {myPosts.map((post) => {
                      const isSpoiler = post.has_spoilers && !revealedSpoilers[post.id]

                      return (
                        <div
                          key={post.id}
                          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative"
                        >
                          {isCurrentUser && (
                            <button
                              onClick={() => deletePost(post.id)}
                              className="absolute top-4 right-4 text-zinc-600 hover:text-rose-500 transition-colors"
                              title="Delete Post"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}

                          {post.game_name && (
                            <div className="text-xs font-bold text-indigo-400 mb-2">
                              {post.game_name}
                            </div>
                          )}

                          {isSpoiler ? (
                            <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-6 text-center my-3 backdrop-blur-sm">
                              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                              <h4 className="text-amber-500 font-bold text-sm mb-2">
                                Spoiler Warning
                              </h4>
                              <p className="text-zinc-400 text-xs mb-4">
                                This post contains story spoilers.
                              </p>
                              <button
                                onClick={() =>
                                  setRevealedSpoilers((prev) => ({ ...prev, [post.id]: true }))
                                }
                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                              >
                                Reveal Spoiler
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                                {post.content}
                              </p>
                              {post.image_url && (
                                <img
                                  src={post.image_url}
                                  className="mt-3 rounded-xl border border-zinc-800 w-full max-h-64 object-cover"
                                />
                              )}
                            </>
                          )}

                          <div className="text-xs font-medium text-zinc-600 mt-4">
                            {new Date(post.created_at).toLocaleString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'library' && (
              <div className="space-y-6">
                {userLibrary.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 justify-between items-center">
                    <div className="flex gap-3 w-full sm:w-auto">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition-colors cursor-pointer flex-1 sm:flex-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="playing">Playing</option>
                        <option value="backlog">Backlog</option>
                        <option value="completed">Completed</option>
                        <option value="100_percent">100%</option>
                        <option value="dropped">Dropped</option>
                      </select>

                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition-colors cursor-pointer flex-1 sm:flex-none"
                      >
                        <option value="recent">Recently Added</option>
                        <option value="rating">Highest Rating</option>
                        <option value="name">Name (A-Z)</option>
                      </select>
                    </div>
                    <div className="text-xs font-bold text-zinc-500">
                      Showing {filteredAndSortedLibrary.length} games
                    </div>
                  </div>
                )}

                {filteredAndSortedLibrary.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-medium">
                    No games found matching your filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {filteredAndSortedLibrary.map((game) => (
                      <div
                        key={game.id}
                        onClick={() => handleGameClick(game)}
                        className="cursor-pointer bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex flex-col relative group transition-transform hover:scale-105"
                      >
                        <span className="absolute top-3 right-3 z-10 text-[9px] font-black bg-zinc-950/90 text-zinc-300 border border-zinc-800 px-1.5 py-0.5 rounded capitalize">
                          {game.status.replace('_', ' ')}
                        </span>
                        <div className="aspect-3/4 rounded-lg overflow-hidden bg-zinc-950 mb-2">
                          {game.cover?.url ? (
                            <img
                              src={game.cover.url.replace('t_thumb', 't_cover_big')}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex justify-center text-amber-400 text-[10px] mt-auto">
                          {'★'.repeat(game.rating || 0)}
                          {'☆'.repeat(5 - (game.rating || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'lists' && (
              <div className="space-y-4">
                {isCurrentUser && (
                  <div className="mb-6">
                    {!showCreateForm ? (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        + Create Custom List
                      </button>
                    ) : (
                      <form
                        onSubmit={handleCreateList}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 max-w-md"
                      >
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">
                            List Name
                          </label>
                          <input
                            type="text"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="e.g., My Top 10 RPGs"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">
                            Description
                          </label>
                          <textarea
                            value={listDesc}
                            onChange={(e) => setListDesc(e.target.value)}
                            placeholder="Optional details about this collection..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors font-medium resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold hover:text-zinc-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!listName.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors"
                          >
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
                      <div
                        key={list.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-colors hover:border-zinc-700"
                      >
                        <div
                          onClick={() => toggleListExpansion(list.id)}
                          className="p-5 flex justify-between items-center cursor-pointer select-none"
                        >
                          <div>
                            <h3 className="font-bold text-sm text-zinc-100">{list.name}</h3>
                            {list.description && (
                              <p className="text-xs text-zinc-500 font-medium mt-1">
                                {list.description}
                              </p>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isCurrentUser && (
                              <button
                                onClick={() => handleDeleteList(list.id)}
                                className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                            <span className="text-zinc-500 text-xs font-bold">
                              {expandedListId === list.id ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>

                        {expandedListId === list.id && (
                          <div className="border-t border-zinc-800 bg-zinc-950/40 p-5">
                            {listGames.length === 0 ? (
                              <p className="text-xs text-zinc-600 font-medium py-2">
                                This list is empty. You can add games from your library details.
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {listGames.map((g) => (
                                  <div
                                    key={g.id}
                                    className="relative group/game bg-zinc-900 border border-zinc-800/80 rounded-xl p-2 flex flex-col items-center"
                                  >
                                    <div
                                      className="aspect-3/4 w-full rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/40 cursor-pointer"
                                      onClick={() => {
                                        const trackedGame = userLibrary.find(
                                          (libGame) => libGame.igdb_id === g.igdb_id
                                        )
                                        if (trackedGame) {
                                          handleGameClick(trackedGame)
                                        } else {
                                          setSelectedGame({
                                            game: {
                                              id: g.igdb_id,
                                              name: g.game_name,
                                              cover: { url: g.game_cover },
                                            },
                                            userGame: null,
                                          })
                                        }
                                      }}
                                    >
                                      {g.game_cover && (
                                        <img
                                          src={g.game_cover.replace('t_thumb', 't_cover_big')}
                                          alt={g.game_name}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 mt-2 text-center line-clamp-1 px-1 w-full">
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
            )}
          </div>
        </>
      )}

      {selectedGame && (
        <GameModal
          game={selectedGame.game}
          userGame={selectedGame.userGame}
          isReadOnly={!!userId}
          onClose={() => setSelectedGame(null)}
          onRefresh={loadProfile}
        />
      )}

      {followModalData && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
          onClick={() => setFollowModalData(null)}
        >
          <div
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-sm font-bold text-white">{followModalData.title}</h3>
              <button
                onClick={() => setFollowModalData(null)}
                className="text-zinc-500 hover:text-white font-bold"
              >
                ×
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {followModalData.users.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No users found.</div>
              ) : (
                followModalData.users.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setFollowModalData(null)
                      if (onUserClick) onUserClick(u.id)
                    }}
                    className="flex items-center gap-3 p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
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
