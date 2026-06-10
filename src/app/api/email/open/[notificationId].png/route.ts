import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const transparentPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const { notificationId } = await context.params;

  try {
    const admin = createSupabaseAdminClient();
    await admin
      .from("notifications")
      .update({
        opened_at: new Date().toISOString()
      })
      .eq("id", notificationId)
      .is("opened_at", null);
  } catch {
    // The tracking pixel must never break email rendering.
  }

  return new NextResponse(transparentPixel, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store, max-age=0"
    }
  });
}
