import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { canCopyFlashcardSet } from "@/lib/flashcard-visibility";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { logger } from "@/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params;

    // Verify user is authenticated
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    const adminDb = getAdminDbOptional();
    if (!adminDb) {
      return errorResponse("Database not available", 503);
    }

    // Get the original set
    const originalDoc = await adminDb.collection("flashcardSets").doc(setId).get();
    if (!originalDoc.exists) {
      return errorResponse("Flashcard set not found", 404);
    }

    const originalData = originalDoc.data();
    if (!originalData) {
      return errorResponse("Invalid flashcard set data", 500);
    }

    if (!canCopyFlashcardSet(originalData, user.uid)) {
      return errorResponse("You don't have permission to copy this set", 403);
    }

    // Create the copy
    const now = Date.now();
    const newSetData = {
      title: `${originalData.title} (copy)`,
      description: originalData.description || "",
      cards: originalData.cards || [],
      userId: user.uid,
      isPublic: false, // Copies start as private
      visibility: "private",
      createdAt: now,
      updatedAt: now,
      // Track where this was copied from
      copiedFromSetId: setId,
      copiedFromUserId: originalData.userId,
      // Preserve language settings if they exist
      termLanguage: originalData.termLanguage,
      definitionLanguage: originalData.definitionLanguage,
      subjects: originalData.subjects,
    };

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(newSetData).filter(([, v]) => v !== undefined)
    );

    const newSetRef = await adminDb.collection("flashcardSets").add(cleanedData);

    return NextResponse.json({
      success: true,
      newSetId: newSetRef.id,
      message: "Flashcard set copied successfully",
    });
  } catch (error) {
    logger.error("Copy set error:", error);
    return errorResponse("Failed to copy flashcard set", 500);
  }
}
