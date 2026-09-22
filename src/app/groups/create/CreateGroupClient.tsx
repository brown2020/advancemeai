"use client";

import { useState, useReducer} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Lock,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import * as classService from "@/services/classService";
import { cn } from "@/utils/cn";
import { isTeacher } from "@/types/user-profile";

export default function CreateGroupClient() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [state, dispatch] = useReducer(
    (s: any, p: Record<string, any>): any => {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(p)) {
        const value = p[key];
        patch[key] = typeof value === "function" ? value(s[key]) : value;
      }
      return { ...s, ...patch };
    },
    {
    name: "",
    description: "",
    school: "",
    subject: "",
    isPublic: false,
    isSubmitting: false,
    error: null,
    }
  );
  const { name, description, school, subject, isPublic, isSubmitting, error } = state as any;
  const assignName = (value: any) => dispatch({ name: value });
  const assignDescription = (value: any) => dispatch({ description: value });
  const assignSchool = (value: any) => dispatch({ school: value });
  const assignSubject = (value: any) => dispatch({ subject: value });
  const assignIsPublic = (value: any) => dispatch({ isPublic: value });
  const assignIsSubmitting = (value: any) => dispatch({ isSubmitting: value });
  const assignError = (value: any) => dispatch({ error: value });


  const canCreateClass = isTeacher(userProfile);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/signin?returnTo=/groups/create");
    return null;
  }

  // Show message for non-teachers
  if (!canCreateClass) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Classes
        </Link>

        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">Teacher Account Required</h2>
          <p className="text-muted-foreground mb-6">
            Only teachers can create classes. If you&apos;re a teacher, please
            update your role in your profile settings.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/profile"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Update Profile
            </Link>
            <Link
              href="/groups"
              className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Browse Classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    assignError(null);

    if (!name.trim()) {
      assignError("Class name is required");
      return;
    }

    assignIsSubmitting(true);
    try {
      const newClass = await classService.createClass(user.uid, {
        name: name.trim(),
        description: description.trim(),
        isPublic,
        school: school.trim() || undefined,
        subject: subject.trim() || undefined,
      });

      router.push(`/groups/${newClass.id}`);
    } catch (err) {
      console.error("Failed to create class:", err);
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to create class. Please try again."
      );
    } finally {
      assignIsSubmitting(false);
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
          Back to Classes
        </Link>
        <h1 className="text-2xl font-bold">Create Class</h1>
        <p className="text-muted-foreground mt-1">
          Create a class to organize students and track their progress
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
            Class Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => assignName(e.target.value)}
            placeholder="e.g., AP Chemistry - Period 3"
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {name.length}/50 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => assignDescription(e.target.value)}
            placeholder="What will students learn in this class?"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {description.length}/200 characters
          </p>
        </div>

        {/* School */}
        <div>
          <label htmlFor="school" className="block text-sm font-medium mb-2">
            School (optional)
          </label>
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => assignSchool(e.target.value)}
            placeholder="e.g., Lincoln High School"
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            maxLength={100}
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">
            Subject (optional)
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => assignSubject(e.target.value)}
            placeholder="e.g., Chemistry, Mathematics, History"
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            maxLength={50}
          />
        </div>

        {/* Visibility */}
        <div>
          <label htmlFor="lbl-CreateGroupClient-235" className="block text-sm font-medium mb-3">Visibility</label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => assignIsPublic(false)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-colors",
                !isPublic ? "border-primary bg-primary/5" : "hover:bg-muted/50"
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
                    Only students with the invite code can join
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => assignIsPublic(true)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-colors",
                isPublic ? "border-primary bg-primary/5" : "hover:bg-muted/50"
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
                    Anyone can find and join this class
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
              <GraduationCap size={18} />
              Create Class
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
