import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDbOptional } from "@/config/firebase-admin";

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["sets", "all"]).optional().default("all"),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDbOptional();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);

    const validationResult = searchQuerySchema.safeParse({
      q: searchParams.get("q"),
      type: searchParams.get("type"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { q, limit, offset } = validationResult.data;
    const searchTerms = q.toLowerCase().split(/\s+/).filter(Boolean);

    // Search public flashcard sets
    // Note: Firestore doesn't support full-text search, so we fetch public sets
    // and filter client-side. For production, consider Algolia or Typesense.
    const setsSnapshot = await adminDb
      .collection("flashcardSets")
      .where("isPublic", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(200) // Fetch more to filter
      .get();

    interface FlashcardSetResult {
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

    const results: FlashcardSetResult[] = [];

    setsSnapshot.forEach((doc) => {
      const data = doc.data();
      const title = (data.title || "").toLowerCase();
      const description = (data.description || "").toLowerCase();
      const subjects = (data.subjects || []).map((s: string) => s.toLowerCase());

      // Check if any search term matches
      const matches = searchTerms.some(
        (term) =>
          title.includes(term) ||
          description.includes(term) ||
          subjects.some((s: string) => s.includes(term))
      );

      if (matches) {
        results.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          cardCount: data.cards?.length || 0,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          subjects: data.subjects,
          timesStudied: data.timesStudied || 0,
        });
      }
    });

    // Sort by relevance (title match first) then by popularity
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const firstTerm = searchTerms[0] || "";

      const aTitleMatch = aTitle.includes(firstTerm);
      const bTitleMatch = bTitle.includes(firstTerm);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // Then by times studied
      return (b.timesStudied || 0) - (a.timesStudied || 0);
    });

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);
    const hasMore = offset + limit < results.length;

    return NextResponse.json({
      results: paginatedResults,
      total: results.length,
      hasMore,
      query: q,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
