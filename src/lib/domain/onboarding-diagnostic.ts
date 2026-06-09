import type { WeeklyAction } from "@/types/database";

type DiagnosticInput = {
  name: string;
  sector: string;
  city: string;
  mainOffer: string;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  googleBusinessUrl?: string | null;
  competitors: Array<{ name: string; websiteUrl?: string | null }>;
};

export function getMonday(date = new Date()) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy.toISOString().slice(0, 10);
}

export function buildInitialDiagnostic(input: DiagnosticInput) {
  const presenceScore = [
    input.websiteUrl,
    input.facebookUrl,
    input.instagramUrl,
    input.googleBusinessUrl
  ].filter(Boolean).length;
  const competitorScore = Math.min(input.competitors.length, 3);
  const baseScore = 46 + presenceScore * 7 + competitorScore * 4;
  const score = Math.min(82, Math.max(35, baseScore));

  const missingPresence = [];
  if (!input.googleBusinessUrl) missingPresence.push("votre fiche Google Business");
  if (!input.facebookUrl && !input.instagramUrl) missingPresence.push("un reseau social actif");
  if (!input.websiteUrl) missingPresence.push("une page web claire");

  const explanation =
    missingPresence.length > 0
      ? `Votre base est interessante, mais Arthur doit renforcer ${missingPresence.join(", ")} pour attirer plus de clients a ${input.city}.`
      : `Votre presence en ligne donne deja une bonne base. Arthur va maintenant chercher les actions les plus rapides pour transformer cette visibilite en demandes concretes.`;

  const opportunities = [
    {
      title: "Gagner en confiance locale",
      description: `Mettre en avant des preuves client autour de ${input.city}.`
    },
    {
      title: "Relancer les contacts chauds",
      description: `Utiliser votre offre principale, ${input.mainOffer}, pour provoquer des reponses simples.`
    },
    {
      title: "Surveiller les concurrents",
      description:
        input.competitors.length > 0
          ? "Comparer vos messages avec ceux des concurrents indiques."
          : "Ajouter au moins un concurrent pour que Arthur puisse mieux vous positionner."
    }
  ];

  const actions: WeeklyAction[] = [
    {
      title: "Demander 3 avis ou recommandations",
      priority: "high",
      impact: "Renforcer la confiance avant la prochaine prise de contact.",
      reason: "Les prospects des petites entreprises choisissent plus vite quand ils voient une preuve recente.",
      steps: [
        "Choisissez 3 clients satisfaits.",
        "Envoyez un message court avec une demande precise.",
        "Ajoutez le meilleur retour sur votre fiche ou vos reseaux."
      ]
    },
    {
      title: `Publier une offre simple autour de ${input.mainOffer}`,
      priority: "medium",
      impact: "Rendre votre offre plus facile a comprendre et a acheter.",
      reason: "Une publication claire aide les prospects a savoir rapidement si vous pouvez les aider.",
      steps: [
        "Expliquez le probleme que vous resolvez.",
        "Ajoutez un resultat concret.",
        "Terminez par une invitation a vous contacter."
      ]
    },
    {
      title: "Comparer votre message avec un concurrent",
      priority: "medium",
      impact: "Trouver un angle plus clair pour vous differencier.",
      reason: "Arthur a besoin de voir ce que les clients comparent avant de vous choisir.",
      steps: [
        "Ouvrez le site ou la page d'un concurrent.",
        "Notez sa promesse principale.",
        "Ecrivez une phrase plus concrete pour votre propre offre."
      ]
    }
  ];

  return {
    score,
    explanation,
    opportunities,
    summary: `J'ai cree le premier profil de ${input.name}. Cette semaine, je vous recommande de renforcer la confiance, clarifier votre offre et observer vos concurrents pour obtenir plus de demandes.`,
    actions
  };
}
