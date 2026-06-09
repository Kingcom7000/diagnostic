# Arthur™ - Emails hebdomadaires V1

## Objectif

Chaque lundi matin, Arthur envoie:

- le score croissance;
- les opportunites detectees;
- les actions de la semaine;
- un contenu pret a utiliser;
- un lien vers le dashboard.

Objet:

```text
Arthur a prepare votre plan de croissance.
```

## Brevo

Arthur utilise l'API transactionnelle Brevo:

```text
POST https://api.brevo.com/v3/smtp/email
```

Variables requises:

```bash
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Arthur
```

## Cron Vercel

Le fichier `vercel.json` planifie:

```json
{
  "path": "/api/cron/weekly-email",
  "schedule": "0 7 * * 1"
}
```

Cela lance l'envoi chaque lundi a 07:00 UTC, soit 08:00 ou 09:00 en Belgique selon l'heure d'hiver/ete.

La route est protegee par:

```bash
CRON_SECRET=
```

En production, l'appel doit envoyer:

```text
Authorization: Bearer <CRON_SECRET>
```

## Flux technique

Route:

- `src/app/api/cron/weekly-email/route.ts`

Service:

- `src/lib/brevo/weekly-email.ts`

Arthur:

1. lit les entreprises avec onboarding termine;
2. ignore les comptes dont l'abonnement n'est pas `trialing` ou `active`;
3. cree le rapport hebdomadaire si necessaire;
4. prepare les actions;
5. ajoute un contenu pret si possible;
6. cree une notification email;
7. envoie via Brevo;
8. marque `weekly_reports.email_sent_at`;
9. stocke la reponse Brevo dans `notifications.metadata`.

## Suivi d'ouverture

L'email contient un pixel:

```text
/api/email/open/:notificationId.png
```

Cette route met a jour `notifications.opened_at`. Ce suivi est volontairement simple pour la V1; Brevo webhooks pourront etre ajoutes plus tard.

## Limites V1

- Pas encore de preference utilisateur pour desactiver l'email.
- Pas encore de webhook Brevo pour bounce, delivered, clicked.
- Pas encore de segmentation avancee par plan Starter/Pro.
