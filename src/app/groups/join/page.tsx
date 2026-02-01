"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Check, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import * as studyGroupService from "@/services/studyGroupService";
import type { StudyGroup } from "@/types/study-group";
import { getAllMemberIds } from "@/types/study-group";
import { cn } from "@/utils/cn";

function JoinGroupContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("No invite code provided");
      setLoading(false);
      return;
    }

    const loadGroup = async () => {
      try {
        const groupData = await studyGroupService.getStudyGroupByInviteCode(
          code.toUpperCase()
        );

        if (!groupData) {
          setError("Invalid invite code. This group may no longer exist.");
        } else {
          setGroup(groupData);

          // Check if already a member
          if (user) {
            const memberIds = getAllMemberIds(groupData);
            setAlreadyMember(memberIds.includes(user.uid));
          }
        }
      } catch (err) {
        console.error("Failed to load group:", err);
        setError("Failed to load group. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadGroup();
  }, [code, user]);

  const handleJoin = async () => {
    if (!user || !group) return;

    setJoining(true);
    try {
      await studyGroupService.joinStudyGroup(group.id, user.uid);
      router.push(`/groups/${group.id}`);
    } catch (err) {
      console.error("Failed to join group:", err);
      setError("Failed to join group. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    // Save the join URL and redirect to sign in
    const redirectUrl = `/groups/join?code=${code}`;
    router.push(`/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`);
    return null;
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <div className="text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-48 mx-auto bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 mx-auto bg-muted rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <X size={32} className="text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Unable to Join</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link
              href="/groups"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Groups
            </Link>
          </div>
        ) : alreadyMember ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <Check size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Already a Member</h2>
            <p className="text-muted-foreground">
              You&apos;re already a member of <strong>{group?.name}</strong>
            </p>
            <Link
              href={`/groups/${group?.id}`}
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Group
            </Link>
          </div>
        ) : group ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Users size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Join Study Group</h2>
            <div className="p-4 rounded-lg border bg-card text-left">
              <h3 className="font-semibold">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {group.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {getAllMemberIds(group).length} member
                {getAllMemberIds(group).length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className={cn(
                "w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium transition-colors",
                joining ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
              )}
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Joining...
                </span>
              ) : (
                "Join Group"
              )}
            </button>
            <Link
              href="/groups"
              className="inline-block text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <JoinGroupContent />
    </Suspense>
  );
}
