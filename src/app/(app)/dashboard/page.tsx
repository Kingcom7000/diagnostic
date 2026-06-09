import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Sparkles, TrendingUp } from "lucide-react";
import { ArthurNote } from "@/components/arthur/arthur-note";
import { AuthMessage } from "@/components/auth/auth-message";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionPriority, Json } from "@/types/database";
import { toggleActionCompletionAction } from "../plan/actions";
import { generateWeeklyReportAction } from "./actions";

const priorityLabels: Record<ActionPriority, string> = {
  high: "Impact fort",
  medium: "Important",
  low: "A faire si possible"
};

type Opportunity = {
  title: string;
  description: string;
};

function asOpportunities(value: Json): Opportunity[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const opportunity = item as Record<string, unknown>;
      const title = opportunity.title;
      const description = opportunity.description;

      if (typeof title !== "string" || typeof description !== "string") {
        return null;
      }

      return { title, description };
    })
    .filter((item): item is Opportunity => Boolean(item));
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();
  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,city,main_offer")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id,growth_score,score_explanation,arthur_summary,opportunities,created_at")
    .eq("business_id", business.id)
    .order("week_starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!report) {
    redirect("/onboarding");
  }

  const { data: actions = [] } = await supabase
    .from("actions")
    .select("id,title,priority,impact,reason,completed_at")
    .eq("weekly_report_id", report.id)
    .order("created_at");
  const actionRows = actions ?? [];
  const { data: scores = [] } = await supabase
    .from("score_history")
    .select("score,recorded_at")
    .eq("business_id", business.id)
    .order("recorded_at", { ascending: false })
    .limit(2);
  const completedActions = actionRows.filter((action) => action.completed_at).length;
  const completionRate = actionRows.length > 0 ? Math.round((completedActions / actionRows.length) * 100) : 0;
  const nextAction = actionRows.find((action) => !action.completed_at) ?? actionRows[0];
  const previousScore = scores?.[1]?.score;
  const scoreDelta = typeof previousScore === "number" ? report.growth_score - previousScore : null;
  const opportunities = asOpportunities(report.opportunities as Json);
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <>
      <PageHeading title="Que dois-je faire cette semaine ?" description="Arthur a choisi les priorites les plus utiles pour obtenir plus de clients." />
      <div className="mb-5">
        <AuthMessage error={params?.error} message={params?.message} />
      </div>
      <form action={generateWeeklyReportAction} className="mb-5">
        <Button variant="outline">
          <Sparkles className="h-4 w-4" />
          Generer le plan avec Arthur
        </Button>
      </form>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Score croissance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-bold">{report.growth_score}</span>
              <span className="pb-2 text-muted-foreground">/100</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                {scoreDelta === null ? `Premier profil cree pour ${business.name}` : `${scoreDelta >= 0 ? "+" : ""}${scoreDelta} point${Math.abs(scoreDelta) > 1 ? "s" : ""}`}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{report.score_explanation}</p>
          </CardContent>
        </Card>
        <ArthurNote>
          <p>Bonjour{firstName ? ` ${firstName}` : ""},</p>
          <p className="mt-3">{report.arthur_summary}</p>
        </ArthurNote>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-primary/25">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <CardTitle>La prochaine action</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {nextAction ? (
              <div className="space-y-4">
                <div>
                  <Badge className="bg-secondary/25 text-foreground">{priorityLabels[nextAction.priority as ActionPriority]}</Badge>
                  <h2 className="mt-3 text-2xl font-bold">{nextAction.title}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">{nextAction.impact}</p>
                </div>
                <form action={toggleActionCompletionAction} className="flex flex-col gap-3 sm:flex-row">
                  <input name="action_id" type="hidden" value={nextAction.id} />
                  <input name="is_completed" type="hidden" value={String(Boolean(nextAction.completed_at))} />
                  <Button>
                    <ClipboardCheck className="h-4 w-4" />
                    {nextAction.completed_at ? "Remettre a faire" : "Je l'ai faite"}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/plan">
                      Voir le plan <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-muted-foreground">Arthur n'a pas encore prepare d'action.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avancement de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">{completedActions}/{actionRows.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">actions terminees</p>
              </div>
              <p className="text-lg font-semibold text-primary">{completionRate}%</p>
            </div>
            <div className="mt-5 h-3 rounded-full bg-muted">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {completedActions === actionRows.length && actionRows.length > 0
                ? "J'ai tout ce qu'il faut pour mesurer vos progres cette semaine."
                : "Cochez les actions terminees pour que je suive votre progression."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {actionRows.map((action) => (
          <Card key={action.title}>
            <CardHeader>
              <Badge className="w-fit bg-secondary/25 text-foreground">
                {priorityLabels[action.priority as ActionPriority]}
              </Badge>
              <CardTitle>{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{action.reason}</p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                {action.completed_at ? "Action cochee" : "A faire cette semaine"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {opportunities.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-3 text-xl font-bold">Opportunites detectees</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.title}>
                <CardContent className="pt-5">
                  <p className="font-semibold">{opportunity.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{opportunity.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
