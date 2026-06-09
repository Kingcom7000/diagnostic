export function AuthMessage({
  error,
  message
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) {
    return null;
  }

  return (
    <div
      className={
        error
          ? "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary"
      }
    >
      {error ?? message}
    </div>
  );
}
