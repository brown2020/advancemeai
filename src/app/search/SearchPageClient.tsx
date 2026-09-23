"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Search, TrendingUp } from "lucide-react";
import { ROUTES } from "@/constants/appConstants";
import { logger } from "@/utils/logger";
import {
  CardGrid,
  EmptyState,
  ErrorDisplay,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { SetCardFrame } from "@/components/flashcards/library/SetCardFrame";
import { SetGridSkeleton } from "@/components/flashcards/library/SetGrid";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  cardCount: number;
  userId: string;
  createdAt: number;
  updatedAt: number;
  subjects?: string[];
  timesStudied?: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  query: string;
}

const PAGE_SIZE = 20;
const SUGGESTED_TOPICS = [
  "Biology",
  "Spanish vocabulary",
  "SAT math",
  "US history",
  "Chemistry",
  "SAT vocabulary",
];

export default function SearchPageClient({
  initialQueryParam = "",
}: {
  initialQueryParam?: string;
}) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQueryParam);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSearchedRef = useRef<string | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string, searchOffset = 0) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setSubmittedQuery("");
        return;
      }

      lastSearchedRef.current = trimmed;
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: String(PAGE_SIZE),
          offset: String(searchOffset),
        });
        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) throw new Error("Search failed");
        const data: SearchResponse = await response.json();

        setResults((prev) =>
          searchOffset === 0 ? data.results : [...prev, ...data.results]
        );
        setTotal(data.total);
        setHasMore(data.hasMore);
        setOffset(searchOffset);
        setSubmittedQuery(trimmed);
      } catch (err) {
        logger.error("Search error", err);
        setError("Search isn't working right now. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Run the search from the URL on first load and whenever ?q changes
  // (e.g. from the navbar search), skipping queries this page already ran.
  useEffect(() => {
    const q = initialQueryParam.trim();
    if (!q || q === lastSearchedRef.current) return;
    setQuery(initialQueryParam);
    void performSearch(q);
  }, [initialQueryParam, performSearch]);

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(value);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    void performSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const hasSearched = submittedQuery.length > 0;
  const isFirstPageLoading = isLoading && offset === 0 && results.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title="Search"
        description="Find flashcard sets shared by other students."
      />

      <form onSubmit={handleSubmit} role="search" className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a topic, class or term"
              aria-label="Search flashcard sets"
              className="h-12 pl-11 text-base"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>
      </form>

      {error && <ErrorDisplay message={error} />}

      {!hasSearched && !isLoading && (
        <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <Search className="size-6" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">What are you studying?</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Search public sets by title or subject. Try one of these to get
            started:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGGESTED_TOPICS.map((topic) => (
              <Button
                key={topic}
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => runSearch(topic)}
              >
                {topic}
              </Button>
            ))}
          </div>
        </section>
      )}

      {isFirstPageLoading && <SetGridSkeleton />}

      {hasSearched && !isFirstPageLoading && (
        <section aria-live="polite">
          <p className="mb-4 text-sm text-muted-foreground">
            {total === 0 ? (
              <>No results for &ldquo;{submittedQuery}&rdquo;</>
            ) : (
              <>
                <span className="font-semibold text-foreground tabular-nums">
                  {total}
                </span>{" "}
                {total === 1 ? "result" : "results"} for &ldquo;
                {submittedQuery}&rdquo;
              </>
            )}
          </p>

          {results.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="No matching sets"
              message="Try a broader keyword, check the spelling, or make your own set on this topic."
              action={
                <Link href={ROUTES.FLASHCARDS.CREATE} className={buttonVariants()}>
                  Create a set
                </Link>
              }
            />
          ) : (
            <CardGrid>
              {results.map((result) => (
                <SetCardFrame
                  key={result.id}
                  href={ROUTES.FLASHCARDS.SET(result.id)}
                  title={result.title}
                  description={result.description}
                  termCount={result.cardCount}
                  updatedAt={result.updatedAt}
                  badges={result.subjects?.slice(0, 2).map((subject) => (
                    <Badge key={subject} variant="outline">
                      {subject}
                    </Badge>
                  ))}
                  meta={
                    result.timesStudied ? (
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="size-3.5" aria-hidden />
                        {result.timesStudied} studies
                      </span>
                    ) : null
                  }
                />
              ))}
            </CardGrid>
          )}

          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => void performSearch(submittedQuery, offset + PAGE_SIZE)}
                isLoading={isLoading}
              >
                Load more results
              </Button>
            </div>
          )}
        </section>
      )}
    </PageContainer>
  );
}
