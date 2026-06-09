import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { clearDeletedStripeSubscription, syncStripeSubscription } from "@/lib/stripe/billing";
import { getStripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is missing" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Stripe signature is missing" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncStripeSubscription({ admin, subscription });
        }

        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncStripeSubscription({
          admin,
          subscription: event.data.object as Stripe.Subscription
        });
        break;
      }
      case "customer.subscription.deleted": {
        await clearDeletedStripeSubscription({
          admin,
          subscription: event.data.object as Stripe.Subscription
        });
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Stripe webhook could not be processed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
