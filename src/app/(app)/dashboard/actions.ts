"use server";

import { redirect } from "next/navigation";
import { createWeeklyReportForBusiness } from "@/lib/domain/weekly-report";
import { getCurrentBusinessContext } from "@/lib/domain/business-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function generateWeeklyReportAction() {
  const { business } = await getCurrentBusinessContext();

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    redirect("/dashboard?error=Arthur ne peut pas encore generer le plan. Ajoutez SUPABASE_SERVICE_ROLE_KEY.");
  }

  try {
    await createWeeklyReportForBusiness({
      admin,
      business,
      force: true
    });
  } catch {
    redirect("/dashboard?error=Arthur n'a pas pu joindre OpenAI. Verifiez OPENAI_API_KEY et OPENAI_MODEL.");
  }

  redirect("/dashboard?message=Arthur a genere votre nouveau plan de croissance.");
}
