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

## Assignment #4 — Restaurant captions

The existing restaurant list remains the home page. Each restaurant card includes AI caption generation and rating, using the existing Google login and profiles. `/restaurants` redirects to `/` so earlier links continue to work.

- Logged-in users open a small generator inside a restaurant card, supply a short idea, and choose a tone. The server looks up the restaurant rather than trusting a client-supplied name.
- Generated captions appear below the correct restaurant. Each row saves its restaurant foreign key, creator, caption, exact prompt, model, tone and timestamp.
- Users insert one like/dislike per caption. A database unique constraint prevents duplicate votes, including concurrent requests. Saved votes remain visible after refresh.
- Guests browse the list and captions, but must sign in to generate or vote. Individual votes and profiles are private; aggregate counts and caption content are public.
- The generator allows 10 attempts per account per New York calendar day. The API key stays server-side.

This targets students like Sam through short, playful captions for familiar NYC restaurants. The compact per-restaurant layout gives the existing list fresh content without a separate feed or new navigation system. AI captions are humor, not verified reviews, prices, or opening hours. Prompts are visible for transparency. The latest 100 restaurant captions are loaded across the collection.

### Setup and validation

1. Apply `supabase/hw4.sql` to the existing project (after the HW3 schema). It can be re-run if the earlier HW4 migration was applied. Existing standalone captions are preserved but are not shown in the restaurant list. New inserts require a valid restaurant link.
2. Retain the existing Supabase URL and publishable key. Set `GEMINI_API_KEY` as a server-only Vercel environment variable and optionally set `GEMINI_MODEL` to a supported Gemini text model. Do not prefix the key with `NEXT_PUBLIC_`.
3. Audit the real database's additional tables/storage policies, test Google login, profile editing/avatar uploads, generation and saved prompt, saved votes, duplicate rejection and a second user's isolation.
4. Disable Vercel deployment protection, test Incognito, and submit the immutable deployment URL for the exact commit.

The migration enables RLS on all public tables and replaces policies for the five app-owned tables. Restaurant/caption reads are public. Profiles and individual votes are owner-only. New captions must reference a restaurant; there is no user update/delete access for captions or votes. The limited aggregate function exposes only vote counts, and an atomic quota function uses the current authenticated user.

RLS allows owners to insert caption rows directly through Supabase; provider provenance is assured through the application's Gemini endpoint, not every possible direct API insert. Real provider/auth integration still requires the service configuration above.

Collect PM feedback during the Feedback Group, record it, and implement it before final submission. This iteration implements the user's feedback to retain the restaurant list and use a minimal, consistent light theme. Feedback from the designated PM has not yet been supplied.

## Restaurant community update

After `supabase/hw4.sql`, apply `supabase/hw4_restaurants.sql` in the Supabase SQL Editor. If rerunning hw4.sql later, rerun the additive migration afterward as well. It adds restaurant address/photo/creator fields, authenticated restaurant submissions, a public photo bucket (5 MB JPG/PNG/WebP), owner-only vote updates/deletes, and anonymous aggregate popularity. It preserves existing rows. No new environment variables are needed.

Google login now lands on `/` for both existing and new users. Profiles remain editable from navigation. Votes toggle off when pressed again, or switch when the opposite button is pressed. Restaurant ranking uses all linked captions' likes minus dislikes, with likes and restaurant ID as tie breakers; it is explicitly not a dining review score. Existing restaurants use labeled representative Unsplash food photos, not verified venue photos. Community submissions can upload their own photos. Name/address duplicates are rejected.

Validation: lint and production build passed; 27 PostgreSQL permission/schema checks covered vote changes/cancellation, cross-user isolation, anonymous denial, restaurant ownership/photo paths, duplicate submissions, popularity, quota boundaries, and rerunning migrations. Live restaurant submission/photo upload require applying the additive SQL.

### Restaurant editing and responsive layout
Apply `supabase/hw4_restaurant_edit.sql` after the restaurant community migration. Only the creator can update name, category, address and photo; creator/ID ownership columns cannot be changed. Reapply it if earlier permission migrations are rerun. User-added restaurants without an uploaded image have an empty placeholder. The three original restaurants retain their representative photos. Editing preserves caption/vote relationships, supports photo replacement/removal, and validates duplicate addresses/names. The list uses one column on phones, two from 768px and three from 1280px. Lint/build and 31 permission/schema checks passed; live owner editing needs the new SQL.
