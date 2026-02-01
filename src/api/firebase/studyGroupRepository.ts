import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { AppError, ErrorType, logError } from "@/utils/errorUtils";
import type {
  StudyGroup,
  GroupActivity,
  ActivityType,
  CreateStudyGroupInput,
} from "@/types/study-group";
import { generateInviteCode, getAllMemberIds } from "@/types/study-group";

const GROUPS_COLLECTION = "studyGroups";
const ACTIVITY_SUBCOLLECTION = "activity";

/**
 * Convert Firestore document to StudyGroup
 */
function docToStudyGroup(
  id: string,
  data: Record<string, unknown>
): StudyGroup {
  return {
    id,
    name: (data.name as string) ?? "",
    description: (data.description as string) ?? "",
    ownerId: (data.ownerId as string) ?? "",
    memberIds: (data.memberIds as string[]) ?? [],
    adminIds: (data.adminIds as string[]) ?? [],
    inviteCode: (data.inviteCode as string) ?? "",
    isPublic: (data.isPublic as boolean) ?? false,
    sharedSetIds: (data.sharedSetIds as string[]) ?? [],
    createdAt:
      (data.createdAt as { toMillis?: () => number })?.toMillis?.() ??
      Date.now(),
    updatedAt:
      (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ??
      Date.now(),
  };
}

/**
 * Create a new study group
 */
export async function createStudyGroup(
  userId: string,
  input: CreateStudyGroupInput
): Promise<StudyGroup> {
  try {
    const groupRef = doc(collection(db, GROUPS_COLLECTION));
    const inviteCode = generateInviteCode();

    const groupData = {
      name: input.name.trim(),
      description: input.description.trim(),
      ownerId: userId,
      memberIds: [],
      adminIds: [],
      inviteCode,
      isPublic: input.isPublic,
      sharedSetIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(groupRef, groupData);

    return {
      id: groupRef.id,
      ...groupData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create study group", ErrorType.UNKNOWN);
  }
}

/**
 * Get a study group by ID
 */
export async function getStudyGroup(
  groupId: string
): Promise<StudyGroup | null> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const snap = await getDoc(groupRef);

    if (!snap.exists()) return null;

    return docToStudyGroup(snap.id, snap.data());
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load study group", ErrorType.UNKNOWN);
  }
}

/**
 * Get a study group by invite code
 */
export async function getStudyGroupByInviteCode(
  inviteCode: string
): Promise<StudyGroup | null> {
  try {
    const q = query(
      collection(db, GROUPS_COLLECTION),
      where("inviteCode", "==", inviteCode.toUpperCase()),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty || !snap.docs[0]) return null;

    const docSnap = snap.docs[0];
    return docToStudyGroup(docSnap.id, docSnap.data());
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to find study group", ErrorType.UNKNOWN);
  }
}

/**
 * Get all groups for a user (as owner, admin, or member)
 */
export async function getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
  try {
    // Query for groups where user is owner
    const ownerQuery = query(
      collection(db, GROUPS_COLLECTION),
      where("ownerId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    // Query for groups where user is member
    const memberQuery = query(
      collection(db, GROUPS_COLLECTION),
      where("memberIds", "array-contains", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    // Query for groups where user is admin
    const adminQuery = query(
      collection(db, GROUPS_COLLECTION),
      where("adminIds", "array-contains", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const [ownerSnap, memberSnap, adminSnap] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(memberQuery),
      getDocs(adminQuery),
    ]);

    // Combine and deduplicate
    const groupMap = new Map<string, StudyGroup>();

    for (const snap of [ownerSnap, memberSnap, adminSnap]) {
      for (const doc of snap.docs) {
        if (!groupMap.has(doc.id)) {
          groupMap.set(doc.id, docToStudyGroup(doc.id, doc.data()));
        }
      }
    }

    // Sort by updatedAt descending
    return Array.from(groupMap.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load study groups", ErrorType.UNKNOWN);
  }
}

/**
 * Update a study group
 */
export async function updateStudyGroup(
  groupId: string,
  updates: Partial<Pick<StudyGroup, "name" | "description" | "isPublic">>
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update study group", ErrorType.UNKNOWN);
  }
}

/**
 * Delete a study group
 */
export async function deleteStudyGroup(groupId: string): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await deleteDoc(groupRef);
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete study group", ErrorType.UNKNOWN);
  }
}

/**
 * Join a study group
 */
export async function joinStudyGroup(
  groupId: string,
  userId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      memberIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Add join activity
    await addGroupActivity(groupId, userId, "join_group", {});
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to join study group", ErrorType.UNKNOWN);
  }
}

/**
 * Leave a study group
 */
export async function leaveStudyGroup(
  groupId: string,
  userId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      memberIds: arrayRemove(userId),
      adminIds: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    // Add leave activity
    await addGroupActivity(groupId, userId, "leave_group", {});
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to leave study group", ErrorType.UNKNOWN);
  }
}

/**
 * Share a flashcard set with the group
 */
export async function shareSetWithGroup(
  groupId: string,
  setId: string,
  userId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      sharedSetIds: arrayUnion(setId),
      updatedAt: serverTimestamp(),
    });

    // Add share activity
    await addGroupActivity(groupId, userId, "share_set", { setId });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to share set with group", ErrorType.UNKNOWN);
  }
}

/**
 * Remove a shared set from the group
 */
export async function unshareSetFromGroup(
  groupId: string,
  setId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      sharedSetIds: arrayRemove(setId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to remove set from group", ErrorType.UNKNOWN);
  }
}

/**
 * Regenerate invite code
 */
export async function regenerateInviteCode(groupId: string): Promise<string> {
  try {
    const newCode = generateInviteCode();
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      inviteCode: newCode,
      updatedAt: serverTimestamp(),
    });
    return newCode;
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to regenerate invite code", ErrorType.UNKNOWN);
  }
}

/**
 * Add activity to group feed
 */
export async function addGroupActivity(
  groupId: string,
  userId: string,
  type: ActivityType,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const activityRef = collection(
      db,
      GROUPS_COLLECTION,
      groupId,
      ACTIVITY_SUBCOLLECTION
    );
    await addDoc(activityRef, {
      userId,
      type,
      metadata,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Non-blocking - activity is supplementary
    logError(error);
  }
}

/**
 * Get recent activity for a group
 */
export async function getGroupActivity(
  groupId: string,
  limitCount = 20
): Promise<GroupActivity[]> {
  try {
    const activityRef = collection(
      db,
      GROUPS_COLLECTION,
      groupId,
      ACTIVITY_SUBCOLLECTION
    );
    const q = query(
      activityRef,
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        groupId,
        userId: data.userId,
        type: data.type,
        metadata: data.metadata ?? {},
        createdAt: data.createdAt?.toMillis() ?? Date.now(),
      };
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load group activity", ErrorType.UNKNOWN);
  }
}

/**
 * Promote member to admin
 */
export async function promoteMemberToAdmin(
  groupId: string,
  userId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      memberIds: arrayRemove(userId),
      adminIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to promote member", ErrorType.UNKNOWN);
  }
}

/**
 * Demote admin to member
 */
export async function demoteAdminToMember(
  groupId: string,
  userId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      adminIds: arrayRemove(userId),
      memberIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to demote admin", ErrorType.UNKNOWN);
  }
}

/**
 * Remove member from group
 */
export async function removeMemberFromGroup(
  groupId: string,
  userId: string
): Promise<void> {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      memberIds: arrayRemove(userId),
      adminIds: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to remove member", ErrorType.UNKNOWN);
  }
}
