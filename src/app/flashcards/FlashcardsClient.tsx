"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Search, FolderPlus, Trash2 } from "lucide-react";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";
import { useFlashcardLibraryStore } from "@/stores/flashcard-library-store";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import type { FlashcardSet } from "@/types/flashcard";
import { cn } from "@/utils/cn";

type LibraryTab = "your" | "public" | "starred" | "recent" | "folders";

const TABS: { id: LibraryTab; label: string; requiresAuth?: boolean }[] = [
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

  const [tab, setTab] = useState<LibraryTab>("your");
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
      {tab === "your" && user && (
        <>
          <Button
            onClick={refreshYour}
            disabled={isYourLoading}
            isLoading={isYourLoading}
            variant="outline"
            aria-label="Refresh your flashcard sets"
          >
            {isYourLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <ActionLink href={ROUTES.FLASHCARDS.CREATE}>Create</ActionLink>
        </>
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

