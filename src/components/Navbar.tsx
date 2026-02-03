"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Auth from "./Auth";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";

type NavLinkProps = {
  href: string;
  isActive?: boolean;
  children: React.ReactNode;
};

const NavLink = ({ href, isActive, children }: NavLinkProps) => (
  <Link
    href={href}
    className={cn(
      buttonVariants({
        variant: "ghost",
        size: "sm",
      }),
      "h-9 px-3",
      isActive && "bg-accent text-accent-foreground"
    )}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground hover:opacity-90"
        >
          <Image
            src="/advance_icon.png"
            alt="Advance.me Logo"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
            loading="eager"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
          />
          <span className="text-sm sm:text-base">Advance.me</span>
        </Link>

        <nav className="flex items-center gap-1">
          {isLoading ? (
            <>
              <div className="hidden sm:flex items-center gap-1">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
              <div className="ml-2">
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </>
          ) : (
            <>
              {user && (
                <>
                  <NavLink
                    href="/practice"
                    isActive={pathname.startsWith("/practice")}
                  >
                    Practice
                  </NavLink>
                  <NavLink
                    href="/quizzes"
                    isActive={pathname.startsWith("/quizzes")}
                  >
                    Quizzes
                  </NavLink>
                  <NavLink
                    href="/flashcards"
                    isActive={pathname.startsWith("/flashcards")}
                  >
                    Flashcards
                  </NavLink>
                  <NavLink
                    href="/profile"
                    isActive={pathname.startsWith("/profile")}
                  >
                    Profile
                  </NavLink>
                  <div className="hidden md:block ml-2">
                    <SearchBar variant="compact" />
                  </div>
                </>
              )}
              {!user && (
                <div className="hidden md:block">
                  <SearchBar variant="compact" />
                </div>
              )}
              <div className="ml-2">
                <Auth buttonStyle={user ? "secondary" : "default"} />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
