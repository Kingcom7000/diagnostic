import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArthurBusinessContext } from "@/lib/ai/generation";

export async function getCurrentBusinessContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,sector,city,main_offer,website_url,facebook_url,instagram_url,google_business_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: competitors = [] } = await supabase
    .from("competitors")
    .select("name,website_url")
    .eq("business_id", business.id)
    .order("created_at");

  const context: ArthurBusinessContext = {
    business: {
      name: business.name,
      sector: business.sector,
      city: business.city,
      main_offer: business.main_offer,
      website_url: business.website_url,
      facebook_url: business.facebook_url,
      instagram_url: business.instagram_url,
      google_business_url: business.google_business_url
    },
    competitors: competitors ?? []
  };

  return {
    user,
    business,
    context
  };
}
