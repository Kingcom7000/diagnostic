import { generateArthurWeeklyReport, type ArthurBusinessContext } from "@/lib/ai/generation";
import { buildInitialDiagnostic, getMonday } from "@/lib/domain/onboarding-diagnostic";

type SupabaseAdmin = ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdminClient>;

type BusinessForReport = {
  id: string;
  name: string;
  sector: string;
  city: string;
  main_offer: string;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  google_business_url: string | null;
};

type CompetitorForReport = {
  name: string;
  website_url: string | null;
};

export async function getBusinessContextForAdmin(
  admin: SupabaseAdmin,
  business: BusinessForReport
) {
  const { data: competitors = [] } = await admin
    .from("competitors")
    .select("name,website_url")
    .eq("business_id", business.id)
    .order("created_at");

  const context: ArthurBusinessContext = {
    business,
    competitors: competitors ?? []
  };

  return context;
}

export async function createWeeklyReportForBusiness({
  admin,
  business,
  force = false
}: {
  admin: SupabaseAdmin;
  business: BusinessForReport;
  force?: boolean;
}) {
  const weekStartsOn = getMonday();

  if (!force) {
    const { data: existing } = await admin
      .from("weekly_reports")
      .select("id,growth_score,score_explanation,arthur_summary,opportunities,email_sent_at,created_at")
      .eq("business_id", business.id)
      .eq("week_starts_on", weekStartsOn)
      .maybeSingle();

    if (existing) {
      return existing;
    }
  }

  const context = await getBusinessContextForAdmin(admin, business);
  const fallback = buildInitialDiagnostic({
    name: business.name,
    sector: business.sector,
    city: business.city,
    mainOffer: business.main_offer,
    websiteUrl: business.website_url,
    facebookUrl: business.facebook_url,
    instagramUrl: business.instagram_url,
    googleBusinessUrl: business.google_business_url,
    competitors: context.competitors.map((competitor: CompetitorForReport) => ({
      name: competitor.name,
      websiteUrl: competitor.website_url
    }))
  });

  let generated = {
    score: fallback.score,
    scoreExplanation: fallback.explanation,
    arthurSummary: fallback.summary,
    opportunities: fallback.opportunities,
    actions: fallback.actions
  };

  if (process.env.OPENAI_API_KEY) {
    try {
      generated = await generateArthurWeeklyReport(context);
    } catch {
      generated = {
        score: fallback.score,
        scoreExplanation: fallback.explanation,
        arthurSummary: fallback.summary,
        opportunities: fallback.opportunities,
        actions: fallback.actions
      };
    }
  }

  const { data: report, error: reportError } = await admin
    .from("weekly_reports")
    .upsert(
      {
        business_id: business.id,
        week_starts_on: weekStartsOn,
        growth_score: generated.score,
        score_explanation: generated.scoreExplanation,
        arthur_summary: generated.arthurSummary,
        opportunities: generated.opportunities
      },
      { onConflict: "business_id,week_starts_on" }
    )
    .select("id,growth_score,score_explanation,arthur_summary,opportunities,email_sent_at,created_at")
    .single();

  if (reportError || !report) {
    throw new Error("Arthur could not save weekly report");
  }

  await admin.from("actions").delete().eq("weekly_report_id", report.id);
  const { error: actionsError } = await admin.from("actions").insert(
    generated.actions.map((action) => ({
      weekly_report_id: report.id,
      title: action.title,
      priority: action.priority,
      impact: action.impact,
      reason: action.reason,
      steps: action.steps
    }))
  );

  if (actionsError) {
    throw new Error("Arthur could not save weekly actions");
  }

  await admin.from("score_history").insert({
    business_id: business.id,
    score: generated.score,
    explanation: generated.scoreExplanation
  });

  return report;
}
