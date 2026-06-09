export function PageHeading({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-sm font-semibold text-primary">Arthur™</p>
      <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
    </header>
  );
}
