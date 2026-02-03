import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";
import { LoadingState } from "@/components/common/UIComponents";

export const metadata = {
  title: "Search - AdvanceMe AI",
  description: "Search for flashcard sets to study",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading search..." />}>
      <SearchPageClient />
    </Suspense>
  );
}
