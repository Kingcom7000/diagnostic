import { redirect } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { ArthurNote } from "@/components/arthur/arthur-note";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionPriority, Json } from "@/types/database";
import { toggleActionCompletionAction } from "./actions";

const priorityLabels: Record<ActionPriority, string> = {
  high: "Impact fort",
  medium: "Important",
  low: "A faire si possible"
};

function asSteps(steps: Json): string[] {
  return Array.isArray(steps) ? steps.filter((step): step is string => typeof step === "string") : [];
}

export default async function PlanPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id")
    .eq("business_id", business.id)
    .order("week_starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!report) {
    redirect("/onboarding");
  }

  const { data: actions = [] } = await supabase
    .from("actions")
    .select("id,title,priority,impact,reason,steps,completed_at")
    .eq("weekly_report_id", report.id)
    .order("created_at");
  const actionRows = actions ?? [];
  const completedActions = actionRows.filter((action) => action.completed_at).length;

  return (
    <>
      <PageHeading title="Plan de la semaine" description="3 actions maximum pour garder la semaine simple et utile." />
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <ArthurNote>
          <p>
            J'ai prepare {actionRows.length} action{actionRows.length > 1 ? "s" : ""}. Faites-les dans l'ordre, puis cochez ce qui est termine.
          </p>
        </ArthurNote>
        <Card>
          <CardHeader>
            <CardTitle>Avancement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {completedActions}/{actionRows.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">actions terminees</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5">
        {actionRows.map((action) => {
          const isCompleted = Boolean(action.completed_at);

          return (
          <Card className={isCompleted ? "border-primary/30 bg-primary/5" : undefined} key={action.title}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                {isCompleted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <Badge>{priorityLabels[action.priority as ActionPriority]}</Badge>
              </div>
              <CardTitle>{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-primary">Quoi faire</p>
                <p className="mt-2 text-muted-foreground">{action.impact}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Pourquoi c'est important</p>
                <p className="mt-2 text-muted-foreground">{action.reason}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Comment le faire</p>
                <ol className="mt-2 space-y-2 text-muted-foreground">
                  {asSteps(action.steps as Json).map((step) => <li key={step}>{step}</li>)}
                </ol>
                <form action={toggleActionCompletionAction} className="mt-4">
                  <input name="action_id" type="hidden" value={action.id} />
                  <input name="is_completed" type="hidden" value={String(isCompleted)} />
                  <Button size="sm" variant={isCompleted ? "outline" : "default"}>
                    {isCompleted ? "Remettre a faire" : "Marquer comme fait"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </>
  );
}
