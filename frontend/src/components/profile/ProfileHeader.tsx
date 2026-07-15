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

import { Ban, Flag } from 'lucide-react'
import PremiumUsername from '../common/PremiumUsername'

interface ProfileHeaderProps {
  profile: any;
  isCurrentUser: boolean;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isRequested: boolean;
  toggleFollow: () => void;
  openFollowList: (type: 'followers' | 'following') => void;
  canViewLibrary: boolean;
  onBack?: () => void;
  userId?: string | null;
  isBlocked: boolean;
  onToggleBlock: () => void;
  onReportUser: () => void;
}

export default function ProfileHeader({
  profile, isCurrentUser, isEditing, setIsEditing,
  followersCount, followingCount, isFollowing, isRequested,
  toggleFollow, openFollowList, canViewLibrary,
  onBack, userId, isBlocked, onToggleBlock, onReportUser
}: ProfileHeaderProps) {

  // O formulário de edição fica no componente pai por agora para não complicar a gestão de estado
  if (isEditing) return null;

  return (
    <>
      {!isCurrentUser && userId && (
        <div>
          <button onClick={onBack} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
            ← Back to Feed
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        {profile.is_premium && profile.accent_color && (
          <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: profile.accent_color }} />
        )}
        <div className="w-32 h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-zinc-50 dark:border-zinc-950 flex items-center justify-center text-5xl font-black text-zinc-500 overflow-hidden shrink-0 shadow-xl">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            profile.username?.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <PremiumUsername
                username={profile.username}
                isPremium={profile.is_premium}
                accentColor={profile.accent_color}
                iconClassName="w-5 h-5"
              />
            </h2>
            {isCurrentUser ? (
              <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
                Settings
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!isBlocked && (
                  <button onClick={toggleFollow} className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${isFollowing || isRequested ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-rose-500 hover:text-white' : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}>
                    {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
                  </button>
                )}
                <button
                  onClick={onToggleBlock}
                  title={isBlocked ? 'Unblock' : 'Block'}
                  className={`p-2 rounded-lg border transition-colors ${isBlocked ? 'border-rose-500 text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 hover:border-rose-500'}`}
                >
                  <Ban className="w-4 h-4" />
                </button>
                <button
                  onClick={onReportUser}
                  title="Report User"
                  className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 hover:border-rose-500 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-5 justify-center md:justify-start mb-4 text-sm">
            <button onClick={() => openFollowList('followers')} className={`flex gap-1 ${canViewLibrary ? 'hover:opacity-80' : 'cursor-default'}`}>
              <span className="font-bold text-zinc-900 dark:text-white">{followersCount}</span> <span className="text-zinc-600 dark:text-zinc-400">followers</span>
            </button>
            <button onClick={() => openFollowList('following')} className={`flex gap-1 ${canViewLibrary ? 'hover:opacity-80' : 'cursor-default'}`}>
              <span className="font-bold text-zinc-900 dark:text-white">{followingCount}</span> <span className="text-zinc-600 dark:text-zinc-400">following</span>
            </button>
          </div>

          {profile.bio && (
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed max-w-2xl bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 mb-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </>
  )
}