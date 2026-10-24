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
  if (user) {
    const {data:allowed,error:allowError}=await supabase.rpc('cinema_member_allowed');
    if(!allowError&&allowed) redirect(await signInDestination(supabase,user.id,movieId));
    await supabase.auth.signOut();
  }
  return <LoginForm movieId={movieId} callbackFailed={params.error === "oauth"} accessDenied={params.error === "not_allowed"} />;
}
