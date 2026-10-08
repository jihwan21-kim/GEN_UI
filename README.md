# OneLine Cinema 🎬

**Your thoughts. One unforgettable line.**

A film community app built with **Next.js, Supabase Auth/Postgres/Storage, and Gemini**. Users write their **own full movie impressions** and then AI **distills those impressions**, not its own imagined review, into exactly three different, short English one-liners. The user chooses **one** to publish; the community votes it up or down.

## Branch safety

This is the **`feature/movie-one-liners`** branch. The existing restaurant assignment stays unchanged in **`main`**. Do not merge this branch into main until you decide to replace the restaurant site. Both versions can use the existing Supabase project because this branch creates its own movie tables and doesn't alter restaurant tables.

## Workflow

1. Browse movies, search titles/year, and filter by genre. Click anywhere in a movie card, its poster/title, or **View all reviews** to open an accessible movie-detail overlay without leaving the page. Click outside, press Escape or the × button to close; browser deep links to `/movies/[id]` also remain available.
2. Authenticated users add movies (title, year, 1–3 genres, optional licensed/original artwork). Only the original creator may edit or delete a movie.
3. Select a movie and **write your own impressions** (20–5,000 characters).
4. Pick **Witty / Serious / Poetic / Sarcastic** and whether the result must be spoiler-free (on by default).
5. Gemini returns **exactly three distinct short one-liners**, aiming for 5–12 words, maximum 15 each, all based on the viewer's written impressions.
6. Choose **one**. Only that one-liner becomes publicly visible after clicking **Publish selected**. The original thoughts and other two suggestions remain private.
7. Authenticated users can Like, Dislike, toggle an existing vote off, or change their vote. Public aggregate counts rank reviews by net votes.

No AI generation or publishing is faked or hardcoded. The optional starter movies in the SQL migration are **factual text metadata only** with original text-based placeholder artwork.

## Setup

### 1. Supabase SQL migration (required)

In the **existing** Supabase project, open **SQL Editor** and run:

[`supabase/movie_oneliners.sql`](supabase/movie_oneliners.sql)

The migration creates independent movie tables with RLS, private drafts, public reviews, owner-only voting, atomic publishing, and 10 generation attempts per account per New York calendar day.

### 1b. Community username, profile, and rankings migration (required for new features)

After the core movie migration, also run [`supabase/movie_community.sql`](supabase/movie_community.sql) in the **same Supabase SQL Editor**. This is additive and does not change existing restaurant data or published movie review text.

It creates `movie_public_profiles` with:
- A unique lowercase **@username** (3–20 characters, begins with a letter, letters/numbers/underscores).
- Optional public **bio** (up to 280 characters) and existing profile photo.
- Row-level security: visitors may read only those public fields; only the account owner can change their public profile.
- Permission to retrieve the **author's user ID** on an already-public movie review (still no access to its private draft, unpublished alternatives, voter IDs, or the author's email).
- `movie_author_stats()`: public, aggregate-only creator metrics for creator profiles and the community leaderboard.

The leaderboard has three sorts: **#1 film reviews**, **likes received**, and **published one-liners**. A #1 is a review with a *positive* net score (likes minus dislikes) tied for the highest score on its film. Ties count for each tied review. Generated alternatives that were never published do **not** count toward the published total. If someone has not chosen a public username yet, old published reviews display the fallback label "Film fan" until they complete their public profile.

**Important:** Code deployment does not apply SQL migrations. Run this script manually before testing author links, editing @usernames, /u/[handle] or /leaderboard. If you rerun the core movie SQL after this migration, rerun the community SQL to regrant the safe public author column.

### Display and accessibility

Use the navigation selectors to choose **Dark** or **Light** appearance, and **Standard colors** or the optional **Colorblind-friendly** high-contrast palette. Preferences are stored locally in the browser and carry between movie pages. Voting, selected writing styles, genre filters, and rank entries use words, icons and numeric labels as well as color; the alternate palette is an aid, not a substitute for individual accessibility testing.
 It also creates a public **`movie-posters`** Storage bucket with owner-specific upload paths and 5MB MIME limits. It optionally seeds six movie titles so the site isn't empty.

**Running GitHub code alone does not apply the SQL migration.** It must be run manually or applied via a proper migrations workflow.

### 2. Vercel preview deployment

Deploy branch `feature/movie-one-liners` as a **Preview**, or use a **separate Vercel project** linked to this branch. The existing production website should continue following `main`.

Use the existing environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY` (server-side only)
- Optional `GEMINI_MODEL` (default `gemini-3.1-flash-lite`)

If testing Google login at a new preview domain, add `https://<your-preview-host>/auth/callback` to Supabase **Authentication → URL Configuration → Redirect URLs**. Do not accidentally redirect users back to the restaurant production URL. Keep Vercel Deployment Protection disabled if your instructor must access the preview without an account.

### 3. Verify

- Logged-out visitor can browse movies/reviews but cannot generate or vote.
- Google login redirects back to the movie version.
- A logged-in user can add a movie and choose 1–3 genres; duplicate title/year is rejected.
- User can write a **20–5,000-character original impression**, pick a tone, and generate three AI options.
- Choose one option and publish. **Only the chosen option** appears publicly after refreshing. The long impression and unchosen options never appear in public data.
- Like/Dislike persists across page refresh; repeat clicking cancels it; opposite click changes it.
- A second user cannot edit/delete somebody else's movies, see another user's drafts, or vote as them.
- Test proper handling of Gemini errors/quota (10 attempts per day).
- Confirm RLS, public accessibility and deployment status from an incognito browser.

### Community feature verification

1. Run both Supabase SQL scripts in order. In `/profile`, create a unique username and bio.
2. Check `/u/<username>` in an incognito window. The bio and published reviews should show, but **not** your email, legal name, private impressions or other AI suggestions.
3. Publish from two separate accounts and confirm bylines link to the correct public profiles. An account without a username should show the neutral "Film fan" placeholder.
4. Vote on reviews and verify published totals, likes and positive-net film-leading reviews on both user profiles and the `/leaderboard` tabs.
5. Switch between Dark/Light and Standard/Colorblind-friendly. Confirm the movie list, detail overlay, AI editor, login and profile screens use the selected palette and voting state remains visible without relying on color.

## Privacy and rights

Full personal film impressions and all three unpublished AI candidates are stored in `public.movie_review_drafts` with owner-only RLS, and **are not returned by the public review API**. The `publish_movie_review` SQL function checks ownership, locks the draft and publishes exactly one stored candidate, once.

Copyrighted posters do not become freely reusable simply by appearing in image searches or databases. Artwork upload is optional and requires the uploader to confirm ownership or permission. Without artwork, the app displays original CSS-generated film-title cards. There is **no TMDB integration**.

This feature branch retains legacy restaurant files for comparison. Only the home page and `/movies/[id]` route are used for the new movie experience.

## Local development

```bash
npm install
npm run dev
npm run lint
npm run build
```
