import { NextRequest, NextResponse } from "next/server";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { verifySessionFromRequest } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params;

    // Verify user is authenticated
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDbOptional();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Get the original set
    const originalDoc = await adminDb.collection("flashcardSets").doc(setId).get();
    if (!originalDoc.exists) {
      return NextResponse.json(
        { error: "Flashcard set not found" },
        { status: 404 }
      );
    }

    const originalData = originalDoc.data();
    if (!originalData) {
      return NextResponse.json(
        { error: "Invalid flashcard set data" },
        { status: 500 }
      );
    }

    // Check if user can copy (must be public or owned by user)
    const isPublic = originalData.isPublic === true;
    const isOwner = originalData.userId === user.uid;

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to copy this set" },
        { status: 403 }
      );
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
    console.error("Copy set error:", error);
    return NextResponse.json(
      { error: "Failed to copy flashcard set" },
      { status: 500 }
    );
  }
}
