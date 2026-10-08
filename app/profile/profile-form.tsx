"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string;
  initialFirstName: string;
  initialLastName: string;
  initialAvatarUrl: string;
};

export default function ProfileForm({
  userId,
  email,
  initialFirstName,
  initialLastName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSaving(true);

    const supabase = createClient();
    let nextAvatarUrl = avatarUrl;

    if (photo) {
      if (!photo.type.startsWith("image/")) {
        setStatus("Please choose an image file.");
        setIsSaving(false);
        return;
      }

      const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, photo, {
          cacheControl: "3600",
          contentType: photo.type,
        });

      if (uploadError) {
        setStatus(`Photo upload failed: ${uploadError.message}`);
        setIsSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      nextAvatarUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: nextAvatarUrl || null,
      },
      { onConflict: "id" },
    );

    if (error) {
      setStatus(`Could not save profile: ${error.message}`);
      setIsSaving(false);
      return;
    }

    setAvatarUrl(nextAvatarUrl);
    setPhoto(null);
    setStatus("Profile saved.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Signed in as</p>
        <p className="mt-2 break-all text-sm font-medium text-zinc-100">{email}</p>
      </div>

      <div className="flex items-center gap-5">
        <div
          aria-label="Profile photo"
          className="h-24 w-24 shrink-0 rounded-full border-2 border-amber-400/40 bg-[#101115] bg-cover bg-center shadow-lg"
          style={
            avatarUrl
              ? { backgroundImage: `url("${avatarUrl}")` }
              : undefined
          }
        >
          {!avatarUrl && (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-amber-300">
              {firstName.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        <label className="block flex-1 text-sm font-medium">
          Profile photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full max-w-full rounded-xl border border-white/20 bg-[#101115] p-2.5 text-sm text-zinc-200 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:font-bold file:text-zinc-950"
          />
        </label>
      </div>

      <label className="text-sm font-medium">
        First name
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-white/20 bg-[#101115] px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400"
          placeholder="First name"
        />
      </label>

      <label className="text-sm font-medium">
        Last name
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-white/20 bg-[#101115] px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400"
          placeholder="Last name"
        />
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="min-h-12 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>

      {status && (
        <p role="status" className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">
          {status}
        </p>
      )}
    </form>
  );
}
