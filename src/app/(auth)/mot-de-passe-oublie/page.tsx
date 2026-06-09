import Link from "next/link";
import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recevoir un lien de connexion</CardTitle>
          <p className="text-sm text-muted-foreground">Arthur vous enverra un lien pour revenir dans votre espace.</p>
        </CardHeader>
        <CardContent>
          <form action={requestPasswordResetAction} className="space-y-4">
            <AuthMessage error={params?.error} message={params?.message} />
            <Input autoComplete="email" name="email" placeholder="Email" required type="email" />
            <Button className="w-full">Envoyer le lien</Button>
            <Link className="block text-center text-sm text-primary" href="/connexion">Retour a la connexion</Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
