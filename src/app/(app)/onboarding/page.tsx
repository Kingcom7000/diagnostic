import { ArthurNote } from "@/components/arthur/arthur-note";
import { AuthMessage } from "@/components/auth/auth-message";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveOnboardingAction } from "./actions";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: business } = user
    ? await supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const { data: competitors = [] } = business
    ? await supabase
        .from("competitors")
        .select("name,website_url")
        .eq("business_id", business.id)
        .order("created_at")
    : { data: [] };
  const competitorRows = competitors ?? [];

  return (
    <>
      <PageHeading
        title="Dites a Arthur ou commencer"
        description="Quelques informations suffisent pour preparer le premier diagnostic."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form action={saveOnboardingAction} className="grid gap-5">
          <AuthMessage error={params?.error} message={params?.message} />
          <Card>
            <CardHeader>
              <CardTitle>Etape 1 - Entreprise</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Input defaultValue={business?.name ?? ""} name="name" placeholder="Nom" required />
              <Input defaultValue={business?.sector ?? ""} name="sector" placeholder="Secteur" required />
              <Input defaultValue={business?.city ?? ""} name="city" placeholder="Ville" required />
              <Input defaultValue={business?.main_offer ?? ""} name="main_offer" placeholder="Offre principale" required />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etape 2 - Presence en ligne</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Input defaultValue={business?.website_url ?? ""} name="website_url" placeholder="Site web" type="url" />
              <Input defaultValue={business?.facebook_url ?? ""} name="facebook_url" placeholder="Facebook" type="url" />
              <Input defaultValue={business?.instagram_url ?? ""} name="instagram_url" placeholder="Instagram" type="url" />
              <Input defaultValue={business?.google_business_url ?? ""} name="google_business_url" placeholder="Google Business" type="url" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etape 3 - Concurrents</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2].map((index) => (
                <div className="contents" key={index}>
                  <Input
                    defaultValue={competitorRows[index]?.name ?? ""}
                    name={`competitor_${index + 1}_name`}
                    placeholder={`Concurrent ${index + 1}`}
                  />
                  <Input
                    defaultValue={competitorRows[index]?.website_url ?? ""}
                    name={`competitor_${index + 1}_website`}
                    placeholder="Site web"
                    type="url"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etape 4 - Premier profil Arthur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Arthur va creer votre score croissance, votre premier diagnostic et trois actions utiles pour cette semaine.
              </p>
            </CardContent>
          </Card>

          <Button className="w-full sm:w-fit">Creer mon premier profil Arthur</Button>
        </form>
        <ArthurNote>
          <p>Je vais utiliser ces informations pour comprendre votre activite, comparer votre presence en ligne et choisir les premieres actions utiles.</p>
        </ArthurNote>
      </div>
    </>
  );
}
