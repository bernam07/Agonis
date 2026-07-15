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

import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import SharePostModal from './SharePostModal'
import GameModal from '../game/GameModal'
import { PostSkeleton } from '../common/Skeletons'
import CreatePostForm from './CreatePostForm'
import PostCard from './PostCard'
import ReportModal from '../common/ReportModal'
import { useCurrentUserId } from '../../hooks/useCurrentUserId'
import { useInfiniteScrollTrigger } from '../../hooks/useInfiniteScrollTrigger'
import { useBlockedUsers } from '../../hooks/useBlockedUsers'
import { confirmToast } from '../../lib/confirmToast'

const POSTS_PER_PAGE = 20
const POSTS_QUERY_KEY = ['posts'] as const

async function fetchPostsPage(pageParam: number) {
  const from = pageParam * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id, content, created_at, igdb_id, game_name, game_cover, image_url, has_spoilers,
      profiles!posts_user_id_fkey (id, username, avatar_url, is_premium),
      likes (user_id),
      comments (
        id, content, created_at, user_id,
        profiles!comments_user_id_fkey (id, username, avatar_url)
      )
    `
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return data ?? []
}

export default function Feed({
  library,
  onUserClick,
}: {
  library: any[]
  onUserClick: (id: string) => void
}) {
  const { data: currentUserId } = useCurrentUserId()
  const currentUser = currentUserId ? { id: currentUserId } : null
  const { data: blockedIds = [] } = useBlockedUsers(currentUserId)
  const queryClient = useQueryClient()

  const [reportTarget, setReportTarget] = useState<any>(null)

  const [content, setContent] = useState('')
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

  const {
    data,
    isLoading: loadingPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: POSTS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined),
  })

  const sentinelRef = useInfiniteScrollTrigger(
    () => fetchNextPage(),
    !!hasNextPage && !isFetchingNextPage,
  )

  const posts = (data?.pages.flat() ?? [])
    .filter((post: any) => !blockedIds.includes(post.profiles?.id))
    .map((post: any) => ({
      ...post,
      likesCount: post.likes.length,
      hasLiked: currentUserId ? post.likes.some((like: any) => like.user_id === currentUserId) : false,
      commentsCount: post.comments?.length || 0,
      comments: post.comments || [],
    }))

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not signed in')
      let finalImageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const filePath = `${currentUserId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from('screenshots').upload(filePath, imageFile)
        if (uploadError) throw new Error('Failed to upload image.')
        const { data: publicData } = supabase.storage.from('screenshots').getPublicUrl(filePath)
        finalImageUrl = publicData.publicUrl
      }

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: currentUserId,
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

      if (error) throw error

      if (finalImageUrl && selectedGame) {
        await supabase.from('game_screenshots').insert([
          {
            user_id: currentUserId,
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
            .filter((u: any) => u.id !== currentUserId)
            .map((u: any) => ({
              receiver_id: u.id,
              actor_id: currentUserId,
              type: 'mention',
              post_id: newPost.id,
            }))
          if (mentionNotifs.length > 0) {
            await supabase.from('notifications').insert(mentionNotifs)
          }
        }
      }
    },
    onMutate: () => setUploading(true),
    onSuccess: () => {
      setContent('')
      setSelectedGame(null)
      setShowPicker(false)
      setImageFile(null)
      setHasSpoilers(false)
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create post.')
    },
    onSettled: () => setUploading(false),
  })

  const createPost = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !imageFile) || !currentUserId) return
    createPostMutation.mutate()
  }

  const toggleLike = async (postId: string, authorId: string, hasLiked: boolean) => {
    if (!currentUserId) return

    queryClient.setQueryData(POSTS_QUERY_KEY, (old: any) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page: any[]) =>
          page.map((post: any) =>
            post.id === postId
              ? {
                  ...post,
                  likes: hasLiked
                    ? post.likes.filter((l: any) => l.user_id !== currentUserId)
                    : [...post.likes, { user_id: currentUserId }],
                }
              : post,
          ),
        ),
      }
    })

    if (hasLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUserId })
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId })

      if (currentUserId !== authorId) {
        await supabase.from('notifications').insert({
          receiver_id: authorId,
          actor_id: currentUserId,
          type: 'like',
          post_id: postId,
        })
      }
    }
  }

  const performDeletePost = async (postId: string) => {
    queryClient.setQueryData(POSTS_QUERY_KEY, (old: any) => {
      if (!old) return old
      return { ...old, pages: old.pages.map((page: any[]) => page.filter((p) => p.id !== postId)) }
    })
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      toast.error('Failed to delete post.')
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY })
    } else {
      toast.success('Post deleted.')
    }
  }

  const deletePost = (postId: string) => {
    confirmToast('Delete this post?', () => performDeletePost(postId))
  }

  const performDeleteComment = async (commentId: string, postId: string) => {
    queryClient.setQueryData(POSTS_QUERY_KEY, (old: any) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page: any[]) =>
          page.map((post: any) =>
            post.id === postId
              ? { ...post, comments: post.comments.filter((c: any) => c.id !== commentId) }
              : post,
          ),
        ),
      }
    })

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      toast.error('Error deleting comment. It will reappear.')
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY })
    }
  }

  const deleteComment = (commentId: string, postId: string) => {
    confirmToast('Delete this comment?', () => performDeleteComment(commentId, postId))
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

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, postAuthorId, commentText }: { postId: string; postAuthorId: string; commentText: string }) => {
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: currentUserId, content: commentText }])
        .select()
        .single()
      if (error) throw error

      if (currentUserId !== postAuthorId) {
        await supabase.from('notifications').insert([
          { receiver_id: postAuthorId, actor_id: currentUserId, type: 'comment', post_id: postId },
        ])
      }

      const matches = [...commentText.matchAll(/@(\w+)/g)].map((m) => m[1])
      if (matches.length > 0) {
        const { data: users } = await supabase.from('profiles').select('id').in('username', matches)
        if (users) {
          const mentionNotifs = users
            .filter((u: any) => u.id !== currentUserId && u.id !== postAuthorId)
            .map((u: any) => ({ receiver_id: u.id, actor_id: currentUserId, type: 'mention', post_id: postId }))
          if (mentionNotifs.length > 0) {
            await supabase.from('notifications').insert(mentionNotifs)
          }
        }
      }

      return newComment
    },
    onSuccess: (_data, { postId }) => {
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY })
    },
    onError: () => toast.error('Failed to add comment.'),
  })

  const handleAddComment = (e: React.FormEvent, postId: string, postAuthorId: string) => {
    e.preventDefault()
    const commentText = commentInputs[postId]?.trim()
    if (!commentText || !currentUserId) return
    addCommentMutation.mutate({ postId, postAuthorId, commentText })
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
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
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
        loading={createPostMutation.isPending} uploading={uploading} createPost={createPost}
      />

      <div className="flex flex-col gap-5">
        {loadingPosts ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-zinc-500 font-medium">
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
              onReportPost={setReportTarget}
            />
          ))
        )}
      </div>

      {!loadingPosts && posts.length > 0 && (
        <div ref={sentinelRef} className="flex justify-center mt-6 mb-8 h-8">
          {isFetchingNextPage && (
            <span className="text-zinc-500 text-sm font-bold animate-pulse">Loading more...</span>
          )}
        </div>
      )}

      {postToShare && <SharePostModal post={postToShare} onClose={() => setPostToShare(null)} />}

      {reportTarget && currentUserId && (
        <ReportModal
          targetType="post"
          targetId={reportTarget.id}
          reporterId={currentUserId}
          onClose={() => setReportTarget(null)}
        />
      )}

      {activeModalGame && (
        <GameModal
          game={activeModalGame.game}
          userGame={activeModalGame.userGame}
          onClose={() => setActiveModalGame(null)}
        />
      )}
    </div>
  )
}
