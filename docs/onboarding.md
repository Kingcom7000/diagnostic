# Arthur™ - Onboarding V1

## Ce qui est sauvegarde

L'onboarding cree ou met a jour:

- `businesses`: nom, secteur, ville, offre principale, presence en ligne;
- `competitors`: 0 a 3 concurrents;
- `weekly_reports`: premier diagnostic Arthur pour la semaine en cours;
- `actions`: trois actions prioritaires initiales;
- `score_history`: premier score croissance.

## Diagnostic initial

Le diagnostic initial est volontairement deterministe pour la V1. Il donne une experience utile avant le branchement OpenAI complet.

Le module `src/lib/domain/onboarding-diagnostic.ts` calcule:

- un score croissance;
- une explication simple;
- des opportunites;
- un resume Arthur;
- trois actions concretes.

La generation IA avancee reste prevue a l'etape 6.

## Ecriture Supabase

L'action serveur `saveOnboardingAction` verifie l'utilisateur connecte avec Supabase Auth, puis utilise `SUPABASE_SERVICE_ROLE_KEY` pour creer les donnees produites par Arthur.

Cette separation garde l'intention produit claire:

- l'utilisateur renseigne son entreprise;
- Arthur cree le diagnostic, le score et les actions.

## Apres validation

Une fois l'onboarding termine, l'utilisateur est redirige vers `/dashboard`, qui lit le premier profil Arthur depuis Supabase.
