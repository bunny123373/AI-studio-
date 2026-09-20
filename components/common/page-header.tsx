import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  badge,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {badge}
      </div>
      {subtitle ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}