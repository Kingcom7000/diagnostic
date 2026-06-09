"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { generateArthurContent } from "@/lib/ai/generation";
import { getCurrentBusinessContext } from "@/lib/domain/business-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ContentType } from "@/types/database";

const contentTypeSchema = z.enum(["facebook_post", "instagram_post", "email", "newsletter", "all"]);

export async function generateContentAction(formData: FormData) {
  const parsed = contentTypeSchema.safeParse(formData.get("content_type"));

  if (!parsed.success) {
    redirect("/contenus?error=Choisissez le type de contenu a preparer.");
  }

  const { business, context } = await getCurrentBusinessContext();

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    redirect("/contenus?error=Arthur ne peut pas sauvegarder le contenu. Ajoutez SUPABASE_SERVICE_ROLE_KEY.");
  }

  let generated: Awaited<ReturnType<typeof generateArthurContent>>;
  try {
    generated = await generateArthurContent({
      context,
      type: parsed.data
    });
  } catch {
    redirect("/contenus?error=Arthur n'a pas pu generer le contenu. Verifiez OPENAI_API_KEY et OPENAI_MODEL.");
  }

  const { error } = await admin.from("content_pieces").insert(
    generated.pieces.map((piece) => ({
      business_id: business.id,
      type: piece.type as ContentType,
      title: piece.title,
      body: piece.body,
      saved_at: new Date().toISOString()
    }))
  );

  if (error) {
    redirect("/contenus?error=Arthur a genere le contenu, mais n'a pas pu le sauvegarder.");
  }

  redirect("/contenus?message=Arthur a prepare votre contenu.");
}
