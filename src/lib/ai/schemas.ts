export const weeklyReportJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "scoreExplanation", "arthurSummary", "opportunities", "actions"],
  properties: {
    score: {
      type: "integer"
    },
    scoreExplanation: {
      type: "string"
    },
    arthurSummary: {
      type: "string"
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        }
      }
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "priority", "impact", "reason", "steps"],
        properties: {
          title: { type: "string" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          impact: { type: "string" },
          reason: { type: "string" },
          steps: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    }
  }
} as const;

export const contentPiecesJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["pieces"],
  properties: {
    pieces: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "body"],
        properties: {
          type: {
            type: "string",
            enum: ["facebook_post", "instagram_post", "email", "newsletter"]
          },
          title: { type: "string" },
          body: { type: "string" }
        }
      }
    }
  }
} as const;
