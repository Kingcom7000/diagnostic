import { NextResponse, type NextRequest } from "next/server";
import { sendWeeklyEmails } from "@/lib/brevo/weekly-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Supabase service role is not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await sendWeeklyEmails(admin);
    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch {
    return NextResponse.json(
      { error: "Arthur could not send weekly emails" },
      { status: 500 }
    );
  }
}
