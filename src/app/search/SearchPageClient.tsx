"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, BookOpen, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import Link from "next/link";
import { ROUTES } from "@/constants/appConstants";

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

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [offset, setOffset] = useState(0);

  const performSearch = useCallback(async (searchQuery: string, searchOffset = 0) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "20",
        offset: searchOffset.toString(),
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error("Search failed");

      const data: SearchResponse = await response.json();

      if (searchOffset === 0) {
        setResults(data.results);
      } else {
        setResults((prev) => [...prev, ...data.results]);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
      setHasSearched(true);
      setOffset(searchOffset);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial search from URL
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Update URL
    router.push(`/search?q=${encodeURIComponent(query)}`);
    performSearch(query);
  };

  const handleLoadMore = () => {
    performSearch(query, offset + 20);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <PageContainer>
      <PageHeader title="Search Flashcard Sets" />

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for flashcard sets..."
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>

      {/* Search Tips (shown when no search) */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Find study materials</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Search for flashcard sets created by other users. Try searching for
            subjects like &ldquo;biology&rdquo;, &ldquo;spanish vocabulary&rdquo;, or &ldquo;SAT math&rdquo;.
          </p>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            {total === 0 ? (
              "No results found"
            ) : (
              <>
                Found {total} result{total !== 1 && "s"} for &ldquo;{searchParams.get("q")}&rdquo;
              </>
            )}
          </div>

          {results.length === 0 && !isLoading && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">No matching sets found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Try different keywords or create your own set
              </p>
              <Link
                href={ROUTES.FLASHCARDS.CREATE}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Create a Set
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={result.id}
                href={ROUTES.FLASHCARDS.SET(result.id)}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {result.title}
                    </h3>
                    {result.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {result.cardCount} terms
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(result.updatedAt)}
                      </span>
                      {result.timesStudied && result.timesStudied > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {result.timesStudied} studies
                        </span>
                      )}
                    </div>
                    {result.subjects && result.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.subjects.slice(0, 3).map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-0.5 bg-muted rounded-full text-xs"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Study
                  </Button>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More Results
              </Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
