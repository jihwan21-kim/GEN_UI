"use client";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function AddRestaurant({
  userId,
  available,
}: {
  userId: string;
  available: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const category = String(data.get("category") || "").trim();
    const address = String(data.get("address") || "").trim();
    const photo = data.get("photo") as File | null;
    const db = createClient();
    let path: string | null = null;
    setBusy(true);
    setMessage("");
    try {
      if (photo?.size) {
        if (
          photo.size > 5 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(photo.type)
        ) {
          setMessage("Choose a JPG, PNG, or WebP photo smaller than 5 MB.");
          return;
        }
        path = `${userId}/${crypto.randomUUID()}.${photo.type === "image/jpeg" ? "jpg" : photo.type === "image/png" ? "png" : "webp"}`;
        const { error } = await db.storage
          .from("restaurant-photos")
          .upload(path, photo, { contentType: photo.type });
        if (error) {
          setMessage("Photo upload failed. Please try again.");
          return;
        }
      }
      const { error } = await db
        .from("restaurants")
        .insert({
          name,
          category,
          address,
          photo_path: path,
          created_by: userId,
        });
      if (error) {
        if (path) await db.storage.from("restaurant-photos").remove([path]);
        setMessage(
          error.code === "23505"
            ? "This restaurant at this address is already in the list."
            : "Could not add the restaurant. Please check your details and try again.",
        );
        return;
      }
      form.reset();
      setOpen(false);
      setMessage("Restaurant added.");
      startTransition(() => router.refresh());
    } catch {
      setMessage("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const field = "mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2.5";
  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="add-restaurant"
        disabled={!available || busy || refreshing}
        className="rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50"
      >
        {open ? "Close form" : "+ Add a restaurant"}
      </button>
      {!available && (
        <p className="mt-2 text-sm text-zinc-500">
          Restaurant submissions will be available after the database update.
        </p>
      )}
      {open && (
        <form
          id="add-restaurant"
          onSubmit={submit}
          className="mt-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-5"
        >
          <h2 className="font-semibold">Share a NYC restaurant</h2>
          <label className="text-sm font-medium">
            Restaurant name
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              className={field}
            />
          </label>
          <label className="text-sm font-medium">
            Food type
            <input
              name="category"
              required
              minLength={2}
              maxLength={50}
              placeholder="Pizza, Korean, Cafe…"
              className={field}
            />
          </label>
          <label className="text-sm font-medium">
            Street address
            <input
              name="address"
              required
              minLength={5}
              maxLength={200}
              placeholder="Street address, neighborhood, NYC"
              className={field}
            />
          </label>
          <label className="text-sm font-medium">
            Photo (optional)
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={field}
            />
          </label>
          <p className="text-xs text-zinc-500">
            Your submission will be public. Upload a photo you have permission
            to share. JPG, PNG or WebP, up to 5 MB.
          </p>
          <button
            disabled={busy || refreshing}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add restaurant"}
          </button>
        </form>
      )}
      <p role="status" className="mt-2 text-sm text-emerald-800">
        {message}
      </p>
    </div>
  );
}
