import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseMovieId } from "@/lib/movie-navigation";
import { signInDestination } from "@/lib/profile-onboarding";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ film?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const movieId = parseMovieId(params.film);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(await signInDestination(supabase, user.id, movieId));
  return <LoginForm movieId={movieId} callbackFailed={params.error === "oauth"} />;
}
