import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ArthurNote({
  children,
  label = "Arthur"
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <Card className="border-primary/25 bg-white">
      <CardContent className="space-y-3 pt-5">
        <Badge className="bg-primary/10 text-primary">{label}</Badge>
        <div className="text-base leading-7 text-foreground">{children}</div>
      </CardContent>
    </Card>
  );
}
