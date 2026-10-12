import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { movieReturnPath, parseMovieId } from "@/lib/movie-navigation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const movieId = parseMovieId(searchParams.get("film"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(movieReturnPath(movieId), origin));
    }
  }

  const login = new URL("/login", origin);
  login.searchParams.set("error", "oauth");
  if (movieId) login.searchParams.set("film", String(movieId));
  return NextResponse.redirect(login);
}
