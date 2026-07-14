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

export default function FAQ() {
  const faqs = [
    { q: "What is Agonis?", a: "Agonis is your personal gaming diary. Track games you've played, write reviews, and share your gaming journey with friends." },
    { q: "Is my profile public?", a: "By default, yes. But you can set your profile to Private in your Profile Settings. A private profile hides your library and posts from users who don't follow you." },
    { q: "How do I add a game to my Masterpieces?", a: "Simply rate a game 5 stars (★) in your library, and it will automatically be showcased in your Masterpieces section on your profile!" },
    { q: "Can I share my reviews to Instagram?", a: "Yes! Open a game from your library or profile, click 'Export Review Card', and download the aesthetic image to share anywhere." }
  ]

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">{faq.q}</h3>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed font-medium">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}