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

export default function Profile({ library }: { library: any[] }) {
  const [profile, setProfile] = useState<any>(null)
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Ir buscar os dados de perfil (username, data de registo)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileData) {
      setProfile(profileData)
      setEditUsername(profileData.username || '')
    }

    // 2. Ir buscar os posts deste utilizador
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (postsData) setMyPosts(postsData)
  }

  const saveProfile = async () => {
    if (!editUsername.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ username: editUsername.trim() }).eq('id', user.id)
      setProfile({ ...profile, username: editUsername.trim() })
      setIsEditing(false)
    }
  }

  // Lógica de Estatísticas adaptada para o novo design
  const stats = useMemo(() => {
    const total = library.length
    const completed = library.filter(g => g.status === 'completed' || g.status === '100_percent').length
    const backlog = library.filter(g => g.status === 'backlog').length
    
    const ratedGames = library.filter(g => g.rating && g.rating > 0)
    const averageRating = ratedGames.length 
      ? (ratedGames.reduce((acc, g) => acc + g.rating, 0) / ratedGames.length).toFixed(1)
      : '0.0'

    const favorites = library.filter(g => g.rating === 5)

    return { total, completed, backlog, averageRating, favorites }
  }, [library])

  if (!profile) return <div className="text-zinc-500 text-center py-10 font-medium">Loading profile...</div>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      
      {/* HEADER: Avatar e Username */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-indigo-900/20">
          {profile.username?.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          {isEditing ? (
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <input 
                type="text" 
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-1 outline-none focus:border-indigo-500"
              />
              <button onClick={saveProfile} className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-sm bg-zinc-800 text-zinc-300 hover:text-white px-4 py-1.5 rounded-lg font-bold transition-colors">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
              <h2 className="text-3xl font-black text-white">@{profile.username}</h2>
              <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-md transition-colors">Edit</button>
            </div>
          )}
          <p className="text-zinc-500 text-sm font-medium">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-zinc-500 font-semibold mb-1 text-sm">Total Games</span>
          <span className="text-4xl font-black text-white">{stats.total}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-zinc-500 font-semibold mb-1 text-sm">Completed</span>
          <span className="text-4xl font-black text-emerald-400">{stats.completed}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-zinc-500 font-semibold mb-1 text-sm">Backlog</span>
          <span className="text-4xl font-black text-amber-400">{stats.backlog}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-zinc-500 font-semibold mb-1 text-sm">Avg Rating</span>
          <span className="text-4xl font-black text-yellow-500 flex items-center gap-1">
            {stats.averageRating} <span className="text-2xl pb-1">★</span>
          </span>
        </div>
      </div>

      {/* MASTERPIECES (Favoritos) */}
      {stats.favorites.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-zinc-100 mb-4 border-l-4 border-yellow-500 pl-3">Masterpieces</h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {stats.favorites.map(game => (
              <div key={game.id} className="relative rounded-xl overflow-hidden border border-zinc-800 group">
                {game.cover?.url ? (
                  <img src={game.cover.url.replace('t_thumb', 't_cover_big')} alt={game.name} className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full aspect-[3/4] bg-zinc-800"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                  <span className="text-white text-xs font-bold line-clamp-2">{game.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTÓRICO DE POSTS */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-4 border-l-4 border-indigo-500 pl-3">My Feed Activity</h3>
        {myPosts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 font-medium">
            You haven't posted anything yet. Head to the Feed to start a conversation!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myPosts.map(post => (
              <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                <div className="text-xs font-medium text-zinc-500 mt-4">{new Date(post.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}