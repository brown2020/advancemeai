"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, GraduationCap, KeyRound, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import * as studyGroupService from "@/services/studyGroupService";
import type { StudyGroup } from "@/types/study-group";
import { getAllMemberIds } from "@/types/study-group";
import { groupNoun, memberCountLabel } from "@/components/groups";
import { LoadingState, PageContainer } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";

const CODE_LENGTH = 8;

/** Centered status panel used by every join state. */
function JoinPanel({
  icon,
  tone = "primary",
  title,
  children,
}: {
  icon: React.ReactNode;
  tone?: "primary" | "success" | "destructive";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in text-center">
      <div
        className={cn(
          "mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl [&_svg]:size-8",
          tone === "primary" && "bg-accent text-primary",
          tone === "success" && "bg-success/10 text-success",
          tone === "destructive" && "bg-destructive/10 text-destructive"
        )}
        aria-hidden
      >
        {icon}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Large, friendly code entry used when the URL has no code. */
function JoinCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = value.trim().toUpperCase();
    if (code) router.push(`/groups/join?code=${code}`);
  };

  return (
    <JoinPanel icon={<KeyRound />} title="Join a class">
      <p className="text-muted-foreground">Enter the code your teacher shared with you.</p>
      <form onSubmit={submit} className="mt-8 space-y-3 text-left">
        <label htmlFor="join-code" className="sr-only">
          Class code
        </label>
        <Input
          id="join-code"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/\s/g, ""))}
          placeholder="ABC123XY"
          maxLength={CODE_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-16 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] placeholder:tracking-[0.3em] placeholder:text-muted-foreground/50"
        />
        <Button type="submit" size="lg" className="w-full" disabled={!value.trim()}>
          Continue
          <ArrowRight aria-hidden />
        </Button>
      </form>
    </JoinPanel>
  );
}

function JoinGroupContent({ code }: { code: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadGroup = async () => {
      try {
        const groupData = await studyGroupService.getStudyGroupByInviteCode(code.toUpperCase());
        if (cancelled) return;
        if (!groupData) {
          setError("That code doesn't match a class. It may have expired or been changed.");
        } else {
          setGroup(groupData);
          if (user) setAlreadyMember(getAllMemberIds(groupData).includes(user.uid));
        }
      } catch (err) {
        logger.error("Failed to load group:", err);
        if (!cancelled) setError("Failed to load the class. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadGroup();
    return () => {
      cancelled = true;
    };
  }, [code, user]);

  const handleJoin = async () => {
    if (!user || !group) return;
    setJoining(true);
    try {
      await studyGroupService.joinStudyGroup(group.id, user.uid);
      router.push(`/groups/${group.id}`);
    } catch (err) {
      logger.error("Failed to join group:", err);
      setError(`Failed to join this ${groupNoun(group)}. Please try again.`);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 text-center" aria-busy="true" aria-label="Looking up code">
        <Skeleton className="mx-auto size-16 rounded-2xl" />
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <JoinPanel icon={<X />} tone="destructive" title="Can't join">
        <p className="text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/groups/join" className={buttonVariants({ size: "lg" })}>
            Try another code
          </Link>
          <Link href="/groups" className={buttonVariants({ variant: "ghost" })}>
            Go to Classes
          </Link>
        </div>
      </JoinPanel>
    );
  }

  if (!group) return null;
  const noun = groupNoun(group);

  if (alreadyMember) {
    return (
      <JoinPanel icon={<Check />} tone="success" title="You're already in">
        <p className="text-muted-foreground">
          You&apos;re already a member of <strong className="text-foreground">{group.name}</strong>.
        </p>
        <Link href={`/groups/${group.id}`} className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
          Open {noun}
        </Link>
      </JoinPanel>
    );
  }

  return (
    <JoinPanel
      icon={group.isClass ? <GraduationCap /> : <Users />}
      title={`Join this ${noun}?`}
    >
      <Card className="mt-6 p-5 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Code <span className="font-mono">{code.toUpperCase()}</span>
        </p>
        <h2 className="mt-1 text-lg font-semibold">{group.name}</h2>
        {group.description && (
          <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
        )}
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden />
          {memberCountLabel(group)}
        </p>
      </Card>
      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" onClick={handleJoin} isLoading={joining}>
          {joining ? "Joining..." : `Join ${noun}`}
        </Button>
        <Link href="/groups" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </JoinPanel>
  );
}

export default function JoinGroupClient({ codeParam }: { codeParam?: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const code = codeParam?.trim() || null;

  useEffect(() => {
    if (authLoading || user) return;
    const redirectUrl = code ? `/groups/join?code=${code}` : "/groups/join";
    router.push(`/auth/signin?returnTo=${encodeURIComponent(redirectUrl)}`);
  }, [authLoading, user, code, router]);

  return (
    <PageContainer className="max-w-md py-12 md:py-16">
      {authLoading || !user ? (
        <LoadingState message="Checking your session..." />
      ) : code ? (
        <JoinGroupContent key={code} code={code} />
      ) : (
        <JoinCodeForm />
      )}
    </PageContainer>
  );
}
