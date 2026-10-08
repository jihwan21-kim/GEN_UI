"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string;
  initialFirstName: string;
  initialLastName: string;
  initialAvatarUrl: string;
  initialHandle: string;
  initialBio: string;
};

export default function ProfileForm({
  userId,
  email,
  initialFirstName,
  initialLastName,
  initialAvatarUrl,
  initialHandle,
  initialBio,
}: ProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [handle, setHandle] = useState(initialHandle);
  const [bio, setBio] = useState(initialBio);
  const [publicHandle, setPublicHandle] = useState(initialHandle);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setStatus("");

    const normalizedHandle = handle.toLowerCase().trim().replace(/^@/, "");
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(normalizedHandle)
      || ["admin", "support", "moderator", "official"].includes(normalizedHandle)) {
      setStatus("Username must be 3–20 characters: start with a letter, then use lowercase letters, numbers, or underscores.");
      return;
    }
    if (bio.length > 280) {
      setStatus("Keep your public bio under 280 characters.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      let nextAvatarUrl = avatarUrl;

      if (photo) {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(photo.type) || photo.size > 5 * 1024 * 1024) {
          setStatus("Choose a JPG, PNG, WebP, or GIF photo smaller than 5 MB.");
          return;
        }
        const extension = photo.type === "image/jpeg" ? "jpg"
          : photo.type === "image/png" ? "png"
          : photo.type === "image/webp" ? "webp" : "gif";
        const path = `${userId}/avatar-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, photo, { cacheControl: "3600", contentType: photo.type });
        if (uploadError) {
          setStatus(`Photo upload failed: ${uploadError.message}`);
          return;
        }
        nextAvatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      // Keep the owner ID immutable. PostgREST upsert can issue an UPDATE
      // for every submitted column (including user_id); community RLS grants
      // UPDATE only for handle, bio and avatar_url on purpose.
      const publicFields = {
        handle: normalizedHandle,
        bio: bio.trim(),
        avatar_url: nextAvatarUrl || null,
      };
      const { data: existingPublicProfile, error: lookupError } = await supabase
        .from("movie_public_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (lookupError) {
        setStatus(`Could not look up your public profile (${lookupError.code || "unknown"}): ${lookupError.message}`);
        return;
      }

      const { error: publicError } = existingPublicProfile
        ? await supabase
            .from("movie_public_profiles")
            .update(publicFields)
            .eq("user_id", userId)
        : await supabase
            .from("movie_public_profiles")
            .insert({ user_id: userId, ...publicFields });

      if (publicError) {
        const code = publicError.code || "unknown";
        setStatus(code === "23505"
          ? "That @username is already taken. Please choose another."
          : `Could not save your public profile (${code}): ${publicError.message}`);
        return;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: nextAvatarUrl || null,
      }, { onConflict: "id" });

      if (error) {
        setStatus(`Public profile saved, but private profile failed: ${error.message}`);
        return;
      }

      setHandle(normalizedHandle);
      setPublicHandle(normalizedHandle);
      setAvatarUrl(nextAvatarUrl);
      setPhoto(null);
      setStatus("Profile saved. Your @username and bio are public.");
      router.refresh();
    } catch {
      setStatus("Could not save the profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <p className="cinema-accent-text text-xs font-semibold uppercase tracking-wider">Signed in as</p>
        <p className="cinema-text mt-2 break-all text-sm font-medium">{email}</p>
        <p className="cinema-muted mt-1 text-xs">Your email and first/last names are not shown on public profiles.</p>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <div
          aria-label="Profile photo"
          className="cinema-card h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 bg-cover bg-center shadow-lg"
          style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
        >
          {!avatarUrl && (
            <div className="cinema-accent-text flex h-full items-center justify-center text-2xl font-bold">
              {handle.charAt(0).toUpperCase() || firstName.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
        <label className="cinema-text block min-w-0 flex-1 text-sm font-medium">
          Profile photo <span className="cinema-muted">(public)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className="cinema-input mt-2 block w-full max-w-full rounded-xl p-2.5 text-sm"
          />
        </label>
      </div>

      <div className="cinema-muted-card grid gap-4 rounded-xl border p-4">
        <div>
          <h2 className="cinema-text text-base font-bold">Public creator identity</h2>
          <p className="cinema-muted mt-1 text-xs">
            People will see your @username and bio next to your published reviews and in the rankings.
          </p>
        </div>
        <label className="cinema-text text-sm font-medium">
          Username (unique)
          <div className="cinema-input mt-2 flex items-center rounded-xl px-3">
            <span className="cinema-muted font-semibold">@</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              required
              minLength={3}
              maxLength={20}
              autoComplete="off"
              className="cinema-text min-w-0 w-full bg-transparent px-2 py-3 outline-none"
              placeholder="movie_fan"
            />
          </div>
          <span className="cinema-muted mt-1 block text-xs">3–20 characters. Lowercase letters, numbers and underscores. Changing this also changes your public profile URL.</span>
        </label>
        <label className="cinema-text text-sm font-medium">
          About me (public)
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Sci-fi enthusiast, weekend cinema explorer..."
            className="cinema-input mt-2 block w-full resize-y rounded-xl px-4 py-3"
          />
          <span className="cinema-muted mt-1 block text-right text-xs">{bio.length}/280</span>
        </label>
        {publicHandle && (
          <Link href={`/u/${publicHandle}`} className="cinema-accent-text text-sm font-semibold hover:underline">
            View my public profile →
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="cinema-text text-sm font-medium">
          First name (private)
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            className="cinema-input mt-2 w-full rounded-xl px-4 py-3"
            placeholder="First name"
          />
        </label>
        <label className="cinema-text text-sm font-medium">
          Last name (private)
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            className="cinema-input mt-2 w-full rounded-xl px-4 py-3"
            placeholder="Last name"
          />
        </label>
      </div>

      <button type="submit" disabled={isSaving}
        className="cinema-accent-bg min-h-12 rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
        {isSaving ? "Saving…" : "Save profile"}
      </button>
      {status && <p role="status" className="cinema-status rounded-xl p-3 text-sm">{status}</p>}
    </form>
  );
}
