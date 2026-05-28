import { readFileSync } from "node:fs";
import { join } from "node:path";

type FirestoreIndexField = {
  fieldPath: string;
  order: string;
};

type FirestoreIndex = {
  collectionGroup: string;
  fields: FirestoreIndexField[];
};

type FirestoreIndexesFile = {
  indexes: FirestoreIndex[];
};

function loadIndexes(): FirestoreIndexesFile {
  const path = join(process.cwd(), "firestore.indexes.json");
  return JSON.parse(readFileSync(path, "utf8")) as FirestoreIndexesFile;
}

function hasCompositeIndex(
  indexes: FirestoreIndex[],
  collectionGroup: string,
  fields: Array<{ fieldPath: string; order: string }>
): boolean {
  return indexes.some(
    (index) =>
      index.collectionGroup === collectionGroup &&
      fields.every((expected) =>
        index.fields.some(
          (f) =>
            f.fieldPath === expected.fieldPath && f.order === expected.order
        )
      ) &&
      index.fields.length === fields.length
  );
}

describe("firestore.indexes.json", () => {
  const { indexes } = loadIndexes();

  it("defines dashboard practiceAttempts composite index", () => {
    expect(
      hasCompositeIndex(indexes, "practiceAttempts", [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "createdAt", order: "DESCENDING" },
      ])
    ).toBe(true);
  });

  it("defines user flashcardSets composite index for dashboard recent sets", () => {
    expect(
      hasCompositeIndex(indexes, "flashcardSets", [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "updatedAt", order: "DESCENDING" },
      ])
    ).toBe(true);
  });

  it("defines public flashcardSets composite index for search", () => {
    expect(
      hasCompositeIndex(indexes, "flashcardSets", [
        { fieldPath: "isPublic", order: "ASCENDING" },
        { fieldPath: "updatedAt", order: "DESCENDING" },
      ])
    ).toBe(true);
  });
});
