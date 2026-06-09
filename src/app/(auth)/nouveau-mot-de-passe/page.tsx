import { updatePasswordAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function NewPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choisir un nouveau mot de passe</CardTitle>
          <p className="text-sm text-muted-foreground">Arthur securise votre espace avant de vous ramener au dashboard.</p>
        </CardHeader>
        <CardContent>
          <form action={updatePasswordAction} className="space-y-4">
            <AuthMessage error={params?.error} message={params?.message} />
            <Input autoComplete="new-password" minLength={8} name="password" placeholder="Nouveau mot de passe" required type="password" />
            <Button className="w-full">Mettre a jour</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
