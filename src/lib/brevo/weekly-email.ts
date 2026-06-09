import { sendBrevoEmail } from "@/lib/brevo/client";
import { generateArthurContent } from "@/lib/ai/generation";
import { createWeeklyReportForBusiness, getBusinessContextForAdmin } from "@/lib/domain/weekly-report";
import type { ContentType, Json } from "@/types/database";

type SupabaseAdmin = ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdminClient>;

type UserForEmail = {
  id: string;
  email: string;
  full_name: string | null;
};

type BusinessForEmail = {
  id: string;
  user_id: string;
  name: string;
  sector: string;
  city: string;
  main_offer: string;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  google_business_url: string | null;
};

type WeeklyEmailResult = {
  sent: number;
  skipped: number;
  failed: number;
};

const subject = "Arthur a prepare votre plan de croissance.";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function asArray(value: Json): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function contentTypeLabel(type: string) {
  const labels: Record<ContentType, string> = {
    facebook_post: "Facebook",
    instagram_post: "Instagram",
    email: "Email",
    newsletter: "Newsletter"
  };

  return labels[type as ContentType] ?? "Contenu";
}

function renderWeeklyEmail({
  notificationId,
  firstName,
  report,
  actions,
  contents
}: {
  notificationId: string;
  firstName: string | null;
  report: {
    growth_score: number;
    score_explanation: string;
    arthur_summary: string;
    opportunities: Json;
  };
  actions: Array<{
    title: string;
    reason: string;
    impact: string;
    steps: Json;
  }>;
  contents: Array<{
    type: string;
    title: string;
    body: string;
  }>;
}) {
  const opportunities = asArray(report.opportunities);
  const dashboardUrl = `${appUrl()}/dashboard`;
  const openPixelUrl = `${appUrl()}/api/email/open/${notificationId}.png`;

  return `
<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f7f5ef;color:#20242d;font-family:Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">J'ai prepare votre score, vos opportunites et les actions de la semaine.</div>
    <main style="max-width:680px;margin:0 auto;padding:28px 18px;">
      <section style="background:#ffffff;border:1px solid #d9dedf;border-radius:8px;padding:24px;">
        <p style="margin:0 0 8px;color:#16756d;font-weight:700;">Arthur™</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;">Bonjour${firstName ? ` ${escapeHtml(firstName)}` : ""},</h1>
        <p style="font-size:16px;line-height:1.7;color:#4f5965;">${escapeHtml(report.arthur_summary)}</p>
        <div style="margin:22px 0;padding:18px;background:#eef8f7;border-radius:8px;">
          <p style="margin:0;color:#4f5965;">Score croissance</p>
          <p style="margin:4px 0 0;font-size:44px;font-weight:800;color:#16756d;">${report.growth_score}/100</p>
          <p style="margin:10px 0 0;line-height:1.6;color:#4f5965;">${escapeHtml(report.score_explanation)}</p>
        </div>
        <h2 style="font-size:20px;margin:24px 0 12px;">Les actions de cette semaine</h2>
        ${actions
          .map((action, index) => {
            const steps = Array.isArray(action.steps) ? action.steps.filter((step): step is string => typeof step === "string") : [];
            return `
              <article style="border-top:1px solid #e2e6e8;padding:16px 0;">
                <p style="margin:0;color:#16756d;font-weight:700;">Action ${index + 1}</p>
                <h3 style="margin:5px 0;font-size:18px;">${escapeHtml(action.title)}</h3>
                <p style="margin:0 0 8px;line-height:1.6;color:#4f5965;">${escapeHtml(action.reason)}</p>
                <ol style="margin:8px 0 0;padding-left:20px;color:#4f5965;line-height:1.6;">
                  ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
                </ol>
              </article>
            `;
          })
          .join("")}
        ${
          opportunities.length
            ? `<h2 style="font-size:20px;margin:24px 0 12px;">Opportunites detectees</h2>
              ${opportunities
                .map(
                  (opportunity) => `
                    <p style="margin:0 0 10px;line-height:1.6;color:#4f5965;">
                      <strong>${escapeHtml(String(opportunity.title ?? ""))}</strong><br />
                      ${escapeHtml(String(opportunity.description ?? ""))}
                    </p>`
                )
                .join("")}`
            : ""
        }
        ${
          contents.length
            ? `<h2 style="font-size:20px;margin:24px 0 12px;">Contenu pret a utiliser</h2>
              ${contents
                .map(
                  (content) => `
                    <article style="border-top:1px solid #e2e6e8;padding:14px 0;">
                      <p style="margin:0;color:#16756d;font-weight:700;">${escapeHtml(contentTypeLabel(content.type))}</p>
                      <h3 style="margin:5px 0;font-size:17px;">${escapeHtml(content.title)}</h3>
                      <p style="white-space:pre-line;margin:0;line-height:1.6;color:#4f5965;">${escapeHtml(content.body)}</p>
                    </article>`
                )
                .join("")}`
            : ""
        }
        <p style="margin:26px 0 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#16756d;color:white;text-decoration:none;border-radius:6px;padding:13px 18px;font-weight:700;">Voir mon plan</a>
        </p>
      </section>
      <p style="font-size:12px;color:#7a838d;text-align:center;">Arthur travaille chaque semaine pour vous aider a obtenir plus de clients.</p>
      <img alt="" width="1" height="1" src="${openPixelUrl}" style="display:none;" />
    </main>
  </body>
</html>`;
}

async function ensureWeeklyContent(admin: SupabaseAdmin, business: BusinessForEmail) {
  const { data: existing = [] } = await admin
    .from("content_pieces")
    .select("type,title,body")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if ((existing ?? []).length > 0 || !process.env.OPENAI_API_KEY) {
    return existing ?? [];
  }

  const context = await getBusinessContextForAdmin(admin, business);
  const generated = await generateArthurContent({
    context,
    type: "all"
  });

  const { data: inserted = [] } = await admin
    .from("content_pieces")
    .insert(
      generated.pieces.map((piece) => ({
        business_id: business.id,
        type: piece.type,
        title: piece.title,
        body: piece.body,
        saved_at: new Date().toISOString()
      }))
    )
    .select("type,title,body");

  return inserted ?? [];
}

export async function sendWeeklyEmailForBusiness({
  admin,
  business,
  user
}: {
  admin: SupabaseAdmin;
  business: BusinessForEmail;
  user: UserForEmail;
}) {
  const report = await createWeeklyReportForBusiness({
    admin,
    business
  });

  if (report.email_sent_at) {
    return "skipped" as const;
  }

  const { data: actions = [] } = await admin
    .from("actions")
    .select("title,reason,impact,steps")
    .eq("weekly_report_id", report.id)
    .order("created_at");

  const contents = await ensureWeeklyContent(admin, business);

  const { data: notification, error: notificationError } = await admin
    .from("notifications")
    .insert({
      user_id: user.id,
      weekly_report_id: report.id,
      channel: "email",
      subject,
      body: "Arthur a prepare votre plan de croissance hebdomadaire.",
      metadata: {
        business_id: business.id
      }
    })
    .select("id")
    .single();

  if (notificationError || !notification) {
    throw new Error("Arthur could not create email notification");
  }

  const firstName = user.full_name?.split(" ")[0] ?? null;
  const htmlContent = renderWeeklyEmail({
    notificationId: notification.id,
    firstName,
    report,
    actions: actions ?? [],
    contents
  });
  const result = await sendBrevoEmail({
    to: [{ email: user.email, name: user.full_name ?? undefined }],
    subject,
    htmlContent,
    textContent: `${report.arthur_summary}\n\nVoir mon plan: ${appUrl()}/dashboard`
  });

  const providerMessageId =
    result && typeof result === "object" && "messageId" in result
      ? String((result as { messageId: unknown }).messageId)
      : null;

  await admin
    .from("notifications")
    .update({
      provider_message_id: providerMessageId,
      metadata: {
        business_id: business.id,
        brevo_response: result
      }
    })
    .eq("id", notification.id);

  await admin
    .from("weekly_reports")
    .update({
      email_sent_at: new Date().toISOString()
    })
    .eq("id", report.id);

  return "sent" as const;
}

export async function sendWeeklyEmails(admin: SupabaseAdmin): Promise<WeeklyEmailResult> {
  const { data: businesses = [] } = await admin
    .from("businesses")
    .select("id,user_id,name,sector,city,main_offer,website_url,facebook_url,instagram_url,google_business_url")
    .not("onboarding_completed_at", "is", null);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const business of businesses ?? []) {
    try {
      const { data: user } = await admin
        .from("users")
        .select("id,email,full_name")
        .eq("id", business.user_id)
        .maybeSingle();

      if (!user?.email) {
        skipped += 1;
        continue;
      }

      const { data: subscription } = await admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscription && !["active", "trialing"].includes(subscription.status)) {
        skipped += 1;
        continue;
      }

      const status = await sendWeeklyEmailForBusiness({
        admin,
        business,
        user
      });

      if (status === "sent") sent += 1;
      if (status === "skipped") skipped += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, skipped, failed };
}
