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

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 text-zinc-700 dark:text-zinc-300 leading-relaxed">
      <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        Terms of Service
      </h2>

      <div className="space-y-6 text-sm font-medium">
        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">1. Acceptance of Terms</h3>
          <p>
            By creating an account or otherwise using Agonis, you agree to be bound by these Terms of
            Service and our Privacy Policy. If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">2. Your Account</h3>
          <p>
            You must provide a valid email address to register and are responsible for keeping your
            login credentials secure. You are responsible for all activity that happens under your
            account. You must be old enough to legally consent to these Terms in your country of
            residence to create an account.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">3. User Content & Conduct</h3>
          <p>
            You retain ownership of the reviews, posts, comments, and images you submit ("User
            Content"), but you grant Agonis a license to host and display that content to other users
            as part of the service. You are solely responsible for the content you post. You agree not
            to post content that is illegal, harassing, hateful, or infringes on someone else's rights,
            and not to use the service to spam or abuse other users. We may remove content or suspend
            accounts that violate these rules, including based on reports submitted by other users.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">4. Premium Access</h3>
          <p>
            Agonis offers optional Premium features unlocked through a one-time, non-recurring payment
            made via our Ko-fi page. There is no subscription and you will not be charged again
            automatically. To help us identify your account, you must include your Agonis username in
            the Ko-fi support message; Premium access is granted once we can match your payment to your
            account, usually within a few minutes. Payments are non-refundable except where required by
            law. We reserve the right to revoke Premium access in cases of fraud, chargebacks, or abuse.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">5. Third-Party Services</h3>
          <p>
            Agonis relies on third-party services to operate, including <strong>Supabase</strong>{' '}
            (hosting, database, authentication), <strong>IGDB</strong> (game data and artwork),{' '}
            <strong>Steam</strong> (optional library import), and <strong>Ko-fi</strong> (payment
            processing). Your use of features backed by these services is also subject to their
            respective terms.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">6. Termination</h3>
          <p>
            You may stop using Agonis and delete your account at any time from your profile settings.
            We may suspend or terminate accounts that violate these Terms or that we reasonably believe
            put other users or the service at risk.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">7. Disclaimer & Limitation of Liability</h3>
          <p>
            Agonis is provided "as is" without warranties of any kind. Game data is sourced from
            third-party providers and may occasionally be inaccurate or incomplete. To the maximum
            extent permitted by law, Agonis and its operator are not liable for any indirect or
            consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">8. Changes to These Terms</h3>
          <p>
            We may update these Terms from time to time. If we make material changes, we will make a
            reasonable effort to notify users. Continued use of Agonis after changes take effect
            constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">9. Contact</h3>
          <p>
            Questions about these Terms can be sent to{' '}
            <a href="mailto:contact@agonis.xyz" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              contact@agonis.xyz
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
