import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  message,
}: {
  icon?: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}