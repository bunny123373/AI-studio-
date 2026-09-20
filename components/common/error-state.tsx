import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message = "Something went wrong. Please try again.",
  action,
}: {
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-sm text-foreground/90">{message}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}