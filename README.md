# OneLine Cinema 🎬

**Find your next film in one line.**

A film community app built with **Next.js, Supabase Auth/Postgres/Storage, and Gemini**. Users write their **own full movie impressions** and AI turns them into three short reviews that help others decide what to watch. The user chooses **one** to publish; the community rates whether it is **Helpful / Not helpful**. AI drafts are grounded in the viewer's notes, with instructions to omit spoilers and avoid invented film details.

## Branch safety

This is the **`feature/movie-one-liners`** branch. The existing restaurant assignment stays unchanged in **`main`**. Do not merge this branch into main until you decide to replace the restaurant site. Both versions can use the existing Supabase project because this branch creates its own movie tables and doesn't alter restaurant tables.

## Workflow

### Week 5 iteration

- A shorter introduction brings the film collection closer to the top of the page; smaller posters and room above the review section keep cards readable.
- **Save film / Saved films** provides a reason to return. This shortlist is stored in the current browser, works without login, survives reloads and can be undone. It is not an account-synced Supabase feature. If storage is unavailable, the interface explains that saves last only for the current visit.
- Logged-out voting controls lead to Google sign-in and retain the selected film. Once profile setup is complete, sign-in returns to the home page and reopens that film; the user then chooses their vote. The OAuth callback URL stays unchanged to preserve the existing Supabase redirect allowlist.
- Accounts without a first name, last name, or public @username go to **Set up your profile** after sign-in. Their signed-in home-page access also returns to setup until those fields are complete. **Save and continue to films** sends them home after both profile records save successfully; future sign-ins return directly to films. An existing completed profile can still be edited without leaving the profile page.
- Loading, retry, not-found, empty-search and empty-saved-list states have clear next actions. Mobile display settings close on Escape. Standard and alternate palettes retain visible selected states, focus outlines and readable labels.
- `npm test` runs isolated workflow regression tests with mocked model/database calls. `npm run test:live` checks the deployed public Supabase reads and anonymous access denials without creating database records; set `TEST_SITE_URL` to inspect a particular deployment.

See [`docs/week5-review.md`](docs/week5-review.md) for the rubric review and remaining external verification.

1. Browse movies, search titles/year, and filter by genre. Click anywhere in a movie card, its poster/title, or **View all reviews** to open an accessible movie-detail overlay without leaving the page. Click outside, press Escape or the × button to close; browser deep links to `/movies/[id]` also remain available.
2. Authenticated users add movies (title, year, 1–3 genres, optional licensed/original artwork). Only the original creator may edit or delete a movie.
3. Select a movie and **write your own impressions** (20–5,000 characters).
4. Pick a review focus: **Overall verdict / Who it's for / Mood & pace**. The default writing style is **Straightforward** (stored as `Serious` for compatibility); Witty, Poetic and Sarcastic remain available. New drafts always use spoiler-free instructions, even if an older client sends `spoilerFree: false`.
5. Gemini returns **exactly three distinct short reviews**, aiming for 8–15 words and capped at 160 characters each. It emphasizes viewing qualities supported by the viewer's notes, with audience suggestions only when supported. The user checks the selected draft for accuracy and spoilers before publishing.
6. Choose **one**. Only that one-liner becomes publicly visible after clicking **Publish selected**. The original thoughts and other two suggestions remain private.
7. Authenticated users can mark a review **Helpful / Not helpful**, toggle an existing vote off, or change their vote. Votes rate the review's usefulness rather than the movie itself. Public aggregate counts rank reviews by net votes.

This iteration requires **no additional SQL migration**: tone keys, vote values, tables and RPCs are unchanged. Existing reviews and vote totals are retained; earlier positive votes appear in Helpful counts and are included in creator rankings. Historical reviews are not rewritten or certified spoiler-free. The review focus is generation guidance, not a new public database field.

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

The leaderboard has three sorts: **#1 film reviews**, **helpful votes**, and **published one-liners**. A #1 is a review with a *positive* net score (Helpful minus Not helpful) tied for the highest score on its film. Ties count for each tied review. Generated alternatives that were never published do **not** count toward the published total. If someone has not chosen a public username yet, old published reviews display the fallback label "Film fan" until they complete their public profile.

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
- Google login sends an incomplete account to profile setup; saving a valid name and @username returns home. Completed accounts return directly to the movie version. Failed saves remain on setup.
- A logged-in user can add a movie and choose 1–3 genres; duplicate title/year is rejected.
- User can write a **20–5,000-character original impression**, pick a tone, and generate three AI options.
- Choose one option and publish. **Only the chosen option** appears publicly after refreshing. The long impression and unchosen options never appear in public data.
- Helpful/Not helpful persists across page refresh; repeat clicking cancels it; opposite click changes it.
- A second user cannot edit/delete somebody else's movies, see another user's drafts, or vote as them.
- Test proper handling of Gemini errors/quota (10 attempts per day).
- Confirm RLS, public accessibility and deployment status from an incognito browser.

### Community feature verification

1. Run both Supabase SQL scripts in order. In `/profile`, create a unique username and bio.
2. Check `/u/<username>` in an incognito window. The bio and published reviews should show, but **not** your email, legal name, private impressions or other AI suggestions.
3. Publish from two separate accounts and confirm bylines link to the correct public profiles. An account without a username should show the neutral "Film fan" placeholder.
4. Vote on reviews and verify published totals, helpful votes and positive-net film-leading reviews on both user profiles and the `/leaderboard` tabs.
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
