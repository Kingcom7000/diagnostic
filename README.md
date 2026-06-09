# Arthur™

Votre responsable marketing et commercial virtuel.

Arthur aide les independants, commercants et PME a savoir quoi faire chaque semaine pour obtenir plus de clients.

## Demarrage

```bash
npm install
npm run dev
```

Copier `.env.example` vers `.env.local`, puis renseigner Supabase, OpenAI, Stripe et Brevo.

## Etat actuel

Etape 1 terminee: architecture Next.js, routes V1, composants UI, prompts IA et modules d'integration.

Etape 2 terminee: schema Supabase, migration initiale, index, triggers, essai gratuit 14 jours, limite de concurrents et politiques RLS.

Etape 3 terminee: inscription, connexion, recuperation mot de passe, protection des pages connectees, deconnexion et affichage de l'essai gratuit.

Etape 4 terminee: sauvegarde onboarding, profil entreprise, concurrents, premier diagnostic, score initial et actions de la semaine.

Etape 5 terminee: dashboard centre sur la prochaine action, avancement de la semaine, opportunites et plan hebdomadaire exploitable.

Etape 6 terminee: generation OpenAI pour score, plan hebdomadaire et contenus, avec sauvegarde Supabase.

Etape 7 terminee: emails hebdomadaires Brevo, cron Vercel, suivi d'envoi et ouverture simple.

Etape 8 terminee: Stripe Checkout, portail client, webhook abonnement et synchronisation Supabase.

Les donnees d'onboarding, dashboard, plan, historique et contenus viennent maintenant de Supabase.

## Prochaines etapes

1. Tester le parcours complet avec un vrai projet Supabase, Stripe test mode, Brevo test et OpenAI.
