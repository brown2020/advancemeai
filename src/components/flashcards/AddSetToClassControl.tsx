"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      if (isMountedRef.current) {
        setIsLoading(false);
      }
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
    return null;
  }

  if (error && classes.length === 0) {
    return <p className={cn("text-xs text-destructive", className)}>{error}</p>;
  }

  if (classes.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
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

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={`add-class-${setId}`}
        className="text-sm font-medium flex items-center gap-1.5"
      >
        <GraduationCap className="h-4 w-4" aria-hidden />
        Add to class
      </label>
      <select
        id={`add-class-${setId}`}
        className={cn(
          "h-9 w-full max-w-xs rounded-xl border border-input bg-background px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        defaultValue=""
        disabled={
          availableClasses.length === 0 || pendingClassId !== null || isLoading
        }
        onChange={(event) => void handleAddToClass(event)}
      >
        <option value="">
          {availableClasses.length === 0
            ? "Already added to every class"
            : "Choose a class..."}
        </option>
        {availableClasses.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </select>
      {containingClasses.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {containingClasses.map((cls) => (
            <Button
              key={cls.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingClassId === cls.id}
              onClick={() => void handleRemoveFromClass(cls.id)}
            >
              Remove from {cls.name}
            </Button>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
