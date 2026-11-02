import { NextRequest } from "next/server";
import { resetRateLimits } from "@/lib/rate-limit";

const mockSets = [
  {
    id: "algebra-1",
    data: () => ({
      title: "Algebra Foundations",
      description: "Linear equations",
      visibility: "public",
      isPublic: true,
      cards: [{ front: "x" }, { front: "y" }],
      createdAt: 1,
      updatedAt: 3,
      subjects: ["math"],
      timesStudied: 4,
    }),
  },
  {
    id: "private-notes",
    data: () => ({
      title: "Algebra private notes",
      description: "Not for search",
      visibility: "private",
      isPublic: false,
      cards: [{ front: "secret" }],
      createdAt: 1,
      updatedAt: 2,
      subjects: ["math"],
      timesStudied: 99,
    }),
  },
  {
    id: "geometry",
    data: () => ({
      title: "Geometry",
      description: "Angles and proofs",
      visibility: "public",
      isPublic: true,
      cards: [],
      createdAt: 1,
      updatedAt: 4,
      subjects: ["math"],
      timesStudied: 10,
    }),
  },
];

jest.mock("@/config/firebase-admin", () => ({
  getAdminDbOptional: () => ({
    collection: () => ({
      where: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({
              forEach: (
                callback: (doc: (typeof mockSets)[number]) => void
              ) => {
                for (const doc of mockSets) callback(doc);
              },
            }),
          }),
        }),
      }),
    }),
  }),
}));

import { GET } from "./route";

function searchRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/search?${query}`, {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
}

describe("search route", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("rejects an empty search query", async () => {
    const response = await GET(searchRequest("limit=10"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid search parameters",
    });
  });

  it("returns public sets that match the query and drops private sets", async () => {
    const response = await GET(searchRequest("q=algebra&limit=10"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          id: "algebra-1",
          title: "Algebra Foundations",
          description: "Linear equations",
          cardCount: 2,
          createdAt: 1,
          updatedAt: 3,
          subjects: ["math"],
          timesStudied: 4,
        },
      ],
      total: 1,
      hasMore: false,
      query: "algebra",
    });
  });
});
