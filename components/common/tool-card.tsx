import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ToolCard({
  href,
  icon: Icon,
  title,
  description,
  hint,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="group block h-full focus-visible:outline-none">
      <Card
        className={cn(
          "h-full border-border bg-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-[0_8px_30px_-12px_rgba(239,45,69,0.35)] group-focus-visible:ring-2 group-focus-visible:ring-ring",
          accent && "border-primary/30",
        )}
      >
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-primary">
              <Icon className="size-5" />
            </div>
            {hint ? (
              <span className="text-xs text-muted-foreground">{hint}</span>
            ) : null}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary opacity-100 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100">
            Open
            <span aria-hidden>→</span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}