This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Assignment #4 — Side of NYC

A caption feed for Sam: a Columbia junior, new to NYC, living in a dorm and exploring on weekends. It extends the existing Google login, profiles, and restaurant list (now at `/restaurants`).

### Features and intent

- Daily NYC/campus topic and three tones reduce blank-page friction and give people a shared conversation to return to.
- Signed-in users generate and immediately publish a short Gemini caption. Store the caption, user's topic, full prompt, model, owner, and timestamp together.
- Public feed with newest/top-rated sorting and today's-topic filter. Sorts apply to the latest 100 captions, rather than an all-time leaderboard.
- Signed-in users insert one upvote/downvote per caption into `votes`. A unique constraint prevents duplicate votes, including concurrent requests. Votes are final in this version; no update/delete permission is granted.
- Prompts and AI labels make provenance visible. Compared with a generic caption app, campus-specific topics, controlled tone, and transparent prompts aim to make content more relevant and easier to judge.
- Private voting records; public aggregate counts. Profiles can only be read or edited by their owners. Restaurant and caption content remain publicly readable.
- Atomic database quota: 10 AI attempts per account per New York calendar day. Failed provider attempts count toward this limit. The Gemini key stays on the server.

### Setup and deployment

1. Run `supabase/hw4.sql` in the **existing** Supabase project, after checking the current tables/policies. It enables RLS for every public table and replaces policies on this app's five tables. Audit any additional tables and storage policies using its final queries.
2. Retain `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set `GEMINI_API_KEY` in Vercel as a server-only secret; optionally set `GEMINI_MODEL` to a supported text-generation model. `.env.example` contains placeholders only. Create a key at https://aistudio.google.com/apikey.
3. Deploy the assignment commit on Vercel. Keep `/auth/callback` as the OAuth application callback and ensure the deployed origin is allowed in Supabase's redirect configuration.
4. Turn off Vercel deployment protection for the submitted deployment. Verify anonymously in Incognito, then sign in and verify generation, voting, and profile editing.
5. Submit the deployment URL associated with the exact commit, not a moving production alias.

### Security boundaries

The generation endpoint validates the session, same-origin request, topic length and tone before calling Gemini, and persists results using the user's Supabase session so RLS applies. Anonymous visitors have no mutation privileges. Database constraints validate references, vote values and caption lengths. Generation/counter timestamps cannot be supplied by the browser. The score function is a limited security-definer aggregate exposing no voter IDs; the quota function binds the counter to `auth.uid()`.

RLS permits authenticated owners to insert generation rows directly through Supabase, as required for authenticated creation. It does **not** attest that every direct API insert came from Gemini; AI provenance is assured only through the app's generation endpoint. Server-verified provenance would require a separate privileged insertion path. This version is a classroom caption app, not a content-moderation platform.

### Verification and PM feedback

Before submission, check guest browsing, guest mutation rejection, Google login, AI generation and persisted prompt, saved vote after refresh, duplicate rejection, a second user's private profile/vote isolation, and avatar upload. Confirm mobile keyboard access and visible focus. The migration was tested against an embedded PostgreSQL instance with stub Auth/Storage schemas; the real project's remaining tables, storage policies and login flow still need integration verification.

PM feedback has **not** been collected. During the Feedback Group, ask the PM to find a caption, vote, generate their own, and explain the saved-vote state. Record their comments and iterate before final submission; do not claim that feedback-driven iteration is complete until it happens.
