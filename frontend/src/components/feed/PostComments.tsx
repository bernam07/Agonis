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

import { Trash2 } from 'lucide-react'
import PremiumUsername from '../common/PremiumUsername'

interface PostCommentsProps {
  post: any;
  currentUser: any;
  onUserClick: (id: string) => void;
  deleteComment: (commentId: string, postId: string) => void;
  commentInputs: Record<string, string>;
  setCommentInputs: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  handleAddComment: (e: React.FormEvent, postId: string, postAuthorId: string) => void;
  renderContent: (text: string) => React.ReactNode;
}

export default function PostComments({
  post, currentUser, onUserClick, deleteComment,
  commentInputs, setCommentInputs, handleAddComment, renderContent
}: PostCommentsProps) {

  return (
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
              className="flex gap-3 items-start bg-zinc-100 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/30"
            >
              <div
                className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-800 overflow-hidden shrink-0 cursor-pointer"
                onClick={() => onUserClick(comment.profiles.id)}
              >
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                    {comment.profiles?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-xs font-bold text-zinc-900 dark:text-zinc-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => onUserClick(comment.profiles.id)}
                    >
                      <PremiumUsername
                        username={comment.profiles?.username}
                        isPremium={comment.profiles?.is_premium}
                        accentColor={comment.profiles?.accent_color}
                        iconClassName="w-3 h-3"
                      />
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-600 font-medium">
                      {new Date(comment.created_at).toLocaleDateString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {currentUser?.id === comment.user_id && (
                    <button
                      onClick={() => deleteComment(comment.id, post.id)}
                      className="text-zinc-400 hover:text-rose-500 transition-colors p-1 -mt-1 -mr-1"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 whitespace-pre-wrap font-medium">
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
  )
}
