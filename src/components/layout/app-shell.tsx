import Link from "next/link";
import { BarChart3, CreditCard, FileClock, LayoutDashboard, LogOut, PenLine, Sparkles } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/database";

const navItems = [
  { href: "/dashboard", label: "Cette semaine", icon: LayoutDashboard },
  { href: "/plan", label: "Plan", icon: Sparkles },
  { href: "/contenus", label: "Contenus", icon: PenLine },
  { href: "/historique", label: "Progres", icon: FileClock },
  { href: "/abonnement", label: "Abonnement", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: BarChart3 }
];

function getTrialDaysLeft(profile: Pick<UserProfile, "trial_ends_at"> | null) {
  if (!profile?.trial_ends_at) {
    return null;
  }

  const millisecondsLeft = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(millisecondsLeft / 86_400_000));
}

export function AppShell({
  children,
  profile
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
}) {
  const daysLeft = getTrialDaysLeft(profile);
  const visibleNavItems = navItems.filter((item) => item.href !== "/admin" || profile?.role === "admin");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t bg-white md:inset-y-0 md:left-0 md:right-auto md:w-64 md:border-r md:border-t-0">
        <div className="hidden border-b p-6 md:block">
          <Link href="/dashboard" className="text-xl font-bold">
            Arthur™
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Votre responsable virtuel</p>
          {daysLeft !== null ? (
            <Badge className="mt-4 bg-secondary/25 text-foreground">
              Essai gratuit: {daysLeft} jour{daysLeft > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </div>
        <nav className="grid grid-cols-5 gap-1 p-2 md:flex md:flex-col md:p-4">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-center text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:min-h-11 md:flex-row md:justify-start md:text-sm"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <form action={signOutAction} className="hidden pt-4 md:block">
            <Button className="w-full justify-start" size="sm" variant="ghost">
              <LogOut className="h-4 w-4" />
              Deconnexion
            </Button>
          </form>
        </nav>
      </aside>
      <main className="pb-24 md:ml-64 md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
