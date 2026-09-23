"use client";

import Link from "next/link";
import { ArrowLeft, Globe, GraduationCap, Lock, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudyGroup } from "@/types/study-group";
import { memberCountLabel } from "./group-labels";

/** Title block for a class/study group with the invite action. */
export function GroupDetailHeader({
  group,
  role,
  onInvite,
}: {
  group: StudyGroup;
  role: "owner" | "admin" | "member";
  onInvite: () => void;
}) {
  const setCount = group.sharedSetIds.length;
  const subtitle = [group.subject, group.school].filter(Boolean).join(" · ");

  return (
    <header className="mb-6">
      <Link
        href="/groups"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Classes
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary sm:flex">
            {group.isClass ? (
              <GraduationCap className="size-7" aria-hidden />
            ) : (
              <Users className="size-7" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{group.isClass ? "Class" : "Study group"}</Badge>
              <Badge variant="outline">
                {group.isPublic ? <Globe aria-hidden /> : <Lock aria-hidden />}
                {group.isPublic ? "Public" : "Private"}
              </Badge>
              {role !== "member" && <Badge>{role === "owner" ? "Owner" : "Admin"}</Badge>}
            </div>
            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {group.name}
            </h1>
            {subtitle && <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>}
            {group.description && (
              <p className="mt-2 max-w-2xl text-muted-foreground">{group.description}</p>
            )}
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" aria-hidden />
                {memberCountLabel(group)}
              </span>
              <span>
                {setCount} shared set{setCount === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>

        <Button onClick={onInvite} className="shrink-0">
          <UserPlus aria-hidden />
          Invite
        </Button>
      </div>
    </header>
  );
}
