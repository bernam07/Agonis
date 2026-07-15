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

import { Trash2, AlertTriangle, Flag } from 'lucide-react'
import PostComments from './PostComments'
import PremiumUsername from '../common/PremiumUsername'

interface PostCardProps {
  post: any;
  currentUser: any;
  isExpanded: boolean;
  isRevealed: boolean;
  onUserClick: (id: string) => void;
  deletePost: (postId: string) => void;
  handleGameClick: (post: any) => void;
  toggleLike: (postId: string, authorId: string, hasLiked: boolean) => void;
  toggleCommentsVisibility: (postId: string) => void;
  revealSpoiler: (postId: string) => void;
  setPostToShare: (post: any) => void;
  deleteComment: (commentId: string, postId: string) => void;
  commentInputs: Record<string, string>;
  setCommentInputs: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  handleAddComment: (e: React.FormEvent, postId: string, postAuthorId: string) => void;
  renderContent: (text: string) => React.ReactNode;
  onReportPost: (post: any) => void;
}

export default function PostCard({
  post, currentUser, isExpanded, isRevealed, onUserClick, deletePost, handleGameClick,
  toggleLike, toggleCommentsVisibility, revealSpoiler, setPostToShare,
  deleteComment, commentInputs, setCommentInputs, handleAddComment, renderContent, onReportPost
}: PostCardProps) {
  const isSpoiler = post.has_spoilers && !isRevealed

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex justify-between items-start mb-4">
        <div
          onClick={() => onUserClick(post.profiles.id)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-black text-zinc-600 dark:text-zinc-400 overflow-hidden group-hover:border-indigo-500 transition-colors">
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
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <PremiumUsername
                username={post.profiles?.username}
                isPremium={post.profiles?.is_premium}
                accentColor={post.profiles?.accent_color}
              />
            </div>
            <div className="text-xs font-medium text-zinc-500">
              {new Date(post.created_at).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          </div>
        </div>

        {currentUser?.id === post.profiles.id ? (
          <button
            onClick={() => deletePost(post.id)}
            className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
            title="Delete Post"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => onReportPost(post)}
            className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
            title="Report Post"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      {post.game_name && (
        <div
          onClick={() => handleGameClick(post)}
          className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-2 rounded-xl mb-4 max-w-full pr-4 cursor-pointer hover:border-indigo-500 transition-colors group/game"
        >
          {post.game_cover && (
            <img
              src={post.game_cover.replace('t_thumb', 't_cover_small')}
              alt={post.game_name}
              className="w-8 h-10 object-cover rounded-md shrink-0"
            />
          )}
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover/game:text-indigo-500 dark:group-hover/game:text-indigo-300 transition-colors truncate min-w-0">
            {post.game_name}
          </span>
        </div>
      )}

      {isSpoiler ? (
        <div className="bg-zinc-100/80 dark:bg-zinc-950/80 border border-amber-500/30 rounded-xl p-6 text-center my-3 backdrop-blur-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="text-amber-600 dark:text-amber-500 font-bold text-sm mb-2">Spoiler Warning</h4>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-4">This post contains story spoilers.</p>
          <button
            onClick={() => revealSpoiler(post.id)}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            Reveal Spoiler
          </button>
        </div>
      ) : (
        <>
          {post.content && (
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium mb-4">
              {renderContent(post.content)}
            </p>
          )}

          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
              <img
                src={post.image_url}
                alt="Post attachment"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
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
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="text-base leading-none"></span>
            <span>
              {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>
        </div>

        <button
          onClick={() => setPostToShare(post)}
          className="text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
        >
          ➦ Share
        </button>
      </div>

      {isExpanded && (
        <PostComments
          post={post}
          currentUser={currentUser}
          onUserClick={onUserClick}
          deleteComment={deleteComment}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          handleAddComment={handleAddComment}
          renderContent={renderContent}
        />
      )}
    </div>
  )
}
