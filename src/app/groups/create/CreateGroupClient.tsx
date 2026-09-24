"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Globe, GraduationCap, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import * as classService from "@/services/classService";
import { isTeacher } from "@/types/user-profile";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";
import {
  EmptyState,
  ErrorDisplay,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { signInHref } from "@/constants/appConstants";

const NAME_MAX = 50;
const DESCRIPTION_MAX = 200;

function BackToClasses() {
  return (
    <Link
      href="/groups"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Classes
    </Link>
  );
}

export default function CreateGroupClient() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateClass = isTeacher(userProfile);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(signInHref("/groups/create"));
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <PageContainer width="narrow">
        <LoadingState message="Checking your session..." />
      </PageContainer>
    );
  }

  if (!canCreateClass) {
    return (
      <PageContainer width="narrow">
        <BackToClasses />
        <EmptyState
          icon={<AlertTriangle />}
          title="Teacher account required"
          message="Only teachers can create classes. If you're a teacher, update your role in your profile."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/profile" className={buttonVariants()}>
                Update profile
              </Link>
              <Link href="/groups/join" className={buttonVariants({ variant: "outline" })}>
                Join a class instead
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Class name is required");
      return;
    }

    setIsSubmitting(true);
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
      logger.error("Failed to create class:", err);
      setError(err instanceof Error ? err.message : "Failed to create class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer className="max-w-xl">
      <BackToClasses />
      <PageHeader
        title="New class"
        description="Organize students, share sets and track their progress."
      />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} noValidate>
          {error && <ErrorDisplay message={error} />}

          <FormField
            label="Class name"
            htmlFor="class-name"
            required
            description={`${name.length}/${NAME_MAX}`}
          >
            <Input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AP Chemistry – Period 3"
              maxLength={NAME_MAX}
              className="h-12 text-base"
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="class-description"
            description={`${description.length}/${DESCRIPTION_MAX}`}
          >
            <Textarea
              id="class-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn in this class?"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              className="resize-none"
            />
          </FormField>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField label="School" htmlFor="class-school" description="Optional">
              <Input
                id="class-school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Lincoln High School"
                maxLength={100}
              />
            </FormField>
            <FormField label="Subject" htmlFor="class-subject" description="Optional">
              <Input
                id="class-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Chemistry"
                maxLength={50}
              />
            </FormField>
          </div>

          <fieldset className="mb-6">
            <legend className="mb-1.5 text-sm font-semibold">Visibility</legend>
            <div role="radiogroup" aria-label="Visibility" className="grid gap-2 sm:grid-cols-2">
              <VisibilityChoice
                selected={!isPublic}
                onSelect={() => setIsPublic(false)}
                icon={<Lock className="size-5" aria-hidden />}
                title="Private"
                description="Only students with the code can join"
              />
              <VisibilityChoice
                selected={isPublic}
                onSelect={() => setIsPublic(true)}
                icon={<Globe className="size-5" aria-hidden />}
                title="Public"
                description="Anyone can find and join"
              />
            </div>
          </fieldset>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!name.trim()}
          >
            {!isSubmitting && <GraduationCap aria-hidden />}
            {isSubmitting ? "Creating..." : "Create class"}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}

function VisibilityChoice({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-accent" : "border-input bg-card hover:border-primary/40"
      )}
    >
      <span className={cn("mt-0.5", selected ? "text-primary" : "text-muted-foreground")}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
