# Agonis

![Agonis Banner](https://via.placeholder.com/1200x400/09090b/4f46e5?text=AGONIS+-+Track,+Rate,+and+Discuss+Games)

**Agonis** is a modern, dark-themed social platform and tracking application for video games. Inspired by platforms like Letterboxd, Agonis allows users to discover new titles, manage their gaming library, rate their experiences, and connect with a community of fellow gamers.

---

## Features

### Discover & Track
*   **IGDB Integration:** Search a massive database of video games, complete with high-quality cover art, summaries, and platform details.
*   **Library Management:** Organize your games into custom lists: *Backlog, Playing, Completed, Dropped,* and *100% Completed*.
*   **Rating & Reviews:** Rate games out of 5 stars (Masterpieces) and write personal notes, reviews, and completion dates.

### Social Feed
*   **Community Posts:** Share what you are playing, your thoughts, and your gaming achievements.
*   **Game Tagging:** Tag specific games from your personal library directly into your posts.
*   **Interactive Feed:** Like posts from other users and jump directly to their profiles.

### Customizable Profiles
*   **Personal Dashboard:** View your gaming stats at a glance (Total Games, Completed, Backlog, Average Rating).
*   **Masterpiece Showcase:** Proudly display your 5-star rated games on your profile.
*   **Follower System:** Follow your favorite users and build your gaming network.
*   **Privacy Controls:** Toggle your Game Collection visibility between public and private.
*   **Avatars & Bio:** Upload custom profile pictures and write a personalized bio.

---

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS (Modern Dark UI using Zinc/Indigo palettes)
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **Storage:** Supabase Storage (for user avatars)
*   **Serverless:** Supabase Edge Functions (Deno) for secure IGDB API requests
*   **External API:** Twitch/IGDB API

---

## Installation

```bash
git clone https://github.com/bernam07/agonis.git
cd agonis
npm install
```

## Environment Variables

Create a `.env.local` file in the root of your frontend project and add your Supabase credentials:

```text
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup (Backend)
Ensure your Supabase project is configured with the following tables:
*   `profiles` (id, username, bio, avatar_url, is_public)
*   `user_games` (user_id, igdb_id, status, rating, review, completed_at)
*   `posts` (id, user_id, content, igdb_id, game_name, game_cover)
*   `likes` (post_id, user_id)
*   `follows` (follower_id, following_id)
*   **Storage Bucket:** `avatars` (Public)

### Deploy Edge Functions
Deploy the IGDB search function to your Supabase project. Don't forget to set your IGDB/Twitch secrets in Supabase!
```bash
supabase functions deploy search-igdb
supabase secrets set TWITCH_CLIENT_ID=your_id TWITCH_CLIENT_SECRET=your_secret
```

## Development

```bash
cd frontend
npm run dev
```

## Author

**Bernardo**
Developer @ Deloitte | IPCA
