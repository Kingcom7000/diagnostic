import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Retrouver Arthur</CardTitle>
          <p className="text-sm text-muted-foreground">Connectez-vous pour voir ce qu'Arthur a prepare.</p>
        </CardHeader>
        <CardContent>
          <form action={signInAction} className="space-y-4">
            <AuthMessage error={params?.error} message={params?.message} />
            <Input autoComplete="email" name="email" placeholder="Email" required type="email" />
            <Input autoComplete="current-password" name="password" placeholder="Mot de passe" required type="password" />
            <Button className="w-full">Connexion</Button>
            <div className="flex justify-between text-sm">
              <Link className="text-primary" href="/mot-de-passe-oublie">Mot de passe oublie</Link>
              <Link className="text-primary" href="/inscription">Creer un compte</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
