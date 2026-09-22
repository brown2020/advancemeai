import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";
import { LoadingState } from "@/components/common/UIComponents";

export const metadata = {
  title: "Search - AdvanceMe AI",
  description: "Search for flashcard sets to study",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<LoadingState message="Loading search..." />}>
      <SearchPageClient initialQueryParam={first(sp.q) ?? ""} />
    </Suspense>
  );
}
