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

export const FREE_LIST_LIMIT = 3
export const PREMIUM_PRICE = '€3'

export interface PlanFeature {
  label: string
  free: string
  premium: string
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Game tracking, reviews & social feed', free: 'Included', premium: 'Included' },
  { label: 'Custom lists', free: `Up to ${FREE_LIST_LIMIT}`, premium: 'Unlimited' },
  { label: 'Share card watermark', free: 'Agonis branding', premium: 'Removed' },
  { label: 'Profile accent color', free: 'Default only', premium: 'Custom' },
  { label: 'Advanced stats & insights', free: 'Not available', premium: 'Included' },
  { label: 'Auto-import from Steam', free: 'Not available', premium: 'Included' },
]

export const ACCENT_COLORS = [
  '#6366f1', // indigo (default)
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
]
