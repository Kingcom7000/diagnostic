import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { ArthurNote } from "@/components/arthur/arthur-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  "Savoir quoi faire chaque semaine",
  "Trouver plus d'opportunites locales",
  "Publier sans passer des heures a chercher des idees",
  "Suivre vos progres simplement"
];

export default function LandingPage() {
  return (
    <main className="bg-background">
      <section className="border-b bg-white">
        <div className="mx-auto grid min-h-[92vh] max-w-6xl content-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-primary/10 text-primary">Arthur™ travaille chaque lundi matin</Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal sm:text-5xl lg:text-6xl">
              Chaque lundi matin, Arthur vous dit exactement quoi faire pour obtenir plus de clients.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Arthur est votre responsable marketing et commercial virtuel. Il analyse votre activite, repere les opportunites et prepare vos actions de la semaine.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/inscription">
                  Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/connexion">Se connecter</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full rounded-lg border bg-background p-4 shadow-sm">
              <ArthurNote label="Lundi 08:00">
                <p>Bonjour Marc,</p>
                <p className="mt-3">
                  J'ai analyse votre activite. Voici les 3 actions qui auront le plus d'impact cette semaine.
                </p>
              </ArthurNote>
              <div className="mt-4 grid gap-3">
                {["Relancer 10 clients satisfaits", "Publier une preuve client", "Mettre a jour la fiche Google"].map((item) => (
                  <div className="flex items-center gap-3 rounded-md bg-white p-4" key={item}>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Le probleme", "Vous devez vendre, publier, relancer, analyser vos concurrents et gerer vos clients. Tout seul."],
            ["La solution", "Arthur transforme vos informations en actions concretes, courtes et faisables cette semaine."],
            ["Le resultat", "Vous avancez avec un plan simple, du contenu pret et une vision claire de vos priorites."]
          ].map(([title, text]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">Ce qu'Arthur prepare pour vous</h2>
            <div className="mt-6 grid gap-4">
              {benefits.map((benefit) => (
                <div className="flex gap-3" key={benefit}>
                  <Sparkles className="mt-1 h-5 w-5 text-accent" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Exemple de plan hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Quoi faire", "Demander 3 avis Google a vos meilleurs clients."],
                ["Pourquoi", "Les avis recents augmentent la confiance et les appels."],
                ["Comment", "Envoyer un message court avec le lien direct de votre fiche."]
              ].map(([label, text]) => (
                <div key={label}>
                  <p className="text-sm font-semibold text-primary">{label}</p>
                  <p className="mt-1 text-muted-foreground">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {["Arthur m'a aide a reprendre le controle de ma semaine.", "Je sais enfin quoi publier et qui relancer.", "Simple, concret, sans jargon."].map((quote) => (
            <Card key={quote}>
              <CardContent className="pt-5">
                <p className="text-muted-foreground">"{quote}"</p>
                <p className="mt-4 font-semibold">Client pilote</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">Laissez Arthur preparer votre prochaine semaine.</h2>
            <p className="mt-2 opacity-90">Essai gratuit 14 jours. Aucun jargon. Des actions claires.</p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href="/inscription">
              Commencer <Mail className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
