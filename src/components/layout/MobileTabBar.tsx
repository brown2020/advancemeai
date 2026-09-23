"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/utils/cn";
import { CreateMenu } from "./CreateMenu";
import { PRIMARY_NAV, isNavItemActive, type NavItem } from "./nav-config";

// Home, Flashcards, [Create], SAT Prep, Classes
const LEFT = PRIMARY_NAV.slice(0, 2);
const RIGHT = [PRIMARY_NAV[2], PRIMARY_NAV[4]].filter(
  (item): item is NavItem => Boolean(item)
);

/** Hidden on immersive screens where the bottom bar would cover study controls. */
const HIDE_ON = [/^\/auth\//, /^\/practice\/(?!results)[^/]+$/, /^\/practice\/full-test$/, /^\/test\//, /^\/live\/[^/]+$/];

function TabLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <item.icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
      {item.label}
    </Link>
  );
}

export function MobileTabBar() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading || !user) return null;
  if (HIDE_ON.some((re) => re.test(pathname))) return null;

  return (
    <>
      {/* Spacer so page content and footer clear the fixed bar. */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden" aria-hidden />
      <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-md items-center px-2">
        {LEFT.map((item) => (
          <TabLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="flex flex-1 justify-center">
          <CreateMenu variant="fab" />
        </div>
        {RIGHT.map((item) => (
          <TabLink key={item.href} item={item} pathname={pathname} />
        ))}
        </div>
      </nav>
    </>
  );
}
