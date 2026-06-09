"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function toggleActionCompletionAction(formData: FormData) {
  const actionId = String(formData.get("action_id") ?? "");
  const isCompleted = String(formData.get("is_completed") ?? "") === "true";

  if (!actionId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  await supabase
    .from("actions")
    .update({
      completed_at: isCompleted ? null : new Date().toISOString()
    })
    .eq("id", actionId);

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}
