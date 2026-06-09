# Arthur™ - Architecture V1

Arthur est construit comme un collaborateur virtuel pour independants, commercants et PME. Le produit doit repondre a une question centrale: que dois-je faire cette semaine pour obtenir plus de clients ?

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, composants compatibles Shadcn UI.
- Supabase pour Auth, PostgreSQL, stockage des donnees et politiques d'acces.
- OpenAI pour score croissance, plan hebdomadaire et contenus.
- Brevo pour l'email du lundi matin.
- Stripe pour abonnements Starter et Pro.
- Vercel pour deploiement et taches planifiees.

## Routes

- `/` landing page.
- `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` auth.
- `/auth/callback` callback Supabase pour confirmation email et recuperation de mot de passe.
- `/onboarding` collecte des informations entreprise.
- `/dashboard` repond a "Que dois-je faire cette semaine ?".
- `/plan` actions detaillees.
- `/contenus` generation, copie, regeneration, sauvegarde.
- `/historique` anciens scores, plans et contenus.
- `/abonnement` gestion Stripe.
- `/admin` suivi interne.

## Modules

- `src/lib/supabase`: clients Supabase serveur et futur client navigateur.
- `src/lib/ai`: prompts internes et client OpenAI.
- `src/lib/brevo`: envoi des emails hebdomadaires.
- `src/lib/stripe`: checkout, portail client, webhooks.
- `src/lib/domain`: logique metier Arthur, donnees temporaires V1.
- `src/types`: contrats TypeScript partages.

## Etapes de livraison

1. Architecture complete. Terminee.
2. Base de donnees Supabase et RLS. Terminee.
3. Authentification et essai gratuit 14 jours. Terminee.
4. Onboarding et premier diagnostic. Terminee.
5. Dashboard et plan hebdomadaire. Terminee.
6. Generation IA. Terminee.
7. Emails hebdomadaires Brevo. Terminee.
8. Paiement Stripe. Terminee.

## Principes UX

- Mobile-first.
- Une priorite par ecran.
- Peu de choix, actions concretes.
- Arthur parle a la premiere personne.
- Pas de jargon marketing.
- Pas de tableaux complexes pour les utilisateurs non techniques.
