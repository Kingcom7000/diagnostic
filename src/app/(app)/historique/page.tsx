import { redirect } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
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

  const { data: scores = [] } = await supabase
    .from("score_history")
    .select("score,explanation,recorded_at")
    .eq("business_id", business.id)
    .order("recorded_at", { ascending: true });
  const scoreRows = scores ?? [];

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id")
    .eq("business_id", business.id)
    .order("week_starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: actions = [] } = report
    ? await supabase
        .from("actions")
        .select("title,reason")
        .eq("weekly_report_id", report.id)
        .order("created_at")
    : { data: [] };
  const actionRows = actions ?? [];

  return (
    <>
      <PageHeading title="Progres" description="Arthur garde les anciens scores, plans et contenus pour montrer l'evolution." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anciens scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoreRows.map((item, index) => (
              <div className="grid grid-cols-[110px_1fr_48px] items-center gap-3" key={`${item.recorded_at}-${index}`}>
                <span className="text-sm text-muted-foreground">Score {index + 1}</span>
                <div className="h-3 rounded-full bg-muted">
                  <div className="h-3 rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                </div>
                <span className="text-sm font-semibold">{item.score}</span>
              </div>
            ))}
            {scoreRows.length === 0 ? <p className="text-sm text-muted-foreground">Arthur n'a pas encore cree de score.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dernier plan archive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionRows.map((action) => (
              <div className="rounded-md bg-muted p-3" key={action.title}>
                <p className="font-medium">{action.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{action.reason}</p>
              </div>
            ))}
            {actionRows.length === 0 ? <p className="text-sm text-muted-foreground">Arthur n'a pas encore archive de plan.</p> : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
