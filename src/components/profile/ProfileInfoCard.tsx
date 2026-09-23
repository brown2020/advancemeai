"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AccountAvatar } from "@/components/layout/AccountMenu";
import type { UserProfile } from "@/types/user-profile";
import { CopyField } from "./CopyField";

interface ProfileInfoCardProps {
  user: { uid: string; email: string | null; photoURL: string | null };
  profile: UserProfile | null;
  onCopy: (value: string) => void;
}

/** Avatar, name, role and public profile link. */
export function ProfileInfoCard({ user, profile, onCopy }: ProfileInfoCardProps) {
  const displayName = profile?.displayName?.trim() || user.email || "Your account";
  const username = profile?.username;
  const publicPath = username ? `/users/${encodeURIComponent(username)}` : null;

  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <AccountAvatar user={user} profile={profile} className="size-16 text-xl" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-tight">{displayName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {username ? <span>@{username}</span> : <span>No public username yet</span>}
              <Badge variant="secondary" className="capitalize">
                {profile?.role ?? "student"}
              </Badge>
            </div>
          </div>
          {publicPath && (
            <Link
              href={publicPath}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              View public profile
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <CopyField label="Email" value={user.email} onCopy={onCopy} />
          <CopyField label="User ID" value={user.uid} onCopy={onCopy} />
          {publicPath && (
            <div className="sm:col-span-2">
              <CopyField
                label="Public profile link"
                value={publicPath}
                getCopyValue={() => `${window.location.origin}${publicPath}`}
                onCopy={onCopy}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
