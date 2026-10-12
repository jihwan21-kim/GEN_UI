import type { createClient } from "@/lib/supabase/server";
import { movieReturnPath } from "@/lib/movie-navigation";

export function hasCompleteProfile(
  profile: { first_name?: string | null; last_name?: string | null } | null,
  publicProfile: { handle?: string | null } | null,
) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim() && publicProfile?.handle?.trim());
}

export function profileSetupPath(movieId: number | null) {
  return movieId ? `/profile?film=${movieId}` : "/profile";
}

export async function signInDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  movieId: number | null,
) {
  const [profile, publicProfile] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle(),
    supabase.from("movie_public_profiles").select("handle").eq("user_id", userId).maybeSingle(),
  ]);
  return !profile.error && !publicProfile.error && hasCompleteProfile(profile.data, publicProfile.data)
    ? movieReturnPath(movieId)
    : profileSetupPath(movieId);
}
