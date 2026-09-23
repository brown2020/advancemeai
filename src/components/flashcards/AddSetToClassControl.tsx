"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GraduationCap, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addSetToClass,
  getUserTeacherClasses,
  removeSetFromClass,
} from "@/services/classService";
import type { Class } from "@/types/class";
import { canManageGroup } from "@/types/study-group";
import { cn } from "@/utils/cn";

type AddSetToClassControlProps = {
  userId: string;
  setId: string;
  className?: string;
};

export function AddSetToClassControl({
  userId,
  setId,
  className,
}: AddSetToClassControlProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserTeacherClasses(userId);
      if (!isMountedRef.current) return;
      setClasses(data.filter((cls) => canManageGroup(cls, userId)));
    } catch {
      if (isMountedRef.current) {
        setError("Failed to load your classes. Please try again.");
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    void refresh();
    return () => {
      isMountedRef.current = false;
    };
  }, [refresh]);

  const containingClasses = useMemo(
    () => classes.filter((cls) => cls.sharedSetIds.includes(setId)),
    [classes, setId]
  );
  const availableClasses = useMemo(
    () => classes.filter((cls) => !cls.sharedSetIds.includes(setId)),
    [classes, setId]
  );

  if (isLoading && classes.length === 0) {
    return <Skeleton className={cn("h-16 w-full rounded-xl", className)} />;
  }

  if (error && classes.length === 0) {
    return (
      <p role="alert" className={cn("text-sm text-destructive", className)}>
        {error}
      </p>
    );
  }

  if (classes.length === 0) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <GraduationCap className="size-4 shrink-0" aria-hidden />
        Create a class to share sets with students.
      </p>
    );
  }

  const handleAddToClass = async (event: ChangeEvent<HTMLSelectElement>) => {
    const classId = event.currentTarget.value;
    event.currentTarget.value = "";
    if (!classId) return;

    setPendingClassId(classId);
    setError(null);
    try {
      await addSetToClass(classId, setId, userId);
      await refresh();
    } catch {
      setError("Failed to add this set to the class. Please try again.");
    } finally {
      setPendingClassId(null);
    }
  };

  const handleRemoveFromClass = async (classId: string) => {
    setPendingClassId(classId);
    setError(null);
    try {
      await removeSetFromClass(classId, setId, userId);
      await refresh();
    } catch {
      setError("Failed to remove this set from the class. Please try again.");
    } finally {
      setPendingClassId(null);
    }
  };

  const selectId = `add-class-${setId}`;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={selectId} className="flex items-center gap-2 text-sm font-semibold">
        <GraduationCap className="size-4 text-primary" aria-hidden />
        Add to class
      </label>
      <Select
        id={selectId}
        defaultValue=""
        disabled={availableClasses.length === 0 || pendingClassId !== null || isLoading}
        onChange={(event) => void handleAddToClass(event)}
      >
        <option value="">
          {availableClasses.length === 0 ? "Already added to every class" : "Choose a class…"}
        </option>
        {availableClasses.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </Select>
      {containingClasses.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Classes with this set">
          {containingClasses.map((cls) => (
            <li key={cls.id}>
              <button
                type="button"
                disabled={pendingClassId === cls.id}
                onClick={() => void handleRemoveFromClass(cls.id)}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-accent pl-3 pr-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label={`Remove from ${cls.name}`}
              >
                {cls.name}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
