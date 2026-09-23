"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, MailWarning, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACCOUNT_LINKS } from "./nav-config";
import { ThemeSwitcher } from "./ThemeSwitcher";

type AvatarUser = { email: string | null; photoURL: string | null };
type AvatarProfile = { displayName?: string; photoUrl?: string };

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

export function AccountAvatar({
  user,
  profile,
  className,
}: {
  user: AvatarUser;
  profile: AvatarProfile | null;
  className?: string;
}) {
  const photoUrl = safeAvatarUrl(profile?.photoUrl) ?? safeAvatarUrl(user.photoURL);

  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground",
        className
      )}
      aria-hidden="true"
    >
      {photoUrl ? (
        <span
          className="size-full bg-cover bg-center"
          style={{ backgroundImage: `url("${photoUrl}")` }}
        />
      ) : (
        getInitials(profile, user)
      )}
    </span>
  );
}

const menuLinkClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none";

export function AccountMenu() {
  const { user, userProfile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      setOpen(false);
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AccountAvatar user={user} profile={userProfile} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 p-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <AccountAvatar user={user} profile={userProfile} className="size-10" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {userProfile?.displayName || user.email || "Student"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email ?? "Advance.me account"}
            </div>
          </div>
        </div>

        {user.isPasswordUser && (
          <div className="mx-2 mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            {user.emailVerified ? (
              <CheckCircle2 className="size-3.5 text-success" aria-hidden />
            ) : (
              <MailWarning className="size-3.5 text-warning" aria-hidden />
            )}
            {user.emailVerified ? "Email verified" : "Email verification pending"}
          </div>
        )}

        <div className="my-2 h-px bg-border" />

        <Link href="/profile" onClick={() => setOpen(false)} className={menuLinkClass}>
          <UserRound className="size-4 text-muted-foreground" aria-hidden />
          Profile & settings
        </Link>
        {ACCOUNT_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={menuLinkClass}
          >
            <item.icon className="size-4 text-muted-foreground" aria-hidden />
            {item.label}
          </Link>
        ))}

        <div className="px-2.5 pb-1 pt-3 text-xs font-medium text-muted-foreground">
          Appearance
        </div>
        <ThemeSwitcher className="mx-1" />

        <div className="my-2 h-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          isLoading={isSigningOut}
          className="w-full justify-start px-2.5 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {!isSigningOut && <LogOut aria-hidden />}
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
