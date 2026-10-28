import { FieldValue } from "firebase-admin/firestore";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { toMillis } from "@/utils/timestamp";
import type { StudyGroup } from "@/types/study-group";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function mapStudyGroup(id: string, data: Record<string, unknown>): StudyGroup {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    ownerId: String(data.ownerId ?? ""),
    memberIds: asStringArray(data.memberIds),
    adminIds: asStringArray(data.adminIds),
    inviteCode: String(data.inviteCode ?? ""),
    isPublic: data.isPublic === true,
    sharedSetIds: asStringArray(data.sharedSetIds),
    isClass: data.isClass === true,
    school: typeof data.school === "string" ? data.school : undefined,
    subject: typeof data.subject === "string" ? data.subject : undefined,
    folderIds: Array.isArray(data.folderIds)
      ? data.folderIds.filter((item): item is string => typeof item === "string")
      : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function findGroupByInviteCode(code: string): Promise<StudyGroup | null> {
  const db = getAdminDbOptional();
  if (!db) return null;
  const snap = await db
    .collection("studyGroups")
    .where("inviteCode", "==", code)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return mapStudyGroup(doc.id, doc.data() as Record<string, unknown>);
}

async function writeActivity(groupId: string, userId: string, type: string): Promise<void> {
  const db = getAdminDbOptional();
  if (!db) return;
  await db.collection("studyGroups").doc(groupId).collection("activity").add({
    userId,
    type,
    metadata: {},
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function joinGroupByCode(
  code: string,
  userId: string
): Promise<{ group: StudyGroup; alreadyMember: boolean } | null> {
  const db = getAdminDbOptional();
  if (!db) return null;
  const group = await findGroupByInviteCode(code);
  if (!group) return null;

  const alreadyMember =
    group.ownerId === userId ||
    group.memberIds.includes(userId) ||
    group.adminIds.includes(userId);

  if (!alreadyMember) {
    await db.collection("studyGroups").doc(group.id).update({
      memberIds: FieldValue.arrayUnion(userId),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await writeActivity(group.id, userId, "join_group");
    group.memberIds = [...group.memberIds, userId];
  }

  return { group, alreadyMember };
}

export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<"ok" | "missing" | "owner"> {
  const db = getAdminDbOptional();
  if (!db) return "missing";
  const snap = await db.collection("studyGroups").doc(groupId).get();
  if (!snap.exists) return "missing";
  const group = mapStudyGroup(snap.id, snap.data() as Record<string, unknown>);
  if (group.ownerId === userId) return "owner";

  await snap.ref.update({
    memberIds: FieldValue.arrayRemove(userId),
    adminIds: FieldValue.arrayRemove(userId),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await writeActivity(groupId, userId, "leave_group");
  return "ok";
}
