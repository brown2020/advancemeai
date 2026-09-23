"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { AccountMenu } from "./AccountMenu";
import { CreateMenu } from "./CreateMenu";
import { PRIMARY_NAV, PUBLIC_NAV, isNavItemActive } from "./nav-config";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Image
        src="/advance_icon.png"
        alt=""
        width={32}
        height={32}
        className="size-8"
        priority
      />
      <span className="text-[17px]">
        Advance<span className="text-primary">.me</span>
      </span>
    </Link>
  );
}

export function AppHeader() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const nav = user ? PRIMARY_NAV : PUBLIC_NAV;
  const returnTo = encodeURIComponent(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <BrandMark />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 md:flex">
          {!isLoading &&
            nav.map((item) => {
              const active = isNavItemActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <SearchBar className="hidden w-full max-w-xs sm:block lg:max-w-sm" />
          <Link
            href="/search"
            aria-label="Search"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "sm:hidden")}
          >
            <Search aria-hidden />
          </Link>

          {isLoading ? (
            <Skeleton className="size-9 rounded-full" />
          ) : user ? (
            <>
              <div className="hidden md:block">
                <CreateMenu />
              </div>
              <AccountMenu />
            </>
          ) : (
            <>
              <Link
                href={`/auth/signin?returnTo=${returnTo}`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Log in
              </Link>
              <Link
                href={`/auth/signup?returnTo=${returnTo}`}
                className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
              >
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
