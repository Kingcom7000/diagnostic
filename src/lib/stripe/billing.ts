import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import type { SubscriptionPlan } from "@/types/database";

type SupabaseAdmin = ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdminClient>;

type UserForBilling = {
  id: string;
  email: string;
  full_name: string | null;
  trial_ends_at: string;
};

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getPriceIdForPlan(plan: SubscriptionPlan) {
  const priceId =
    plan === "starter"
      ? process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error(`Stripe price id is missing for ${plan}`);
  }

  return priceId;
}

export function getPlanFromPriceId(priceId: string | null | undefined): SubscriptionPlan {
  if (priceId && priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  return "starter";
}

export function getTrialEndTimestamp(trialEndsAt: string) {
  const trialEnd = Math.floor(new Date(trialEndsAt).getTime() / 1000);
  const minimumStripeTrialEnd = Math.floor(Date.now() / 1000) + 48 * 60 * 60;

  return trialEnd > minimumStripeTrialEnd ? trialEnd : undefined;
}

export async function getOrCreateStripeCustomer({
  admin,
  user
}: {
  admin: SupabaseAdmin;
  user: UserForBilling;
}) {
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name ?? undefined,
    metadata: {
      user_id: user.id
    }
  });

  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      stripe_customer_id: customer.id
    },
    { onConflict: "user_id" }
  );

  return customer.id;
}

export async function syncStripeSubscription({
  admin,
  subscription
}: {
  admin: SupabaseAdmin;
  subscription: Stripe.Subscription;
}) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);
  const userId =
    typeof subscription.metadata?.user_id === "string" && subscription.metadata.user_id
      ? subscription.metadata.user_id
      : null;

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    resolvedUserId = data?.user_id ?? null;
  }

  if (!resolvedUserId) {
    throw new Error("No Arthur user found for Stripe subscription");
  }

  await admin.from("subscriptions").upsert(
    {
      user_id: resolvedUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end
    },
    { onConflict: "user_id" }
  );
}

export async function clearDeletedStripeSubscription({
  admin,
  subscription
}: {
  admin: SupabaseAdmin;
  subscription: Stripe.Subscription;
}) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null
    })
    .eq("stripe_customer_id", customerId);
}
