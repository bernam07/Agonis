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

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchPosts()
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        profiles (username, avatar_url)
      `)
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
  }

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !currentUser) return
    
    setLoading(true)
    await supabase.from('posts').insert([{
      user_id: currentUser.id,
      content: content.trim()
    }])
    
    setContent('')
    setLoading(false)
    fetchPosts()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <form onSubmit={createPost} className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you playing right now?"
            rows={3}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 outline-none resize-none text-lg"
          />
          <div className="flex justify-end pt-3 border-t border-zinc-800">
            <button 
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded-full transition-colors disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-colors hover:border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                {post.profiles?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-zinc-100">@{post.profiles?.username}</div>
                <div className="text-xs text-zinc-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No posts yet. Be the first to start a conversation!
          </div>
        )}
      </div>
    </div>
  )
}