# Arthur™ - Dashboard V1

## Question centrale

Le dashboard repond a une seule question:

> Que dois-je faire cette semaine ?

## Donnees utilisees

Le dashboard lit maintenant les donnees Supabase creees pendant l'onboarding:

- `businesses`: nom de l'entreprise;
- `weekly_reports`: score, explication, resume Arthur, opportunites;
- `actions`: actions prioritaires et etat de completion;
- `score_history`: comparaison avec le score precedent.

## Experience utilisateur

L'ecran met en avant:

- le score croissance;
- le message Arthur;
- la prochaine action a faire;
- l'avancement de la semaine;
- les 3 actions prioritaires;
- les opportunites detectees.

Les actions peuvent etre cochees depuis le dashboard ou depuis le plan de la semaine. Les deux pages sont revalidees apres chaque changement.

## Limite volontaire

Le contenu du rapport initial vient encore du diagnostic deterministe V1. L'etape 6 remplacera cette logique par OpenAI pour generer des plans hebdomadaires plus personnalises.
