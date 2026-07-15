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

import { Crown } from 'lucide-react'

interface PremiumUsernameProps {
  username?: string | null;
  isPremium?: boolean | null;
  accentColor?: string | null;
  className?: string;
  iconClassName?: string;
}

export default function PremiumUsername({
  username, isPremium, accentColor, className = '', iconClassName = 'w-3.5 h-3.5',
}: PremiumUsernameProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      style={isPremium && accentColor ? { color: accentColor } : undefined}
    >
      @{username || 'unknown'}
      {isPremium && <Crown className={`text-amber-500 shrink-0 ${iconClassName}`} aria-label="Premium member" />}
    </span>
  )
}
