import { redirect } from "next/navigation";
import { RefreshCw, Wand2 } from "lucide-react";
import { CopyContentButton } from "@/components/arthur/copy-content-button";
import { AuthMessage } from "@/components/auth/auth-message";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentType } from "@/types/database";
import { generateContentAction } from "./actions";

const contentTypeLabels: Record<ContentType, string> = {
  facebook_post: "Facebook",
  instagram_post: "Instagram",
  email: "Email",
  newsletter: "Newsletter"
};

export default async function ContentPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
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

  const { data: contents = [] } = await supabase
    .from("content_pieces")
    .select("id,type,title,body,created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  const contentRows = contents ?? [];

  return (
    <>
      <PageHeading title="Contenus prepares par Arthur" description="Publications, emails et newsletters adaptes a votre activite." />
      <div className="mb-5">
        <AuthMessage error={params?.error} message={params?.message} />
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Que voulez-vous preparer ?</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={generateContentAction} className="flex flex-col gap-3 sm:flex-row">
            <select
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              name="content_type"
            >
              <option value="all">3 contenus differents</option>
              <option value="facebook_post">Publication Facebook</option>
              <option value="instagram_post">Publication Instagram</option>
              <option value="email">Email</option>
              <option value="newsletter">Newsletter</option>
            </select>
            <Button>
              <Wand2 className="h-4 w-4" />
              Generer avec Arthur
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {contentRows.map((content) => (
          <Card key={content.id}>
            <CardHeader>
              <Badge className="w-fit bg-primary/10 text-primary">
                {contentTypeLabels[content.type as ContentType]}
              </Badge>
              <CardTitle>{content.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-muted-foreground">{content.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <CopyContentButton text={content.body} />
                <form action={generateContentAction}>
                  <input name="content_type" type="hidden" value={content.type} />
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                    Regenerer
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
        {contentRows.length === 0 ? (
          <Card>
            <CardContent className="pt-5">
              <p className="leading-7 text-muted-foreground">
                Arthur n'a pas encore prepare de contenu. Choisissez un format et lancez la generation.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
