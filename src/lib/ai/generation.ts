import { z } from "zod";
import { arthurSystemPrompt, contentPrompt, growthScorePrompt, weeklyPlanPrompt } from "@/lib/ai/prompts";
import { contentPiecesJsonSchema, weeklyReportJsonSchema } from "@/lib/ai/schemas";
import type { ContentType, WeeklyAction } from "@/types/database";

export type ArthurBusinessContext = {
  business: {
    name: string;
    sector: string;
    city: string;
    main_offer: string;
    website_url: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    google_business_url: string | null;
  };
  competitors: Array<{
    name: string;
    website_url: string | null;
  }>;
};

export type ArthurWeeklyReport = {
  score: number;
  scoreExplanation: string;
  arthurSummary: string;
  opportunities: Array<{
    title: string;
    description: string;
  }>;
  actions: WeeklyAction[];
};

export type ArthurContentPiece = {
  type: ContentType;
  title: string;
  body: string;
};

const weeklyReportSchema = z.object({
  score: z.number().int().min(0).max(100),
  scoreExplanation: z.string().min(20),
  arthurSummary: z.string().min(20),
  opportunities: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().min(10)
      })
    )
    .min(1)
    .max(3),
  actions: z
    .array(
      z.object({
        title: z.string().min(3),
        priority: z.enum(["low", "medium", "high"]),
        impact: z.string().min(10),
        reason: z.string().min(10),
        steps: z.array(z.string().min(3)).min(1).max(3)
      })
    )
    .min(3)
    .max(5)
});

const contentPiecesSchema = z.object({
  pieces: z
    .array(
      z.object({
        type: z.enum(["facebook_post", "instagram_post", "email", "newsletter"]),
        title: z.string().min(3),
        body: z.string().min(20)
      })
    )
    .min(1)
    .max(3)
});

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

function getApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return process.env.OPENAI_API_KEY;
}

function stringifyContext(context: ArthurBusinessContext) {
  return JSON.stringify(
    {
      entreprise: context.business,
      concurrents: context.competitors
    },
    null,
    2
  );
}

function extractOutputText(response: unknown) {
  if (!response || typeof response !== "object") {
    return "";
  }

  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string") {
    return direct;
  }

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.map((part) => {
        if (!part || typeof part !== "object") return "";
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      });
    })
    .join("");
}

async function createStructuredResponse<T>({
  name,
  schema,
  instructions,
  input,
  validate
}: {
  name: string;
  schema: object;
  instructions: string;
  input: string;
  validate: (value: unknown) => T;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${getApiKey()}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: getModel(),
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${detail}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);

  if (!text) {
    throw new Error("OpenAI response did not include structured text");
  }

  return validate(JSON.parse(text));
}

export async function generateArthurWeeklyReport(context: ArthurBusinessContext) {
  return createStructuredResponse<ArthurWeeklyReport>({
    name: "arthur_weekly_report",
    schema: weeklyReportJsonSchema,
    instructions: `${arthurSystemPrompt}\n${growthScorePrompt}\n${weeklyPlanPrompt}`,
    input: `
Prepare le plan de croissance de cette semaine.

Contexte:
${stringifyContext(context)}

Contraintes:
- Le resume Arthur doit commencer par "J'ai analyse".
- Les actions doivent etre concretes et faisables cette semaine.
- Les etapes doivent etre courtes, sans jargon.
`,
    validate: (value) => weeklyReportSchema.parse(value)
  });
}

export async function generateArthurContent({
  context,
  type
}: {
  context: ArthurBusinessContext;
  type: ContentType | "all";
}) {
  return createStructuredResponse<{ pieces: ArthurContentPiece[] }>({
    name: "arthur_content_pieces",
    schema: contentPiecesJsonSchema,
    instructions: `${arthurSystemPrompt}\n${contentPrompt}`,
    input: `
Prepare ${type === "all" ? "3 contenus differents" : `1 contenu de type ${type}`} pour cette entreprise.

Contexte:
${stringifyContext(context)}

Contraintes:
- Le contenu doit etre pret a copier.
- Le ton doit etre simple, chaleureux et oriente resultats.
- Termine avec une invitation naturelle a repondre ou prendre contact.
`,
    validate: (value) => contentPiecesSchema.parse(value)
  });
}
