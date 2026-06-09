"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyContentButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      <Copy className="h-4 w-4" />
      {copied ? "Copie" : "Copier"}
    </Button>
  );
}
