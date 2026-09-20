"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";

import { NAV_GROUPS, SITE } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-5 focus-visible:outline-none"
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_18px_-4px_rgba(239,45,69,0.8)]">
          <Bot className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-foreground">
            {SITE.name}
          </div>
          <div className="text-xs text-muted-foreground">{SITE.tagline}</div>
        </div>
      </Link>

      <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active &&
                          "bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <div className="text-xs text-muted-foreground">{SITE.footer}</div>
        <div className="mt-1 text-[11px] text-muted-foreground/60">
          Free-first · local &amp; open-source friendly
        </div>
      </div>
    </div>
  );
}