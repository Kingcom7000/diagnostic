# Arthur™ - Paiements Stripe V1

## Plans

Arthur propose deux plans mensuels:

- Starter: 29€/mois;
- Pro: 59€/mois.

Dans Stripe, creer deux Prices recurrents mensuels, puis renseigner:

```bash
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
```

## Variables requises

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
SUPABASE_SERVICE_ROLE_KEY=
```

## Checkout

Action serveur:

- `src/app/(app)/abonnement/actions.ts`

Arthur cree ou reutilise un Customer Stripe, puis ouvre une Checkout Session en mode `subscription`.

Si l'utilisateur a encore plus de 48 heures d'essai Arthur, la session Stripe conserve cette fin d'essai via `trial_end`.

Si un abonnement Stripe existe deja pour le client, Arthur ouvre le portail client au lieu de creer un deuxieme abonnement.

## Portail client

Le bouton "Gerer mon abonnement" ouvre Stripe Customer Portal.

Le portail sert a:

- changer de moyen de paiement;
- changer de plan si configure dans Stripe;
- annuler l'abonnement;
- consulter les factures.

## Webhooks

Route:

- `src/app/api/stripe/webhook/route.ts`

Configurer dans Stripe:

```text
https://votre-domaine.com/api/stripe/webhook
```

Evenements ecoutes:

- `checkout.session.completed`;
- `customer.subscription.created`;
- `customer.subscription.updated`;
- `customer.subscription.deleted`.

Les webhooks synchronisent:

- `stripe_customer_id`;
- `stripe_subscription_id`;
- `plan`;
- `status`;
- `current_period_end`;
- `cancel_at_period_end`.

## Sources Stripe

La V1 suit le flux recommande Stripe:

- creer une Checkout Session en `subscription` mode;
- utiliser le Customer Portal pour la gestion client;
- verifier les webhooks avec la signature Stripe et le corps brut.
