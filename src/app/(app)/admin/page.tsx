import { redirect } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [
    usersCount,
    trialsCount,
    subscriptionsCount,
    reportsCount,
    emailCount,
    openedEmailCount,
    completedActionsCount
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trialing"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("weekly_reports").select("id", { count: "exact", head: true }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("channel", "email"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("channel", "email").not("opened_at", "is", null),
    supabase.from("actions").select("id", { count: "exact", head: true }).not("completed_at", "is", null)
  ]);

  const sentEmails = emailCount.count ?? 0;
  const openedEmails = openedEmailCount.count ?? 0;
  const openRate = sentEmails > 0 ? Math.round((openedEmails / sentEmails) * 100) : 0;
  const stats = [
    ["Inscriptions", String(usersCount.count ?? 0)],
    ["Essais actifs", String(trialsCount.count ?? 0)],
    ["Abonnements", String(subscriptionsCount.count ?? 0)],
    ["Rapports generes", String(reportsCount.count ?? 0)],
    ["Ouverture emails", `${openRate}%`],
    ["Actions cochees", String(completedActionsCount.count ?? 0)]
  ];
  const { data: latestReports = [] } = await supabase
    .from("weekly_reports")
    .select("id,email_sent_at,businesses(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <>
      <PageHeading title="Admin Arthur" description="Vue simple pour suivre utilisateurs, abonnements, rapports et emails." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Rapports generes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(latestReports ?? []).map((report) => {
            const business = report.businesses as { name?: string } | null;
            return (
            <div className="flex items-center justify-between rounded-md bg-muted p-3" key={report.id}>
              <span className="font-medium">{business?.name ?? "Entreprise"}</span>
              <span className="text-sm text-muted-foreground">
                {report.email_sent_at ? "Email envoye" : "Email en attente"}
              </span>
            </div>
            );
          })}
          {(latestReports ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Aucun rapport genere.</p> : null}
        </CardContent>
      </Card>
    </>
  );
}
