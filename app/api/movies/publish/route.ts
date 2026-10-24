import { createClient } from "@/lib/supabase/server";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return errorResponse("Publish reviews from this website.", 403);
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse("Sign in to publish a review.", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }
  const draftId = body.draftId;
  const selection = body.selection;
  if (
    typeof draftId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draftId) ||
    !Number.isInteger(selection) ||
    Number(selection) < 0 || Number(selection) > 2
  ) return errorResponse("Select one of your three generated reviews.", 400);

  // SECURITY DEFINER RPC locks the private draft, verifies ownership, and
  // publishes exactly one stored candidate, preventing duplicate submissions.
  const { data: reviewId, error } = await supabase.rpc("publish_movie_review", {
    p_draft_id: draftId,
    p_selection: selection,
  });
  if (error || !reviewId) {
    console.error("Movie review publish RPC failed", { code: error?.code });
    return errorResponse(
      "Unable to publish. Make sure this is your draft and it hasn't already been posted.",
      error?.code === "PGRST202" ? 503 : 400,
    );
  }
  return Response.json({ success: true, reviewId });
}
