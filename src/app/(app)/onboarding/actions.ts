"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { generateArthurWeeklyReport } from "@/lib/ai/generation";
import { buildInitialDiagnostic, getMonday } from "@/lib/domain/onboarding-diagnostic";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z
    .string()
    .regex(/^https?:\/\/.+/i, "Ajoutez une adresse qui commence par http:// ou https://")
    .nullable()
);

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom de votre entreprise."),
  sector: z.string().trim().min(2, "Indiquez votre secteur."),
  city: z.string().trim().min(2, "Indiquez votre ville."),
  mainOffer: z.string().trim().min(3, "Indiquez votre offre principale."),
  websiteUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  googleBusinessUrl: optionalUrl,
  competitor1Name: z.string().trim().optional(),
  competitor1Website: optionalUrl,
  competitor2Name: z.string().trim().optional(),
  competitor2Website: optionalUrl,
  competitor3Name: z.string().trim().optional(),
  competitor3Website: optionalUrl
});

function onboardingRedirect(error: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(error)}`);
}

export async function saveOnboardingAction(formData: FormData) {
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    sector: formData.get("sector"),
    city: formData.get("city"),
    mainOffer: formData.get("main_offer"),
    websiteUrl: formData.get("website_url"),
    facebookUrl: formData.get("facebook_url"),
    instagramUrl: formData.get("instagram_url"),
    googleBusinessUrl: formData.get("google_business_url"),
    competitor1Name: formData.get("competitor_1_name"),
    competitor1Website: formData.get("competitor_1_website"),
    competitor2Name: formData.get("competitor_2_name"),
    competitor2Website: formData.get("competitor_2_website"),
    competitor3Name: formData.get("competitor_3_name"),
    competitor3Website: formData.get("competitor_3_website")
  });

  if (!parsed.success) {
    onboardingRedirect(parsed.error.issues[0]?.message ?? "Arthur a besoin de quelques informations en plus.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/connexion");
  }

  const values = parsed.data;
  const competitors = [
    { name: values.competitor1Name, websiteUrl: values.competitor1Website },
    { name: values.competitor2Name, websiteUrl: values.competitor2Website },
    { name: values.competitor3Name, websiteUrl: values.competitor3Website }
  ]
    .filter((competitor) => competitor.name)
    .map((competitor) => ({
      name: competitor.name!,
      websiteUrl: competitor.websiteUrl
    }));

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    onboardingRedirect("Arthur ne peut pas encore sauvegarder le profil. Ajoutez la cle SUPABASE_SERVICE_ROLE_KEY.");
  }
  const { data: business, error: businessError } = await admin
    .from("businesses")
    .upsert(
      {
        user_id: user.id,
        name: values.name,
        sector: values.sector,
        city: values.city,
        main_offer: values.mainOffer,
        website_url: values.websiteUrl,
        facebook_url: values.facebookUrl,
        instagram_url: values.instagramUrl,
        google_business_url: values.googleBusinessUrl,
        onboarding_completed_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (businessError || !business) {
    onboardingRedirect("Arthur n'a pas pu enregistrer votre entreprise. Reessayez dans un instant.");
  }

  await admin.from("competitors").delete().eq("business_id", business.id);

  if (competitors.length > 0) {
    const { error: competitorsError } = await admin.from("competitors").insert(
      competitors.map((competitor) => ({
        business_id: business.id,
        name: competitor.name,
        website_url: competitor.websiteUrl
      }))
    );

    if (competitorsError) {
      onboardingRedirect("Arthur n'a pas pu enregistrer les concurrents. Verifiez les informations.");
    }
  }

  const fallbackDiagnostic = buildInitialDiagnostic({
    name: values.name,
    sector: values.sector,
    city: values.city,
    mainOffer: values.mainOffer,
    websiteUrl: values.websiteUrl,
    facebookUrl: values.facebookUrl,
    instagramUrl: values.instagramUrl,
    googleBusinessUrl: values.googleBusinessUrl,
    competitors
  });
  let diagnostic = {
    score: fallbackDiagnostic.score,
    explanation: fallbackDiagnostic.explanation,
    opportunities: fallbackDiagnostic.opportunities,
    summary: fallbackDiagnostic.summary,
    actions: fallbackDiagnostic.actions
  };

  if (process.env.OPENAI_API_KEY) {
    try {
      const generated = await generateArthurWeeklyReport({
        business: {
          name: values.name,
          sector: values.sector,
          city: values.city,
          main_offer: values.mainOffer,
          website_url: values.websiteUrl,
          facebook_url: values.facebookUrl,
          instagram_url: values.instagramUrl,
          google_business_url: values.googleBusinessUrl
        },
        competitors: competitors.map((competitor) => ({
          name: competitor.name,
          website_url: competitor.websiteUrl
        }))
      });

      diagnostic = {
        score: generated.score,
        explanation: generated.scoreExplanation,
        opportunities: generated.opportunities,
        summary: generated.arthurSummary,
        actions: generated.actions
      };
    } catch {
      diagnostic = {
        score: fallbackDiagnostic.score,
        explanation: fallbackDiagnostic.explanation,
        opportunities: fallbackDiagnostic.opportunities,
        summary: fallbackDiagnostic.summary,
        actions: fallbackDiagnostic.actions
      };
    }
  }
  const weekStartsOn = getMonday();

  const { data: report, error: reportError } = await admin
    .from("weekly_reports")
    .upsert(
      {
        business_id: business.id,
        week_starts_on: weekStartsOn,
        growth_score: diagnostic.score,
        score_explanation: diagnostic.explanation,
        arthur_summary: diagnostic.summary,
        opportunities: diagnostic.opportunities
      },
      { onConflict: "business_id,week_starts_on" }
    )
    .select("id")
    .single();

  if (reportError || !report) {
    onboardingRedirect("Arthur n'a pas pu creer votre premier diagnostic.");
  }

  await admin.from("actions").delete().eq("weekly_report_id", report.id);
  const { error: actionsError } = await admin.from("actions").insert(
    diagnostic.actions.map((action) => ({
      weekly_report_id: report.id,
      title: action.title,
      priority: action.priority,
      impact: action.impact,
      reason: action.reason,
      steps: action.steps
    }))
  );

  if (actionsError) {
    onboardingRedirect("Arthur n'a pas pu preparer les actions de la semaine.");
  }

  await admin.from("score_history").insert({
    business_id: business.id,
    score: diagnostic.score,
    explanation: diagnostic.explanation
  });

  redirect("/dashboard?message=Arthur a cree votre premier profil entreprise.");
}
