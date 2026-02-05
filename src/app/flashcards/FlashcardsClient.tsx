"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardSettings } from "@/hooks/useFlashcardSettings";
import { usePublicFlashcards } from "@/hooks/usePublicFlashcards";
import { sortFlashcardSets } from "@/utils/flashcardUtils";
import { ROUTES } from "@/constants/appConstants";
import {
  CardGrid,
  EmptyState,
  ErrorDisplay,
  LoadingState,
  PageContainer,
  PageHeader,
  SectionContainer,
  ActionLink,
} from "@/components/common/UIComponents";
import { FlashcardSetCard } from "@/components/flashcards/FlashcardSetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FolderPlus,
  Trash2,
  Plus,
  BookOpen,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";
import { useFlashcardLibraryStore } from "@/stores/flashcard-library-store";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { ProgressBar } from "@/components/flashcards/study/ProgressRing";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import type { FlashcardSet } from "@/types/flashcard";
import { cn } from "@/utils/cn";
import Link from "next/link";

type LibraryTab = "home" | "your" | "public" | "starred" | "recent" | "folders";

const TABS: { id: LibraryTab; label: string; requiresAuth?: boolean }[] = [
  { id: "home", label: "Home" },
  { id: "your", label: "Your sets", requiresAuth: true },
  { id: "public", label: "Public" },
  { id: "starred", label: "Starred", requiresAuth: true },
  { id: "recent", label: "Recent" },
  { id: "folders", label: "Folders", requiresAuth: true },
];

export default function FlashcardsClient({
  authIsGuaranteed = false,
  initialPublicSets,
  initialYourSets,
  initialFolders,
}: {
  authIsGuaranteed?: boolean;
  initialPublicSets?: FlashcardSet[];
  initialYourSets?: FlashcardSet[];
  initialFolders?: FlashcardFolder[];
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { settings } = useFlashcardSettings();
  const hydrateProgress = useFlashcardStudyStore((s) => s.hydrateProgress);
  const starredBySetId = useFlashcardStudyStore((s) => s.starredBySetId);
  const recentSetIds = useFlashcardLibraryStore((s) => s.recentSetIds);
  const clearRecent = useFlashcardLibraryStore((s) => s.clearRecent);

  const [tab, setTab] = useState<LibraryTab>("home");
  const [query, setQuery] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string>("all");
  const [newFolderName, setNewFolderName] = useState("");

  const {
    sets: publicSets,
    isLoading: isPublicLoading,
    error: publicError,
    refresh: refreshPublic,
  } = usePublicFlashcards({ initialSets: initialPublicSets });

  const {
    sets: yourSets,
    isLoading: isYourLoading,
    error: yourError,
    refreshData: refreshYour,
  } = useUserFlashcards({
    refreshInterval: user && settings.autoRefresh ? settings.refreshInterval : 0,
    prefetchSets: settings.prefetchSets,
    // Only hydrate initial signed-in data when server verified auth.
    initialSets: authIsGuaranteed ? initialYourSets : undefined,
  });

  const {
    folders,
    isLoading: isFoldersLoading,
    error: foldersError,
    createFolder,
    deleteFolder,
    addSetToFolder,
    removeSetFromFolder,
  } = useFlashcardFolders(user?.uid ?? null, {
    initialFolders: authIsGuaranteed ? initialFolders : undefined,
  });

  // Hydrate progress in bulk for signed-in users
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    listFlashcardStudyProgressForUser(user.uid)
      .then((rows) => {
        if (!isMounted) return;
        rows.forEach((row) => {
          hydrateProgress(user.uid, row.setId, row.masteryByCardId);
        });
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [hydrateProgress, user]);

  // Keep tab selection sensible when signed out
  useEffect(() => {
    if (isAuthLoading) return;
    if (user) return;
    if (tab === "your" || tab === "starred" || tab === "folders") {
      setTab("public");
    }
  }, [isAuthLoading, tab, user]);

  const sortedYourSets = useMemo(() => {
    return sortFlashcardSets(
      yourSets,
      settings.sortBy,
      settings.sortDirection as "asc" | "desc"
    );
  }, [settings.sortBy, settings.sortDirection, yourSets]);

  const normalizedQuery = query.trim().toLowerCase();
  const shouldSearchCards = normalizedQuery.length >= 3;

  const starredSetIds = useMemo(() => {
    return new Set(
      Object.entries(starredBySetId)
        .filter(([, v]) => Object.keys(v ?? {}).length > 0)
        .map(([k]) => k)
    );
  }, [starredBySetId]);

  const recentPublicSets = useMemo(() => {
    const byId = new Map(publicSets.map((s) => [s.id, s]));
    return recentSetIds
      .map((id) => byId.get(id))
      .filter((s): s is (typeof publicSets)[number] => Boolean(s));
  }, [publicSets, recentSetIds]);

  const recentYourSets = useMemo(() => {
    const byId = new Map(sortedYourSets.map((s) => [s.id, s]));
    return recentSetIds
      .map((id) => byId.get(id))
      .filter((s): s is (typeof sortedYourSets)[number] => Boolean(s));
  }, [recentSetIds, sortedYourSets]);

  const setsById = useMemo(() => {
    const all = [...sortedYourSets, ...publicSets];
    return new Map(all.map((s) => [s.id, s]));
  }, [publicSets, sortedYourSets]);

  const activeFolder = useMemo<FlashcardFolder | null>(() => {
    return folders.find((f) => f.id === activeFolderId) ?? null;
  }, [activeFolderId, folders]);

  const yourSetsFiltered = useMemo(() => {
    let base = sortedYourSets;

    if (activeFolderId !== "all" && activeFolder) {
      const allowed = new Set(activeFolder.setIds);
      base = base.filter((s) => allowed.has(s.id));
    }

    if (!normalizedQuery) return base;
    return base.filter((s) => {
      if (
        s.title.toLowerCase().includes(normalizedQuery) ||
        s.description.toLowerCase().includes(normalizedQuery)
      ) {
        return true;
      }
      if (!shouldSearchCards) return false;
      return s.cards.some(
        (c) =>
          c.term.toLowerCase().includes(normalizedQuery) ||
          c.definition.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [
    activeFolder,
    activeFolderId,
    normalizedQuery,
    shouldSearchCards,
    sortedYourSets,
  ]);

  const publicSetsFiltered = useMemo(() => {
    if (!normalizedQuery) return publicSets;
    return publicSets.filter((s) => {
      if (
        s.title.toLowerCase().includes(normalizedQuery) ||
        s.description.toLowerCase().includes(normalizedQuery)
      ) {
        return true;
      }
      if (!shouldSearchCards) return false;
      return s.cards.some(
        (c) =>
          c.term.toLowerCase().includes(normalizedQuery) ||
          c.definition.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, publicSets, shouldSearchCards]);

  const starredSets = useMemo(() => {
    return sortedYourSets.filter((s) => starredSetIds.has(s.id));
  }, [sortedYourSets, starredSetIds]);

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      {(tab === "home" || tab === "your") && user && (
        <ActionLink href={ROUTES.FLASHCARDS.CREATE}>
          <Plus className="h-4 w-4 mr-2" />
          Create
        </ActionLink>
      )}
      {tab === "your" && user && (
        <Button
          onClick={refreshYour}
          disabled={isYourLoading}
          isLoading={isYourLoading}
          variant="outline"
          aria-label="Refresh your flashcard sets"
        >
          {isYourLoading ? "Refreshing..." : "Refresh"}
        </Button>
      )}
      {tab === "public" && (
        <Button
          onClick={refreshPublic}
          disabled={isPublicLoading}
          isLoading={isPublicLoading}
          variant="outline"
          aria-label="Refresh public flashcard sets"
        >
          {isPublicLoading ? "Refreshing..." : "Refresh"}
        </Button>
      )}
      {tab === "recent" && recentSetIds.length > 0 && (
        <Button onClick={clearRecent} variant="outline" aria-label="Clear recent sets">
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader title="Flashcards" actions={headerActions} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
              disabled={Boolean(t.requiresAuth && !user && !isAuthLoading)}
              aria-label={
                t.requiresAuth && !user && !isAuthLoading
                  ? `${t.label} (sign in required)`
                  : t.label
              }
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-[320px]">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sets and terms…"
            className="pl-9"
          />
        </div>
      </div>

      {(yourError || publicError || foldersError) && (
        <ErrorDisplay message={yourError || publicError || foldersError || "Error"} />
      )}

      {tab === "home" && (
        <HomeDashboard
          user={user}
          recentSets={(() => {
            const all = [...(user ? recentYourSets : []), ...recentPublicSets];
            const seen = new Set<string>();
            return all.filter((s) => {
              if (seen.has(s.id)) return false;
              seen.add(s.id);
              return true;
            }).slice(0, 4);
          })()}
          yourSets={sortedYourSets.slice(0, 4)}
          publicSets={publicSets.slice(0, 4)}
          progressBySetKey={useFlashcardStudyStore.getState().progressByUserSetKey}
          onViewMore={(t) => setTab(t)}
        />
      )}

      {tab === "your" && (
        <>
          {!user ? (
            <EmptyState
              title="Sign in to see your sets"
              message="You can still browse Public sets without signing in."
              actionLink={ROUTES.AUTH.LOGIN}
              actionText="Sign in"
            />
          ) : (
            <>
              <SectionContainer className="mb-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="text-sm font-medium">Filter by folder</div>
                    <select
                      className={cn(
                        "h-10 rounded-xl border border-input bg-background px-3 text-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                      value={activeFolderId}
                      onChange={(e) => setActiveFolderId(e.target.value)}
                    >
                      <option value="all">All sets</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-muted-foreground">
                      Tip: Search includes terms/definitions when you type 3+ characters.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full md:max-w-[420px]">
                    <div className="text-sm font-medium">Create folder</div>
                    <div className="flex gap-2">
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., SAT Math"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const name = newFolderName.trim();
                          if (!name) return;
                          await createFolder(name);
                          setNewFolderName("");
                        }}
                      >
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </SectionContainer>

              {isYourLoading && yourSets.length === 0 ? (
                <LoadingState message="Loading your flashcard sets..." />
              ) : yourSetsFiltered.length === 0 ? (
                <EmptyState
                  title="No matching sets"
                  message="Try a different search or folder filter."
                  actionLink={ROUTES.FLASHCARDS.CREATE}
                  actionText="Create New Set"
                />
              ) : (
                <CardGrid>
                  {yourSetsFiltered.map((set) => (
                    <div key={set.id} className="space-y-2">
                      <FlashcardSetCard set={set} viewerUserId={user.uid} />
                      {folders.length > 0 && (
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-3">
                          <div className="text-xs text-muted-foreground mb-2">Folders</div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <select
                              className={cn(
                                "h-9 rounded-xl border border-input bg-background px-3 text-sm",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                              )}
                              defaultValue=""
                              onChange={(e) => {
                                const folderId = e.target.value;
                                if (!folderId) return;
                                addSetToFolder(folderId, set.id).catch(() => {});
                                e.currentTarget.value = "";
                              }}
                            >
                              <option value="">Add to folder…</option>
                              {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                            {folders
                              .filter((f) => f.setIds.includes(set.id))
                              .map((f) => (
                                <Button
                                  key={f.id}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSetFromFolder(f.id, set.id)}
                                >
                                  Remove from {f.name}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardGrid>
              )}
            </>
          )}
        </>
      )}

      {tab === "public" && (
        <>
          {isPublicLoading && publicSets.length === 0 ? (
            <LoadingState message="Loading public flashcard sets..." />
          ) : publicSetsFiltered.length === 0 ? (
            <EmptyState title="No matching public sets" message="Try a different search." />
          ) : (
            <CardGrid>
              {publicSetsFiltered.map((set) => (
                <FlashcardSetCard key={set.id} set={set} viewerUserId={user?.uid} />
              ))}
            </CardGrid>
          )}
        </>
      )}

      {tab === "starred" && (
        <>
          {!user ? (
            <EmptyState
              title="Sign in to see starred terms"
              message="Star terms while studying to find them here later."
              actionLink={ROUTES.AUTH.LOGIN}
              actionText="Sign in"
            />
          ) : starredSets.length === 0 ? (
            <EmptyState
              title="No starred sets yet"
              message="Star terms while studying and they’ll show up here."
            />
          ) : (
            <CardGrid>
              {starredSets.map((set) => (
                <FlashcardSetCard key={set.id} set={set} viewerUserId={user.uid} />
              ))}
            </CardGrid>
          )}
        </>
      )}

      {tab === "recent" && (
        <>
          {recentSetIds.length === 0 ? (
            <EmptyState title="No recent sets" message="Study a set and it will appear here." />
          ) : (
            <CardGrid>
              {(() => {
                const all = [...(user ? recentYourSets : []), ...recentPublicSets];
                const seen = new Set<string>();
                const unique = all.filter((s) => {
                  if (seen.has(s.id)) return false;
                  seen.add(s.id);
                  return true;
                });
                return unique.map((set) => (
                  <FlashcardSetCard key={set.id} set={set} viewerUserId={user?.uid} />
                ));
              })()}
            </CardGrid>
          )}
        </>
      )}

      {tab === "folders" && (
        <>
          {!user ? (
            <EmptyState
              title="Sign in to use folders"
              message="Folders help you organize sets like Quizlet."
              actionLink={ROUTES.AUTH.LOGIN}
              actionText="Sign in"
            />
          ) : isFoldersLoading && folders.length === 0 ? (
            <LoadingState message="Loading folders..." />
          ) : folders.length === 0 ? (
            <EmptyState title="No folders yet" message="Create a folder from the Your sets tab." />
          ) : (
            <div className="space-y-4">
              {folders.map((folder) => (
                <SectionContainer key={folder.id} title={folder.name}>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="text-sm text-muted-foreground">
                      {folder.setIds.length} sets
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!confirm(`Delete folder "${folder.name}"?`)) return;
                        deleteFolder(folder.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>

                  {folder.setIds.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Add sets to this folder from the Your sets tab.
                    </div>
                  ) : (
                    <>
                      <CardGrid>
                        {folder.setIds.map((setId) => {
                          const set = setsById.get(setId) ?? null;
                          if (!set) {
                            return (
                              <div
                                key={setId}
                                className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4"
                              >
                                <div className="text-sm font-medium mb-2">
                                  Unknown set
                                </div>
                                <div className="text-xs text-muted-foreground mb-3">
                                  {setId}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSetFromFolder(folder.id, setId)}
                                >
                                  Remove from folder
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div key={setId} className="space-y-2">
                              <FlashcardSetCard set={set} viewerUserId={user.uid} />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeSetFromFolder(folder.id, setId)}
                              >
                                Remove from folder
                              </Button>
                            </div>
                          );
                        })}
                      </CardGrid>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Tip: folders show set cards so you can jump straight into studying.
                      </div>
                    </>
                  )}
                </SectionContainer>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

// Home Dashboard Component
interface HomeDashboardProps {
  user: { uid: string; displayName?: string | null } | null;
  recentSets: FlashcardSet[];
  yourSets: FlashcardSet[];
  publicSets: FlashcardSet[];
  progressBySetKey: Record<string, { masteryByCardId: Record<string, 0 | 1 | 2 | 3> }>;
  onViewMore: (tab: LibraryTab) => void;
}

function HomeDashboard({
  user,
  recentSets,
  yourSets,
  publicSets,
  progressBySetKey,
  onViewMore,
}: HomeDashboardProps) {
  const getSetProgress = (setId: string) => {
    const key = `${user?.uid ?? "anon"}:${setId}`;
    const progress = progressBySetKey[key];
    if (!progress) return 0;
    const mastery = Object.values(progress.masteryByCardId);
    const mastered = mastery.filter((m) => m >= 3).length;
    return mastery.length > 0 ? Math.round((mastered / mastery.length) * 100) : 0;
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href={ROUTES.FLASHCARDS.CREATE}
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold">Create a set</div>
            <div className="text-sm text-muted-foreground">
              Make flashcards from scratch
            </div>
          </div>
        </Link>

        <Link
          href="/search"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="p-3 rounded-lg bg-blue-500/10">
            <Search className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="font-semibold">Find flashcards</div>
            <div className="text-sm text-muted-foreground">
              Search millions of sets
            </div>
          </div>
        </Link>

        {user && (
          <Link
            href="/groups"
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="p-3 rounded-lg bg-green-500/10">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="font-semibold">Your classes</div>
              <div className="text-sm text-muted-foreground">
                Join or create a class
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Continue Studying */}
      {recentSets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Continue studying</h2>
            </div>
            <button
              onClick={() => onViewMore("recent")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentSets.map((set) => {
              const progress = getSetProgress(set.id);
              return (
                <Link
                  key={set.id}
                  href={ROUTES.FLASHCARDS.SET(set.id)}
                  className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-medium line-clamp-1 mb-1">{set.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {set.cards.length} terms
                  </p>
                  {progress > 0 && (
                    <ProgressBar progress={progress} size="sm" showLabel={false} />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Your Sets */}
      {user && yourSets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Your sets</h2>
            </div>
            <button
              onClick={() => onViewMore("your")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <CardGrid>
            {yourSets.map((set) => (
              <FlashcardSetCard key={set.id} set={set} viewerUserId={user.uid} />
            ))}
          </CardGrid>
        </section>
      )}

      {/* Discover */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Discover</h2>
          </div>
          <button
            onClick={() => onViewMore("public")}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {publicSets.length > 0 ? (
          <CardGrid>
            {publicSets.map((set) => (
              <FlashcardSetCard key={set.id} set={set} viewerUserId={user?.uid} />
            ))}
          </CardGrid>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No public sets available yet.
          </div>
        )}
      </section>

      {/* Sign up prompt for guests */}
      {!user && (
        <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-blue-500/5 p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Get more out of your studying
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Sign up to create your own flashcard sets, track your progress, and
            join study groups.
          </p>
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign up for free
          </Link>
        </div>
      )}
    </div>
  );
}
