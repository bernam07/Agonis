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
import SharePostModal from './SharePostModal'
import GameModal from '../game/GameModal'
import { PostSkeleton } from '../common/Skeletons'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function Feed({
  library,
  onUserClick,
  onRefreshLibrary,
}: {
  library: any[]
  onUserClick: (id: string) => void
  onRefreshLibrary: () => void
}) {
  const [posts, setPosts] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [showPicker, setShowPicker] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [postToShare, setPostToShare] = useState<any>(null)
  const [activeModalGame, setActiveModalGame] = useState<any>(null)

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  const [hasSpoilers, setHasSpoilers] = useState(false)
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({})

  const [loadingPosts, setLoadingPosts] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const POSTS_PER_PAGE = 10

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }:any) => {
      setCurrentUser(user)
      fetchPosts(user?.id)
    })
  }, [])

  const fetchPosts = async (userId: string | undefined, pageNum = 0) => {
    if (pageNum === 0) setLoadingPosts(true)
    else setLoadingMore(true)

    const from = pageNum * POSTS_PER_PAGE
    const to = from + POSTS_PER_PAGE - 1

    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        id, content, created_at, igdb_id, game_name, game_cover, image_url, has_spoilers,
        profiles!posts_user_id_fkey (id, username, avatar_url),
        likes (user_id),
        comments (
          id, content, created_at, user_id,
          profiles!comments_user_id_fkey (id, username, avatar_url)
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error(error)
      setLoadingPosts(false)
      setLoadingMore(false)
      return
    }

    if (data) {
      const processedPosts = data.map((post:any) => ({
        ...post,
        likesCount: post.likes.length,
        hasLiked: userId ? post.likes.some((like: any) => like.user_id === userId) : false,
        commentsCount: post.comments?.length || 0,
        comments: post.comments || [],
      }))

      if (pageNum === 0) {
        setPosts(processedPosts)
      } else {
        setPosts((prev) => [...prev, ...processedPosts])
      }

      setHasMore(data.length === POSTS_PER_PAGE)
      setPage(pageNum)
    }

    setLoadingPosts(false)
    setLoadingMore(false)
  }

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !imageFile) || !currentUser) return

    setLoading(true)
    setUploading(true)

    let finalImageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, imageFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('screenshots').getPublicUrl(filePath)
        finalImageUrl = data.publicUrl
      } else {
        alert('Failed to upload image.')
        setLoading(false)
        setUploading(false)
        return
      }
    }

    const { data: newPost } = await supabase
      .from('posts')
      .insert([
        {
          user_id: currentUser.id,
          content: content.trim(),
          igdb_id: selectedGame?.igdb_id || selectedGame?.id || null,
          game_name: selectedGame?.name || null,
          game_cover: selectedGame?.cover?.url || null,
          image_url: finalImageUrl,
          has_spoilers: hasSpoilers,
        },
      ])
      .select()
      .single()

    if (newPost) {
      if (finalImageUrl && selectedGame) {
        await supabase.from('game_screenshots').insert([
          {
            user_id: currentUser.id,
            igdb_id: selectedGame.igdb_id || selectedGame.id,
            url: finalImageUrl,
          },
        ])
      }

      const matches = [...content.trim().matchAll(/@(\w+)/g)].map((m) => m[1])
      if (matches.length > 0) {
        const { data: users } = await supabase.from('profiles').select('id').in('username', matches)
        if (users) {
          const mentionNotifs = users
            .filter((u:any) => u.id !== currentUser.id)
            .map((u:any) => ({
              receiver_id: u.id,
              actor_id: currentUser.id,
              type: 'mention',
              post_id: newPost.id,
            }))
          if (mentionNotifs.length > 0) {
            await supabase.from('notifications').insert(mentionNotifs)
          }
        }
      }
    }

    setContent('')
    setSelectedGame(null)
    setShowPicker(false)
    setImageFile(null)
    setHasSpoilers(false)
    setLoading(false)
    setUploading(false)
    fetchPosts(currentUser.id)
  }

  const toggleLike = async (postId: string, authorId: string, hasLiked: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
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
          post_id: postId,
        })
      }
    }

    fetchPosts(user.id)
  }

  const deletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    if (currentUser) fetchPosts(currentUser.id)
  }

  const handleGameClick = (post: any) => {
    const trackedGame = library.find((g) => (g.igdb_id || g.id) === post.igdb_id)

    setActiveModalGame({
      game: {
        id: post.igdb_id,
        name: post.game_name,
        cover: { url: post.game_cover },
      },
      userGame: trackedGame || null,
    })
  }

  const handleAddComment = async (e: React.FormEvent, postId: string, postAuthorId: string) => {
    e.preventDefault()
    const commentText = commentInputs[postId]?.trim()
    if (!commentText || !currentUser) return

    const { data: newComment } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: currentUser.id,
          content: commentText,
        },
      ])
      .select()
      .single()

    if (newComment) {
      if (currentUser.id !== postAuthorId) {
        await supabase.from('notifications').insert([
          {
            receiver_id: postAuthorId,
            actor_id: currentUser.id,
            type: 'comment',
            post_id: postId,
          },
        ])
      }

      const matches = [...commentText.matchAll(/@(\w+)/g)].map((m) => m[1])
      if (matches.length > 0) {
        const { data: users } = await supabase.from('profiles').select('id').in('username', matches)
        if (users) {
          const mentionNotifs = users
            .filter((u:any) => u.id !== currentUser.id && u.id !== postAuthorId)
            .map((u:any) => ({
              receiver_id: u.id,
              actor_id: currentUser.id,
              type: 'mention',
              post_id: postId,
            }))
          if (mentionNotifs.length > 0) {
            await supabase.from('notifications').insert(mentionNotifs)
          }
        }
      }

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
      fetchPosts(currentUser.id)
    }
  }

  const toggleCommentsVisibility = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }

  const handleMentionClick = async (mentionStr: string) => {
    const username = mentionStr.replace('@', '')
    const { data } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (data) {
      onUserClick(data.id)
    }
  }

  const renderContent = (text: string) => {
    if (!text) return null
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              handleMentionClick(part)
            }}
            className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
        <form onSubmit={createPost} className="flex flex-col gap-3">
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSpoilers}
              onChange={(e) => setHasSpoilers(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
            <span className="text-xs font-bold text-amber-500">Mark as Spoiler</span>
          </label>
          {selectedGame && (
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-2 rounded-xl w-max pr-4">
              {selectedGame.cover?.url && (
                <img
                  src={selectedGame.cover.url.replace('t_thumb', 't_cover_small')}
                  alt={selectedGame.name}
                  className="w-8 h-10 object-cover rounded-md"
                />
              )}
              <span className="text-xs font-bold text-zinc-300">{selectedGame.name}</span>
              <button
                type="button"
                onClick={() => setSelectedGame(null)}
                className="ml-2 text-zinc-500 hover:text-rose-500 font-bold px-2"
              >
                ×
              </button>
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you playing? Share your thoughts or screenshots..."
            rows={3}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 outline-none resize-none text-sm font-medium mt-1"
          />

          {imageFile && (
            <div className="relative inline-block w-max mt-2">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="h-32 rounded-lg border border-zinc-800 object-cover"
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {showPicker && (
            <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              {library.length === 0 ? (
                <p className="text-zinc-500 text-xs font-medium text-center py-4">
                  Add games to your library first to tag them!
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {library.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setSelectedGame(game)
                        setShowPicker(false)
                      }}
                      className="shrink-0 w-16 group flex flex-col items-center"
                    >
                      <div className="w-14 h-20 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800 group-hover:border-indigo-500 transition-colors">
                        {game.cover?.url && (
                          <img
                            src={game.cover.url.replace('t_thumb', 't_cover_small')}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 mt-2 truncate w-full text-center group-hover:text-zinc-300">
                        {game.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50 mt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  showPicker
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                + Tag Game
              </button>

              <label className="text-xs font-bold text-zinc-400 hover:text-indigo-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-indigo-500 transition-colors cursor-pointer flex items-center gap-2">
                Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || uploading || (!content.trim() && !imageFile)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {uploading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-5">
        {loadingPosts ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500 font-medium">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          posts.map((post) => {
            const isSpoiler = post.has_spoilers && !revealedSpoilers[post.id]

            return (
              <div
                key={post.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 transition-colors hover:border-zinc-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    onClick={() => onUserClick(post.profiles.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-zinc-400 overflow-hidden group-hover:border-indigo-500 transition-colors">
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        post.profiles?.username?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-100 text-sm group-hover:text-indigo-400 transition-colors">
                        @{post.profiles?.username || 'unknown'}
                      </div>
                      <div className="text-xs font-medium text-zinc-500">
                        {new Date(post.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </div>

                  {currentUser?.id === post.profiles.id && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                      title="Delete Post"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {post.game_name && (
                  <div
                    onClick={() => handleGameClick(post)}
                    className="flex items-center gap-3 bg-zinc-950 border border-zinc-800/50 p-2 rounded-xl mb-4 max-w-full pr-4 cursor-pointer hover:border-indigo-500 transition-colors group/game"
                  >
                    {post.game_cover && (
                      <img
                        src={post.game_cover.replace('t_thumb', 't_cover_small')}
                        alt={post.game_name}
                        className="w-8 h-10 object-cover rounded-md shrink-0"
                      />
                    )}
                    <span className="text-xs font-bold text-indigo-400 group-hover/game:text-indigo-300 transition-colors truncate min-w-0">
                      {post.game_name}
                    </span>
                  </div>
                )}

                {isSpoiler ? (
                  <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-6 text-center my-3 backdrop-blur-sm">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-amber-500 font-bold text-sm mb-2">Spoiler Warning</h4>
                    <p className="text-zinc-400 text-xs mb-4">This post contains story spoilers.</p>
                    <button
                      onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [post.id]: true }))}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Reveal Spoiler
                    </button>
                  </div>
                ) : (
                  <>
                    {post.content && (
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium mb-4">
                        {renderContent(post.content)}
                      </p>
                    )}

                    {post.image_url && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-zinc-800/50">
                        <img
                          src={post.image_url}
                          alt="Post attachment"
                          className="w-full max-h-96 object-cover"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post.id, post.profiles.id, post.hasLiked)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        post.hasLiked
                          ? 'text-rose-500 hover:text-rose-400'
                          : 'text-zinc-500 hover:text-rose-400'
                      }`}
                    >
                      <span className="text-lg leading-none">{post.hasLiked ? '♥' : '♡'}</span>
                      <span>
                        {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
                      </span>
                    </button>

                    <button
                      onClick={() => toggleCommentsVisibility(post.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-indigo-400 transition-colors"
                    >
                      <span className="text-base leading-none"></span>
                      <span>
                        {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => setPostToShare(post)}
                    className="text-xs font-bold text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                  >
                    ➦ Share
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="mt-5 pt-4 border-t border-zinc-800/50 space-y-4">
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {post.comments.length === 0 ? (
                        <p className="text-xs text-zinc-500 font-medium text-center py-2">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        post.comments.map((comment: any) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 items-start bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/30"
                          >
                            <div
                              className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden shrink-0 cursor-pointer"
                              onClick={() => onUserClick(comment.profiles.id)}
                            >
                              {comment.profiles?.avatar_url ? (
                                <img
                                  src={comment.profiles.avatar_url}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                  {comment.profiles?.username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className="text-xs font-bold text-zinc-200 cursor-pointer hover:text-indigo-400 transition-colors"
                                  onClick={() => onUserClick(comment.profiles.id)}
                                >
                                  @{comment.profiles?.username}
                                </span>
                                <span className="text-[9px] text-zinc-600 font-medium">
                                  {new Date(comment.created_at).toLocaleDateString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 mt-0.5 whitespace-pre-wrap font-medium">
                                {renderContent(comment.content)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={(e) => handleAddComment(e, post.id, post.profiles.id)}
                      className="flex gap-2 mt-2"
                    >
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Write a comment... (use @username to mention)"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors font-medium"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                      >
                        Reply
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {hasMore && !loadingPosts && posts.length > 0 && (
        <div className="flex justify-center mt-6 mb-8">
          <button
            onClick={() => fetchPosts(currentUser?.id, page + 1)}
            disabled={loadingMore}
            className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500 text-zinc-300 font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {loadingMore ? 'Loading more...' : '↓ Load More'}
          </button>
        </div>
      )}

      {postToShare && <SharePostModal post={postToShare} onClose={() => setPostToShare(null)} />}

      {activeModalGame && (
        <GameModal
          game={activeModalGame.game}
          userGame={activeModalGame.userGame}
          onClose={() => setActiveModalGame(null)}
          onRefresh={() => {
            fetchPosts(currentUser?.id)
            onRefreshLibrary()
          }}
        />
      )}
    </div>
  )
}
