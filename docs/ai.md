# Arthur™ - Generation IA V1

## Modele

Arthur utilise OpenAI via la Responses API avec sortie structuree.

Variable par defaut:

```bash
OPENAI_MODEL=gpt-5.4-mini
```

Le modele est configurable pour permettre un arbitrage cout / qualite sans changer le code.

## Variables requises

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` est utilisee pour sauvegarder les donnees produites par Arthur: rapports, actions, scores et contenus.

## Ce qui est genere

### Score et plan hebdomadaire

Action serveur:

- `src/app/(app)/dashboard/actions.ts`

Arthur genere:

- score 0 a 100;
- explication du score;
- resume Arthur a la premiere personne;
- opportunites;
- 3 a 5 actions avec priorite, impact, raison et maximum 3 etapes.

Les resultats sont sauvegardes dans:

- `weekly_reports`;
- `actions`;
- `score_history`.

### Premier diagnostic onboarding

L'onboarding utilise OpenAI si `OPENAI_API_KEY` existe. Si OpenAI n'est pas configure ou echoue, Arthur utilise le diagnostic deterministe V1 pour ne pas bloquer l'inscription.

### Contenus

Action serveur:

- `src/app/(app)/contenus/actions.ts`

Arthur genere:

- publications Facebook;
- publications Instagram;
- emails;
- newsletters;
- ou 3 contenus differents.

Les contenus sont sauvegardes dans `content_pieces`.

## Validation

Les sorties OpenAI passent par:

- schema JSON strict envoye a OpenAI;
- validation Zod cote serveur.

Fichiers:

- `src/lib/ai/generation.ts`;
- `src/lib/ai/schemas.ts`;
- `src/lib/ai/prompts.ts`.

## Sources OpenAI

La documentation OpenAI indique que les modeles recents sont disponibles via Responses API et les SDKs, et que les modeles compares supportent les Structured outputs. Elle recommande `gpt-5.5` pour les usages de production les plus exigeants et des variantes plus petites comme `gpt-5.4-mini` ou `gpt-5.4-nano` pour optimiser cout et latence.
