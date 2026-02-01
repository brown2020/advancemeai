"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import * as studyGroupService from "@/services/studyGroupService";
import { cn } from "@/utils/cn";

export default function CreateGroupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/signin?redirect=/groups/create");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const group = await studyGroupService.createStudyGroup(user.uid, {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });

      router.push(`/groups/${group.id}`);
    } catch (err) {
      console.error("Failed to create group:", err);
      setError("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Groups
        </Link>
        <h1 className="text-2xl font-bold">Create Study Group</h1>
        <p className="text-muted-foreground mt-1">
          Start a new group to study with friends
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Group Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., SAT Study Squad"
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {name.length}/50 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What&apos;s this group about?"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {description.length}/200 characters
          </p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium mb-3">Visibility</label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-colors",
                !isPublic
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <Lock
                  size={20}
                  className={cn(
                    "mt-0.5",
                    !isPublic ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="font-medium">Private</p>
                  <p className="text-sm text-muted-foreground">
                    Only people with the invite link can join
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-colors",
                isPublic
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <Globe
                  size={20}
                  className={cn(
                    "mt-0.5",
                    isPublic ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="font-medium">Public</p>
                  <p className="text-sm text-muted-foreground">
                    Anyone can find and join this group
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className={cn(
            "w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium transition-colors",
            isSubmitting || !name.trim()
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-primary/90"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Users size={18} />
              Create Group
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
