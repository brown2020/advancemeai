"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

/** Header search: submits to /search. Cmd/Ctrl+K focuses it. */
export function SearchBar({
  className,
  placeholder = "Search flashcard sets",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    inputRef.current?.blur();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search flashcard sets"
        className="h-10 w-full rounded-full border border-transparent bg-secondary pl-10 pr-14 text-sm text-foreground transition-[border-color,background-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
        ⌘K
      </kbd>
    </form>
  );
}
