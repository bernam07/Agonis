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

export default function Feed({ library, onUserClick }: { library: any[], onUserClick: (id: string) => void }) {
  const [posts, setPosts] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
      fetchPosts(user?.id)
    })
  }, [])

  const fetchPosts = async (userId: string | undefined) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, igdb_id, game_name, game_cover,
        profiles!posts_user_id_fkey (id, username, avatar_url),
        likes (user_id)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("Erro a carregar o Feed:", error)
      return
    }
    
    if (data) {
      const processedPosts = data.map(post => ({
        ...post,
        likesCount: post.likes.length,
        hasLiked: userId ? post.likes.some((like: any) => like.user_id === userId) : false
      }))
      setPosts(processedPosts)
    }
  }

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !currentUser) return
    
    setLoading(true)
    await supabase.from('posts').insert([{
      user_id: currentUser.id,
      content: content.trim(),
      igdb_id: selectedGame?.igdb_id || selectedGame?.id || null,
      game_name: selectedGame?.name || null,
      game_cover: selectedGame?.cover?.url || null
    }])
    
    setContent('')
    setSelectedGame(null)
    setShowPicker(false)
    setLoading(false)
    fetchPosts(currentUser.id)
  }

  const toggleLike = async (postId: string, authorId: string, hasLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (hasLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id })
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
      
      if (user.id !== authorId) {
        await supabase.from('notifications').insert({
          receiver_id: authorId,
          actor_id: user.id,
          type: 'like',
          post_id: postId
        })
      }
    }
    
    fetchPosts(user.id)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* CAIXA DE POST */}
      <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
        <form onSubmit={createPost} className="flex flex-col gap-3">
          {selectedGame && (
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-2 rounded-xl w-max pr-4">
              {selectedGame.cover?.url && <img src={selectedGame.cover.url.replace('t_thumb', 't_cover_small')} alt={selectedGame.name} className="w-8 h-10 object-cover rounded-md" />}
              <span className="text-xs font-bold text-zinc-300">{selectedGame.name}</span>
              <button type="button" onClick={() => setSelectedGame(null)} className="ml-2 text-zinc-500 hover:text-rose-500 font-bold px-2">×</button>
            </div>
          )}
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)} placeholder="What are you playing? Share your thoughts..." rows={3}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 outline-none resize-none text-sm font-medium mt-1"
          />
          {showPicker && (
            <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              {library.length === 0 ? (
                <p className="text-zinc-500 text-xs font-medium text-center py-4">Add games to your library first to tag them!</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {library.map(game => (
                    <button key={game.id} type="button" onClick={() => { setSelectedGame(game); setShowPicker(false); }} className="shrink-0 w-16 group flex flex-col items-center">
                      <div className="w-14 h-20 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800 group-hover:border-indigo-500 transition-colors">
                        {game.cover?.url && <img src={game.cover.url.replace('t_thumb', 't_cover_small')} alt={game.name} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 mt-2 truncate w-full text-center group-hover:text-zinc-300">{game.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50 mt-2">
            <button type="button" onClick={() => setShowPicker(!showPicker)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${showPicker ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'}`}>
              + Tag Game
            </button>
            <button type="submit" disabled={loading || !content.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors disabled:opacity-50">
              Post
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE POSTS */}
      <div className="flex flex-col gap-5">
        {posts.map(post => (
          <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 transition-colors hover:border-zinc-700">
            <div className="flex justify-between items-start mb-4">
              <div 
                onClick={() => onUserClick(post.profiles.id)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-zinc-400 overflow-hidden group-hover:border-indigo-500 transition-colors">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    post.profiles?.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <div className="font-bold text-zinc-100 text-sm group-hover:text-indigo-400 transition-colors">
                    @{post.profiles?.username || 'unknown'}
                  </div>
                  <div className="text-xs font-medium text-zinc-500">
                    {new Date(post.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </div>

            {post.game_name && (
              <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800/50 p-2 rounded-xl mb-4 w-max pr-4">
                {post.game_cover && <img src={post.game_cover.replace('t_thumb', 't_cover_small')} alt={post.game_name} className="w-8 h-10 object-cover rounded-md" />}
                <span className="text-xs font-bold text-indigo-400">{post.game_name}</span>
              </div>
            )}

            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium mb-4">
              {post.content}
            </p>

            {/* BOTÃO DE LIKE */}
            <div className="flex items-center gap-4 pt-3 border-t border-zinc-800/50">
              <button 
                onClick={() => toggleLike(post.id, post.profiles.id, post.hasLiked)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  post.hasLiked ? 'text-rose-500 hover:text-rose-400' : 'text-zinc-500 hover:text-rose-400'
                }`}
              >
                <span className="text-lg leading-none">{post.hasLiked ? '♥' : '♡'}</span>
                <span>{post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}