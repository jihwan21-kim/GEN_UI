"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Movie, movieGenres } from "@/lib/movies";
import { useMovieSelection } from "./movie-selection-context";

export default function MovieForm({
  userId,
  movie,
}: {
  userId: string;
  movie?: Movie;
}) {
  const router = useRouter();
  const movieSelection = useMovieSelection();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [genres, setGenres] = useState<string[]>(movie?.genres || []);
  const [fileRights, setFileRights] = useState(false);
  const [hasPosterFile, setHasPosterFile] = useState(false);

  function toggleGenre(genre: string) {
    setGenres((previous) => (
      previous.includes(genre)
        ? previous.filter((value) => value !== genre)
        : previous.length < 3 ? [...previous, genre] : previous
    ));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || refreshing) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const releaseYear = Number(data.get("release_year"));
    const file = data.get("poster") as File | null;
    const removePoster = data.get("remove_poster") === "on";

    if (title.length < 1 || title.length > 120 || !Number.isInteger(releaseYear)
      || releaseYear < 1888 || releaseYear > new Date().getFullYear() + 3
      || genres.length < 1 || genres.length > 3) {
      setMessage("Enter a title, a valid release year and up to three genres.");
      return;
    }
    if (file?.size) {
      if (file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setMessage("Artwork must be JPG, PNG or WebP under 5 MB.");
        return;
      }
      if (!fileRights) {
        setMessage("Confirm you own or have permission to upload this artwork.");
        return;
      }
    }
    setBusy(true);
    setMessage("");
    const db = createClient();
    let uploadedPath: string | null = null;

    try {
      if (file?.size) {
        const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
        uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await db.storage
          .from("movie-posters")
          .upload(uploadedPath, file, { contentType: file.type });
        if (uploadError) {
          setMessage("Artwork upload failed. Please check your storage permissions.");
          return;
        }
      }

      const fields = {
        title,
        release_year: releaseYear,
        genres,
        poster_path: uploadedPath || (removePoster ? null : movie?.poster_path || null),
      };
      const query = movie
        ? db.from("movies").update(fields).eq("id", movie.id).eq("created_by", userId)
        : db.from("movies").insert({ ...fields, created_by: userId });
      const { data: saved, error } = await query.select("id, title, release_year, genres, poster_path, created_by, created_at").single();
      if (error || !saved) {
        if (uploadedPath) await db.storage.from("movie-posters").remove([uploadedPath]);
        setMessage(error?.code === "23505"
          ? "This film and release year are already in the catalog."
          : `Couldn't save the film${error?.code ? ` (${error.code})` : ""}. Check the movie SQL migration.`);
        return;
      }
      if (movie?.poster_path && (removePoster || uploadedPath)) {
        await db.storage.from("movie-posters").remove([movie.poster_path]);
      }
      if (!movie) {
        form.reset();
        setGenres([]);
        setFileRights(false);
        setHasPosterFile(false);
      }
      setOpen(false);
      if (movie) {
        setMessage("Movie updated.");
      } else {
        // Open the newly created film in-place instead of leaving a permanent
        // `Movie added.` message beneath the homepage button.
        setMessage("");
        movieSelection?.movieCreated(saved as Movie);
      }
      startTransition(() => router.refresh());
    } catch {
      setMessage("Could not contact Supabase. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMovie() {
    if (!movie || busy || refreshing) return;
    if (!window.confirm(`Delete "${movie.title}" and all its reviews and votes? This cannot be undone.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const db = createClient();
      const { data, error } = await db.from("movies").delete()
        .eq("id", movie.id).eq("created_by", userId).select("id");
      if (error || !data?.length) {
        setMessage(`Could not delete this movie${error?.code ? ` (${error.code})` : ""}.`);
        return;
      }
      if (movie.poster_path) {
        await db.storage.from("movie-posters").remove([movie.poster_path]);
      }
      setOpen(false);
      if (movieSelection) movieSelection.movieDeleted(movie.id);
      else router.push("/");
      startTransition(() => router.refresh());
    } catch {
      setMessage("Could not delete this movie. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={movie ? "mt-5" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => { setMessage(""); setOpen((previous) => !previous); }}
          disabled={busy || refreshing}
          className="cinema-accent-bg inline-flex h-12 w-[180px] shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold disabled:opacity-50"
        >
          {open ? "Close form" : movie ? "Edit movie" : "+ Add a movie"}
        </button>
        {movie && (
          <button
            type="button"
            disabled={busy || refreshing}
            onClick={deleteMovie}
            className="cinema-outline rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Delete movie
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="cinema-card mt-4 grid gap-4 rounded-2xl border p-5 shadow-sm">
          <h2 className="text-lg font-bold">{movie ? "Edit your movie" : "Add a movie to the collection"}</h2>
          <label className="grid gap-1 text-sm font-semibold">
            Film title
            <input name="title" defaultValue={movie?.title || ""} required maxLength={120}
              placeholder="e.g. Interstellar"
              className="cinema-input rounded-lg p-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Release year
            <select
              name="release_year"
              defaultValue={movie ? String(movie.release_year) : ""}
              required
              className="cinema-input rounded-lg p-3 font-normal"
            >
              <option value="" disabled>Select release year</option>
              {Array.from(
                { length: new Date().getFullYear() + 3 - 1888 + 1 },
                (_, index) => new Date().getFullYear() + 3 - index,
              ).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Genres <span className="cinema-muted font-normal">(choose 1–3)</span></legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {movieGenres.map((genre) => (
                <label key={genre} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${genres.includes(genre)
                  ? "cinema-accent-bg"
                  : "cinema-muted-card"}`}>
                  <input
                    type="checkbox"
                    checked={genres.includes(genre)}
                    disabled={!genres.includes(genre) && genres.length >= 3}
                    onChange={() => toggleGenre(genre)}
                    className="sr-only"
                  />
                  {genres.includes(genre) ? "✓ " : ""}{genre}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-1 text-sm font-semibold">
            Artwork <span className="cinema-muted font-normal">(optional, max 5 MB)</span>
            <input name="poster" type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setHasPosterFile(Boolean(event.target.files?.[0]?.size));
                setFileRights(false);
              }}
              className="cinema-input rounded-lg p-2.5 text-sm font-normal" />
          </label>
          {hasPosterFile && (
            <label className="cinema-status flex items-start gap-2 rounded-lg p-3 text-xs leading-relaxed">
              <input type="checkbox" checked={fileRights} onChange={(event) => setFileRights(event.target.checked)}
                required
                className="mt-0.5" />
              I own or have permission to upload this artwork. Movie posters are often copyrighted.
            </label>
          )}
          {movie?.poster_path && (
            <label className="cinema-muted flex gap-2 text-sm">
              <input type="checkbox" name="remove_poster" /> Remove existing artwork
            </label>
          )}
          <p className="cinema-muted text-xs">
            A custom title card will appear when no artwork is uploaded. Movie details and approved artwork will be public.
          </p>
          <button type="submit" disabled={busy || refreshing}
            className="cinema-accent-bg rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
            {busy ? "Saving…" : movie ? "Save changes" : "Add movie"}
          </button>
        </form>
      )}
      {message && (
        <p role="status" aria-live="polite" className="cinema-status mt-2 rounded-lg p-2 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
