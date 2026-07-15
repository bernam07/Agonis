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
        <p className="text-zinc-500 text-xs">Last updated: 2026</p>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">1. Who Controls Your Data</h3>
          <p>
            Agonis is operated by Bernardo Miguel Fernandes Martins, an individual based in Portugal.
            For any privacy questions or requests, contact{' '}
            <a href="mailto:contact@agonis.xyz" className="text-indigo-600 dark:text-indigo-400 hover:underline">contact@agonis.xyz</a>.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">2. Information We Collect</h3>
          <p className="mb-2">
            <strong>Account data:</strong> your email address and a securely hashed password, plus any
            optional profile info you add — username, avatar, bio, and profile privacy setting.
          </p>
          <p className="mb-2">
            <strong>Content you create:</strong> your game library, ratings, reviews, posts, comments,
            likes, follows, custom lists, and uploaded screenshots.
          </p>
          <p className="mb-2">
            <strong>Optional Premium & Steam data:</strong> if you import your library from Steam, we
            store your Steam ID. If you support Agonis via Ko-fi, we receive your payment email, name,
            and support message from Ko-fi in order to link your payment to your account.
          </p>
          <p>
            <strong>Technical data:</strong> basic device/browser information and error diagnostics
            (via Sentry) if the app crashes, aggregate, non-identifying visit statistics (via Vercel
            Analytics), and bot-detection signals processed by hCaptcha when you sign up or log in.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">3. Why We Process Your Data (Legal Basis)</h3>
          <p className="mb-2">
            <strong>Performance of a contract:</strong> creating your account, storing your library and
            posts, and showing your public profile/feed to other users — this is the core service you
            signed up for.
          </p>
          <p className="mb-2">
            <strong>Legitimate interest:</strong> fraud/abuse prevention (hCaptcha), keeping the service
            running without crashing (Sentry error tracking), and understanding aggregate usage to
            improve Agonis (Vercel Analytics). These are kept to the minimum needed and you can object
            at any time (see Section 7).
          </p>
          <p>
            <strong>Consent:</strong> matching an optional Ko-fi payment to your account, which you
            trigger yourself by including your username in the payment message.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">4. How We Use Your Information</h3>
          <p>
            Your username, avatar, public library (if enabled), and feed posts are visible to other
            users to foster community interaction. Your email address is used strictly for
            authentication, account recovery, and essential service emails, and is never shown to other
            users or sold.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">5. Third-Party Processors</h3>
          <p className="mb-2">We share data with the following processors, only as needed to run Agonis:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Supabase</strong> (EU/Ireland-hosted) — database, authentication, file storage.</li>
            <li><strong>IGDB / Twitch</strong> — game data and artwork search (no personal data is sent to them beyond your search terms).</li>
            <li><strong>Steam</strong> — optional library import, using the Steam ID you provide.</li>
            <li><strong>Ko-fi</strong> — payment processing for optional Premium support.</li>
            <li><strong>Sentry</strong> — error/crash tracking, to fix bugs.</li>
            <li><strong>Vercel Analytics</strong> — aggregate, cookie-free visit statistics.</li>
            <li><strong>hCaptcha</strong> — bot and abuse protection on sign-up/login.</li>
          </ul>
          <p className="mt-2">
            Some of these providers are based outside the European Economic Area (EEA), including in
            the United States. Where that's the case, transfers rely on that provider's Standard
            Contractual Clauses or an equivalent safeguard recognized under EU law. We do not sell your
            personal data to anyone.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">6. Cookies & Local Storage</h3>
          <p>
            Agonis stores a theme preference (light/dark) in your browser's local storage, which is
            strictly necessary for the app to function and does not require consent. Sentry and Vercel
            Analytics may set minimal technical identifiers to group errors or visits; neither is used
            for advertising or cross-site tracking.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">7. Your Data Rights (GDPR)</h3>
          <p className="mb-2">If you are in the EEA, UK, or a jurisdiction with similar protections, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Access</strong> a copy of your personal data (see "Export My Data" in your profile settings).</li>
            <li><strong>Rectify</strong> inaccurate data by editing your profile at any time.</li>
            <li><strong>Erase</strong> your account and all associated data (see "Delete Account" in your profile settings).</li>
            <li><strong>Restrict or object to</strong> processing based on legitimate interest.</li>
            <li><strong>Port</strong> your data in a machine-readable format (the export is a JSON file).</li>
            <li><strong>Withdraw consent</strong> at any time where processing is based on consent.</li>
            <li><strong>Lodge a complaint</strong> with your national data protection authority — in Portugal, the{' '}
              <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">CNPD</a>.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">8. Data Retention</h3>
          <p>
            We keep your account data for as long as your account is active. If you delete your
            account, your profile, library, posts, and related content are permanently removed. Records
            required for legal, tax, or fraud-prevention purposes (such as payment records) may be kept
            for a limited period afterward where the law requires it.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">9. Children's Privacy</h3>
          <p>
            Agonis is not directed at children under 16. We do not knowingly collect data from children
            under this age. If you believe a child has created an account, contact us and we will delete it.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">10. Changes to This Policy</h3>
          <p>
            We may update this policy as Agonis evolves. Material changes will be announced in the app,
            and continued use after changes take effect constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  )
}
