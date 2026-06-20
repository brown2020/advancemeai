"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleUserRound,
  LogOut,
  MailWarning,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/utils/cn";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";

type NavLinkProps = {
  href: string;
  isActive?: boolean;
  children: React.ReactNode;
};

type AvatarUser = {
  email: string | null;
  photoURL: string | null;
};

type AvatarProfile = {
  displayName?: string;
  photoUrl?: string;
};

const NavLink = ({ href, isActive, children }: NavLinkProps) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
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

function safeAvatarUrl(value: string | undefined | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === "https:") return value;
    if (process.env.NODE_ENV !== "production" && url.protocol === "http:") {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}

function getInitials(profile: AvatarProfile | null, user: AvatarUser): string {
  const source = profile?.displayName?.trim() || user.email || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (source[0] ?? "U").toUpperCase();
}

function AccountAvatar({
  user,
  profile,
  className,
}: {
  user: AvatarUser;
  profile: AvatarProfile | null;
  className?: string;
}) {
  const photoUrl =
    safeAvatarUrl(profile?.photoUrl) ?? safeAvatarUrl(user.photoURL);
  const initials = getInitials(profile, user);

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-accent text-sm font-semibold text-accent-foreground",
        className
      )}
      aria-hidden="true"
    >
      {photoUrl ? (
        <span
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${photoUrl}")` }}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export default function Navbar() {
  const { user, userProfile, isLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const signInHref = `/auth/signin?returnTo=${encodeURIComponent(pathname)}`;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      setMenuOpen(false);
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

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
                <Skeleton className="h-10 w-10 rounded-full" />
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
                {user ? (
                  <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Open account menu"
                        className="rounded-full"
                      >
                        <AccountAvatar user={user} profile={userProfile} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-2">
                      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <AccountAvatar
                          user={user}
                          profile={userProfile}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {userProfile?.displayName || user.email || "Student"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user.email ?? "Advance.me account"}
                          </div>
                        </div>
                      </div>

                      <div className="my-2 h-px bg-border" />

                      {user.isPasswordUser && (
                        <div className="mb-2 flex items-start gap-2 rounded-lg bg-muted/50 px-2 py-2 text-xs text-muted-foreground">
                          {user.emailVerified ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                          ) : (
                            <MailWarning className="mt-0.5 h-4 w-4 text-amber-600" />
                          )}
                          <span>
                            {user.emailVerified
                              ? "Email verified"
                              : "Email verification pending"}
                          </span>
                        </div>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "w-full justify-start"
                        )}
                      >
                        <UserRound className="mr-2 h-4 w-4" />
                        Account
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        isLoading={isSigningOut}
                        className="mt-1 w-full justify-start text-destructive hover:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isSigningOut ? "Signing out..." : "Sign out"}
                      </Button>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Link
                    href={signInHref}
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    <CircleUserRound className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
