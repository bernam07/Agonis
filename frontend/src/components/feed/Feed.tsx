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
import CreatePostForm from './CreatePostForm'
import PostCard from './PostCard'

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

  const deleteComment = async (commentId: string, postId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    setPosts((currentPosts: any[]) => 
      currentPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter((c: any) => c.id !== commentId)
          }
        }
        return post
      })
    )

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      console.error('Erro ao apagar:', error)
      alert('Error deleting comment. It will reappear.')
      fetchPosts(currentUser?.id, 0)
    }
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
      <CreatePostForm
        library={library} content={content} setContent={setContent}
        hasSpoilers={hasSpoilers} setHasSpoilers={setHasSpoilers}
        selectedGame={selectedGame} setSelectedGame={setSelectedGame}
        showPicker={showPicker} setShowPicker={setShowPicker}
        imageFile={imageFile} setImageFile={setImageFile}
        loading={loading} uploading={uploading} createPost={createPost}
      />

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
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              isExpanded={!!expandedComments[post.id]}
              isRevealed={!!revealedSpoilers[post.id]}
              onUserClick={onUserClick}
              deletePost={deletePost}
              handleGameClick={handleGameClick}
              toggleLike={toggleLike}
              toggleCommentsVisibility={toggleCommentsVisibility}
              revealSpoiler={(postId) => setRevealedSpoilers((prev) => ({ ...prev, [postId]: true }))}
              setPostToShare={setPostToShare}
              deleteComment={deleteComment}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
              handleAddComment={handleAddComment}
              renderContent={renderContent}
            />
          ))
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
