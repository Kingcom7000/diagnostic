import { Check } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createBillingPortalSessionAction, createCheckoutSessionAction } from "./actions";

const plans = [
  {
    name: "Starter",
    id: "starter",
    price: "29€/mois",
    features: ["Score croissance", "Plan hebdomadaire", "3 contenus par mois"]
  },
  {
    name: "Pro",
    id: "pro",
    price: "59€/mois",
    features: ["Contenu illimite", "3 concurrents", "Scripts commerciaux", "Alertes"]
  }
] as const;

const statusLabels: Record<string, string> = {
  trialing: "Essai actif",
  active: "Abonnement actif",
  past_due: "Paiement a regulariser",
  canceled: "Annule",
  incomplete: "Paiement incomplet",
  unpaid: "Impaye"
};

export default async function BillingPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: subscription } = user
    ? await supabase
        .from("subscriptions")
        .select("plan,status,current_period_end,cancel_at_period_end,stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <PageHeading title="Abonnement" description="Choisissez le niveau d'aide dont Arthur a besoin pour travailler chaque semaine." />
      <div className="mb-5">
        <AuthMessage error={params?.error} message={params?.message} />
      </div>
      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Etat actuel</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusLabels[subscription?.status ?? "trialing"] ?? subscription?.status ?? "Essai actif"}
              {subscription?.current_period_end ? ` jusqu'au ${new Intl.DateTimeFormat("fr-BE").format(new Date(subscription.current_period_end))}` : ""}
            </p>
          </div>
          <Badge className="w-fit bg-primary/10 text-primary">
            Plan {subscription?.plan === "pro" ? "Pro" : "Starter"}
          </Badge>
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.name === "Pro" ? "border-primary" : undefined}>
            <CardHeader>
              {subscription?.plan === plan.id ? <Badge className="w-fit bg-secondary/25 text-foreground">Plan actuel</Badge> : null}
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-bold">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.features.map((feature) => (
                <div className="flex items-center gap-2" key={feature}>
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
              <form action={createCheckoutSessionAction}>
                <input name="plan" type="hidden" value={plan.id} />
                <Button className="w-full">
                  {subscription?.plan === plan.id ? "Revoir ce plan" : plan.name === "Pro" ? "Passer au Pro" : "Choisir Starter"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-5">
        <form action={createBillingPortalSessionAction}>
          <Button variant="outline">Gerer mon abonnement</Button>
        </form>
      </div>
    </>
  );
}
