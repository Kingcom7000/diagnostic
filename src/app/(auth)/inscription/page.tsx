import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SignupPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Arthur commence lundi</CardTitle>
          <p className="text-sm text-muted-foreground">14 jours gratuits pour recevoir votre premier plan de croissance.</p>
        </CardHeader>
        <CardContent>
          <form action={signUpAction} className="space-y-4">
            <AuthMessage error={params?.error} message={params?.message} />
            <Input autoComplete="name" name="full_name" placeholder="Votre nom" required />
            <Input autoComplete="email" name="email" placeholder="Email" required type="email" />
            <Input autoComplete="new-password" minLength={8} name="password" placeholder="Mot de passe" required type="password" />
            <Button className="w-full">Demarrer l'essai gratuit</Button>
            <p className="text-center text-sm text-muted-foreground">
              Deja inscrit ? <Link className="text-primary" href="/connexion">Connexion</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
