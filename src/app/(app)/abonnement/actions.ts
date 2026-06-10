"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppUrl, getOrCreateStripeCustomer, getPriceIdForPlan, getTrialEndTimestamp } from "@/lib/stripe/billing";
import { getStripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/types/database";

const planSchema = z.enum(["starter", "pro"]);

async function getCurrentBillingUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id,email,full_name,trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/connexion");
  }

  return profile;
}

export async function createCheckoutSessionAction(formData: FormData) {
  const parsed = planSchema.safeParse(formData.get("plan"));

  if (!parsed.success) {
    redirect("/abonnement?error=Choisissez un abonnement.");
  }

  const profile = await getCurrentBillingUser();
  let admin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    admin = createSupabaseAdminClient();
  } catch {
    redirect("/abonnement?error=Arthur ne peut pas encore ouvrir Stripe. Ajoutez SUPABASE_SERVICE_ROLE_KEY.");
  }

  let sessionUrl: string | null = null;

  try {
    const stripe = getStripe();
    const customer = await getOrCreateStripeCustomer({ admin, user: profile });
    const { data: existingSubscription } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id,status")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (
      existingSubscription?.stripe_subscription_id &&
      ["active", "trialing", "past_due"].includes(existingSubscription.status)
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer,
        return_url: `${getAppUrl()}/abonnement`
      });
      sessionUrl = portal.url;
    } else {
      const plan = parsed.data as SubscriptionPlan;
      const trialEnd = getTrialEndTimestamp(profile.trial_ends_at);
      const appUrl = getAppUrl();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [
          {
            price: getPriceIdForPlan(plan),
            quantity: 1
          }
        ],
        subscription_data: {
          metadata: {
            user_id: profile.id,
            plan
          },
          ...(trialEnd ? { trial_end: trialEnd } : {})
        },
        success_url: `${appUrl}/abonnement?message=Arthur a active votre abonnement.`,
        cancel_url: `${appUrl}/abonnement?message=Vous pouvez choisir un plan quand vous etes pret.`
      });

      sessionUrl = session.url;
    }
  } catch {
    redirect("/abonnement?error=Arthur n'a pas pu ouvrir Stripe. Verifiez les cles et les Price IDs.");
  }

  if (!sessionUrl) {
    redirect("/abonnement?error=Stripe n'a pas retourne de lien de paiement.");
  }

  redirect(sessionUrl as never);
}

export async function createBillingPortalSessionAction() {
  const profile = await getCurrentBillingUser();
  let admin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    admin = createSupabaseAdminClient();
  } catch {
    redirect("/abonnement?error=Arthur ne peut pas ouvrir le portail. Ajoutez SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    redirect("/abonnement?error=Choisissez d'abord un abonnement.");
  }

  let portalUrl: string | null = null;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getAppUrl()}/abonnement`
    });
    portalUrl = session.url;
  } catch {
    redirect("/abonnement?error=Arthur n'a pas pu ouvrir le portail Stripe.");
  }

  if (!portalUrl) {
    redirect("/abonnement?error=Stripe n'a pas retourne de portail client.");
  }

  redirect(portalSession.url as never);
}
