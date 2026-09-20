"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import * as React from "react";

import {
  MOBILE_NAV,
  SITE,
} from "@/components/layout/nav";
import { SidebarContent } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

/**
 * Responsive app shell: desktop sidebar (lg+), slide-in drawer for smaller
 * screens, a compact bottom nav, and the main content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border bg-card shadow-2xl">
            <div className="flex justify-end p-2">
              <button
                aria-label="Close navigation"
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <button
          aria-label="Open navigation"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <SITE.logoIcon className="size-4" />
          </span>
          <span className="text-sm font-bold tracking-wide">{SITE.name}</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {MOBILE_NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground",
                active && "text-primary",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}