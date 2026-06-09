# Arthur™ - Base de donnees V1

## Fichiers

- Migrations applicables: `supabase/migrations/*.sql`
- Reference lisible: `supabase/schema.sql`

## Tables

- `users`: profil applicatif lie a `auth.users`, role, fin d'essai gratuit.
- `businesses`: entreprise de l'utilisateur. V1 limitee a une entreprise par compte.
- `competitors`: concurrents suivis. V1 limitee a trois concurrents par entreprise.
- `weekly_reports`: rapport prepare par Arthur chaque semaine.
- `actions`: actions prioritaires du rapport.
- `content_pieces`: contenus generes ou sauvegardes.
- `score_history`: historique des scores croissance.
- `notifications`: messages app et emails suivis, avec rapport lie, identifiant Brevo et ouverture.
- `subscriptions`: etat Stripe et plan Starter/Pro.

## Auth et essai gratuit

Le trigger `on_auth_user_created` cree automatiquement:

- une ligne `users`;
- une ligne `subscriptions` en `starter` / `trialing`;
- une periode d'essai de 14 jours via `trial_ends_at`.

## RLS

Toutes les tables publiques ont Row Level Security activee.

Les utilisateurs peuvent lire et modifier uniquement leurs propres donnees. Les rapports, scores et abonnements sont majoritairement en lecture cote utilisateur; leur creation et maintenance passent par Arthur cote serveur, via admin ou `service_role`.

La fonction `current_user_is_admin()` reconnait:

- un utilisateur dont `users.role = 'admin'`;
- le role Supabase `service_role`.

## Protections complementaires

La base bloque plusieurs modifications sensibles meme si l'interface change:

- un utilisateur ne peut pas changer son role, son email applicatif ou sa fin d'essai;
- un utilisateur peut cocher une action, mais pas reecrire son contenu;
- un utilisateur peut marquer une notification comme lue, mais pas changer son message;
- une entreprise ne peut pas ajouter plus de trois concurrents en V1.

## Application

Avec Supabase CLI:

```bash
supabase db push
```

Depuis Supabase Studio:

1. Ouvrir SQL Editor.
2. Coller le contenu de `supabase/migrations/20260609120000_initial_schema.sql`.
3. Executer.

## Creer un admin

Apres creation du compte dans Supabase Auth:

```sql
update public.users
set role = 'admin'
where email = 'admin@example.com';
```
