# Arthur™ - Authentification V1

## Ce qui est branche

- Inscription avec Supabase Auth.
- Connexion email / mot de passe.
- Recuperation de mot de passe.
- Mise a jour du mot de passe apres lien email.
- Deconnexion depuis l'espace Arthur.
- Protection des pages connectees par middleware.
- Redirection vers `/onboarding` si l'utilisateur n'a pas encore d'entreprise.
- Affichage du nombre de jours restants dans l'essai gratuit.

## Essai gratuit

L'essai gratuit de 14 jours est cree par la base de donnees au moment de l'inscription.

Le trigger `on_auth_user_created` cree:

- `public.users.trial_ends_at`;
- `public.subscriptions` avec `plan = 'starter'` et `status = 'trialing'`.

L'interface lit ensuite `trial_ends_at` pour afficher le temps restant dans la barre laterale.

## URLs Supabase

Dans Supabase Auth, configurer:

- Site URL: l'URL de l'application, par exemple `http://localhost:3000`.
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/onboarding`
  - `http://localhost:3000/nouveau-mot-de-passe`

En production, ajouter les memes URLs avec le domaine Vercel.

## Fichiers principaux

- `src/app/(auth)/actions.ts`: actions serveur inscription, connexion, reset et deconnexion.
- `src/app/auth/callback/route.ts`: echange le code email Supabase contre une session.
- `src/lib/supabase/middleware.ts`: protege les routes connectees.
- `src/app/(app)/layout.tsx`: charge le profil et l'essai gratuit.
- `src/components/layout/app-shell.tsx`: affiche l'etat de l'essai.

## Suite

L'onboarding est maintenant sauvegarde a l'etape 4. Voir `docs/onboarding.md`.
