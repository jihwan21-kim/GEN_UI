# Week 5: OneLineCinema iteration review

Prepared October 11, 2026. This records implemented behavior and verification; it is not a claim of a grade or a substitute for Feedback Group participation.

## Purpose and return value

Help someone decide what to watch with brief AI-assisted reviews grounded in viewers' own notes. Authors choose Overall verdict, Who it's for, or Mood & pace and publish one of three generated alternatives. Other visitors evaluate review usefulness with Helpful / Not helpful. A browser-local saved-film shortlist lets visitors return to their next movie-night choices.

## Profile setup after sign-in

The owner requested profile setup before a new account enters the app. Google sign-in now checks for a first name, last name and public @username on the server. Incomplete accounts go to Set up your profile; their signed-in home-page access also returns to setup. Saving both profile records successfully continues to films and preserves the selected-film context. Failed saves stay on setup. Completed accounts return directly to films on future sign-ins and can edit their profile without being sent away.

## Feedback addressed

The app owner previously reported unclear mobile navigation, faint active tabs, oversized posters, cramped spacing above review cards, and a missing creator ranking. Existing navigation/ranking fixes were reviewed. This iteration makes the introduction compact, reduces poster widths, adds review-section breathing room, preserves high-contrast selected tabs, and keeps published authors in rankings even without an @username.

Additional audit findings: disabled anonymous voting buttons lacked a useful action; sign-in lost the selected film; failed OAuth had no visible error; there was no saved-film shortlist or cohesive loading/retry/not-found experience. These have been addressed in code.

No Product Manager or Feedback Group comments were supplied in this conversation. Their feedback has not been fabricated or marked as implemented. Record and act on that feedback at the October 12–16 group meeting.

## Rubric evidence

| Requirement | Evidence | Verification boundary |
| --- | --- | --- |
| End-to-end app, 15 points | Public film/review browsing; AI writer, selected-choice publishing, useful-vote flow | Real authenticated Google → AI → publish → vote flow remains blocked in the test browser by Google's 502 connection error. Isolated workflow tests pass. |
| Supabase integration, 10 points | Live public movies, reviews, profiles and vote aggregates return HTTP 200; existing authenticated write paths and owner policies reviewed | Live authenticated mutations were not performed. Private profiles are login gated. |
| Authentication, 10 points | Google OAuth starts; /profile and /private redirect anonymous visitors; generation/publish APIs and database RPCs deny unauthenticated callers | Google authentication completion and session refresh still require a reachable authentication environment. |
| Voting, 10 points | Rendered vote-control regression covers insert, opposite-vote update, cancellation, another voter preserved, refresh request, and anonymous login navigation | Database is mocked in this test. Existing live totals load; real authenticated persistence across reload remains unverified. |
| Deployment, 5 points | Existing Vercel preview uses GitHub branch deployment; public app returns HTTP 200 without Vercel login | Verify the final commit's unique deployment URL before submission. Branch aliases are not commit-specific. |
| Visual design, 25 points | Compact hero, capped poster width, responsive 1/2/3-column cards, separator spacing, active navigation and consistent palettes | Desktop visual review performed. Separate mobile viewport rendering is not available in this browser interface. Responsive code was reviewed. |
| Usability, 25 points | Search/genre/sort, accessible details, helpfulness labels, selected-film login return, saved-film shortlist, clear empty/loading/error paths | Public interactions can be checked live after final deployment. Authenticated author and account flows retain the authentication limit above. |

## Checks

- Next.js production build and TypeScript check passed.
- Ten isolated workflow tests pass: origin/auth/quota gates; all focus modes and spoiler-free instructions; invalid generation rejection; stored-choice publish contract; incomplete-profile setup and completed-profile safe return; sign-out; saved-list parsing; vote insertion/switch/cancellation; profile completeness; failed/successful onboarding saves.
- Live Supabase audit passes for public reads, aggregate scores, private draft/voter/quota access denial, private draft-link denial, and authentication-protected RPCs. No database records were created or changed.
- /profile and /private redirect anonymous visitors to /login. Generation and publish endpoints return 401 for anonymous same-origin requests and 403 for cross-origin requests.
- Main card text, muted text and active button labels meet a computed 4.5:1 contrast minimum in dark, light and both alternate palettes (lowest measured ratio: 5.85:1). This is a targeted check, not full accessibility certification.

## Demo flow for the Feedback Group

1. Open the final commit-specific public URL without Vercel login.
2. Search a title, choose a genre and open a film. Read a short AI-assisted review.
3. Save the film, switch to Saved films, reload, and remove the save.
4. Sign in with Google. If prompted, save your name and @username to finish profile setup. From an existing film, choose Create useful review.
5. Write a real viewing impression, choose a focus, generate three alternatives, check for accuracy/spoilers, and publish one.
6. Mark a review Helpful, change to Not helpful, click again to remove, and reload after each step to confirm stored counts.
7. Check profile/rankings, sign out, and verify that a new generation or vote requires sign-in.

## Submission

Use the immutable deployment URL associated with the final commit, not the branch alias or the Vercel dashboard URL. Preserve the assignment version. Feedback Group participation and any required CourseWorks submission remain user actions; no message, invitation or assignment submission was sent on the user's behalf.
