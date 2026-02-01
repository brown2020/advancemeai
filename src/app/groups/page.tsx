"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GroupCard, GroupCardSkeleton } from "@/components/groups";
import * as studyGroupService from "@/services/studyGroupService";
import type { StudyGroup } from "@/types/study-group";

export default function GroupsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?redirect=/groups");
      return;
    }

    const loadGroups = async () => {
      try {
        const userGroups = await studyGroupService.getUserStudyGroups(user.uid);
        setGroups(userGroups);
      } catch (error) {
        console.error("Failed to load groups:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadGroups();
  }, [user, authLoading, router]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || (!user && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate and learn together
          </p>
        </div>
        <button
          onClick={() => router.push("/groups/create")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>New Group</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Groups list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          {groups.length === 0 ? (
            <>
              <h3 className="text-lg font-medium">No study groups yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Create a group to start studying with friends
              </p>
              <button
                onClick={() => router.push("/groups/create")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={18} />
                <span>Create Your First Group</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium">No groups found</h3>
              <p className="text-muted-foreground mt-1">
                Try a different search term
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              currentUserId={user?.uid ?? ""}
            />
          ))}
        </div>
      )}

      {/* Join by code section */}
      <div className="mt-8 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-2">Have an invite code?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Enter an invite code to join an existing group
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem("code") as HTMLInputElement;
            if (input.value.trim()) {
              router.push(`/groups/join?code=${input.value.trim().toUpperCase()}`);
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            name="code"
            placeholder="Enter code (e.g., ABC123XY)"
            className="flex-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
            maxLength={8}
          />
          <button
            type="submit"
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
