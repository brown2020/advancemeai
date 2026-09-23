"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Compass,
  Layers,
  Plus,
  Search,
  Users,
} from "lucide-react";
import type { FlashcardSet } from "@/types/flashcard";
import { ROUTES } from "@/constants/appConstants";
import { SectionHeading, EmptyState } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import { SetGrid } from "./SetGrid";
import { SignUpNudge } from "./SignUpNudge";
import type { LibraryTab } from "./library-utils";

type OverviewTabProps = {
  viewerUserId?: string;
  isSignedIn: boolean;
  recentSets: FlashcardSet[];
  yourSets: FlashcardSet[];
  publicSets: FlashcardSet[];
  isYourLoading: boolean;
  isPublicLoading: boolean;
  onNavigate: (tab: LibraryTab) => void;
};

const QUICK_ACTIONS = [
  {
    href: ROUTES.FLASHCARDS.CREATE,
    title: "Create a set",
    description: "Make flashcards from scratch",
    icon: Plus,
    requiresAuth: false,
  },
  {
    href: "/search",
    title: "Find flashcards",
    description: "Search sets made by others",
    icon: Search,
    requiresAuth: false,
  },
  {
    href: "/groups",
    title: "Your classes",
    description: "Join or create a class",
    icon: Users,
    requiresAuth: true,
  },
] as const;

function ViewAllButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="link" size="sm" onClick={onClick}>
      View all <ArrowRight aria-hidden />
    </Button>
  );
}

export function OverviewTab({
  viewerUserId,
  isSignedIn,
  recentSets,
  yourSets,
  publicSets,
  isYourLoading,
  isPublicLoading,
  onNavigate,
}: OverviewTabProps) {
  const actions = QUICK_ACTIONS.filter((a) => !a.requiresAuth || isSignedIn);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {recentSets.length > 0 && (
        <section>
          <SectionHeading
            title="Continue studying"
            icon={<Clock />}
            action={<ViewAllButton onClick={() => onNavigate("recent")} />}
          />
          <SetGrid sets={recentSets} viewerUserId={viewerUserId} />
        </section>
      )}

      {isSignedIn && (
        <section>
          <SectionHeading
            title="Your sets"
            icon={<Layers />}
            action={
              yourSets.length > 0 ? (
                <ViewAllButton onClick={() => onNavigate("your")} />
              ) : undefined
            }
          />
          <SetGrid
            sets={yourSets}
            viewerUserId={viewerUserId}
            isLoading={isYourLoading}
            empty={
              <EmptyState
                icon={<Layers />}
                title="You haven't made any sets yet"
                message="Create your first set, or copy one from Discover to make it your own."
                actionLink={ROUTES.FLASHCARDS.CREATE}
                actionText="Create a set"
              />
            }
          />
        </section>
      )}

      {!isSignedIn && <SignUpNudge />}

      <section>
        <SectionHeading
          title="Discover"
          icon={<Compass />}
          action={<ViewAllButton onClick={() => onNavigate("discover")} />}
        />
        <SetGrid
          sets={publicSets}
          viewerUserId={viewerUserId}
          isLoading={isPublicLoading}
          empty={
            <EmptyState
              icon={<Compass />}
              title="No public sets yet"
              message="Public sets shared by the community will show up here."
            />
          }
        />
      </section>
    </div>
  );
}
