"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Adresse email invalide");
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres");

function authRedirect(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

async function getAppUrl() {
  const headerStore = await headers();
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `${headerStore.get("x-forwarded-proto") ?? "http"}://${headerStore.get("host")}`
  );
}

export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));

  if (!fullName) {
    authRedirect("/inscription", "error", "Indiquez votre nom pour qu'Arthur personnalise votre espace.");
  }

  if (!email.success) {
    authRedirect("/inscription", "error", email.error.issues[0]?.message ?? "Email invalide.");
  }

  if (!password.success) {
    authRedirect("/inscription", "error", password.error.issues[0]?.message ?? "Mot de passe invalide.");
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = await getAppUrl();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`
    }
  });

  if (error) {
    authRedirect("/inscription", "error", error.message);
  }

  if (data.session) {
    redirect("/onboarding");
  }

  authRedirect(
    "/connexion",
    "message",
    "Arthur a cree votre espace. Verifiez votre email pour activer la connexion."
  );
}

export async function signInAction(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = z.string().min(1, "Mot de passe requis").safeParse(formData.get("password"));

  if (!email.success) {
    authRedirect("/connexion", "error", email.error.issues[0]?.message ?? "Email invalide.");
  }

  if (!password.success) {
    authRedirect("/connexion", "error", password.error.issues[0]?.message ?? "Mot de passe requis.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data
  });

  if (error) {
    authRedirect("/connexion", "error", "Connexion impossible. Verifiez votre email et votre mot de passe.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    authRedirect("/connexion", "error", "Connexion impossible. Reessayez dans un instant.");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  redirect(business ? "/dashboard" : "/onboarding");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));

  if (!email.success) {
    authRedirect("/mot-de-passe-oublie", "error", email.error.issues[0]?.message ?? "Email invalide.");
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = await getAppUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appUrl}/auth/callback?next=/nouveau-mot-de-passe`
  });

  if (error) {
    authRedirect("/mot-de-passe-oublie", "error", error.message);
  }

  authRedirect(
    "/connexion",
    "message",
    "Arthur vous a envoye un lien pour choisir un nouveau mot de passe."
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = passwordSchema.safeParse(formData.get("password"));

  if (!password.success) {
    authRedirect("/nouveau-mot-de-passe", "error", password.error.issues[0]?.message ?? "Mot de passe invalide.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: password.data
  });

  if (error) {
    authRedirect("/nouveau-mot-de-passe", "error", "Le lien a expire. Demandez un nouveau lien.");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
