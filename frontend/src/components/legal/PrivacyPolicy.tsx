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

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 text-zinc-700 dark:text-zinc-300 leading-relaxed">
      <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        Privacy Policy
      </h2>

      <div className="space-y-6 text-sm font-medium">
        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">1. Information We Collect</h3>
          <p>
            When you create an account on Agonis, we collect your email address and a securely
            encrypted password. You may optionally provide a username, profile picture (avatar), and
            biography. We also store the data you actively create, such as your game library,
            ratings, reviews, and posts on the feed.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">2. How We Use Your Information</h3>
          <p>
            Your information is used solely to provide and improve the Agonis experience. Your
            username, avatar, public library (if enabled), and feed posts are visible to other users
            to foster community interaction. Your email address is strictly used for authentication
            and account recovery, and is never shared publicly.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">3. Third-Party Services</h3>
          <p>
            Agonis uses <strong>Supabase</strong> for secure database hosting and authentication.
            Game information, artwork, and search capabilities are provided by the{' '}
            <strong>IGDB API</strong> (Twitch). We do not sell your personal data to these or any
            other third parties.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">4. Your Data Rights (GDPR)</h3>
          <p>
            You have full control over your data. You can edit your profile, set your game
            collection to private, or delete individual games and posts at any time. If you wish to
            permanently delete your account and all associated data, you can do so by contacting us,
            and we will process the deletion immediately.
          </p>
        </section>
      </div>
    </div>
  )
}
