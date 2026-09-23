"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CreateFolderFormProps = {
  onCreate: (name: string) => Promise<void>;
};

/** Inline "new folder" form: one input and a submit button. */
export function CreateFolderForm({ onCreate }: CreateFolderFormProps) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await onCreate(trimmed);
      setName("");
    } catch {
      // Errors surface through the folders hook's error state.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center"
    >
      <label htmlFor="new-folder-name" className="sr-only">
        New folder name
      </label>
      <Input
        id="new-folder-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New folder name, e.g. SAT Math"
        maxLength={80}
        className="border-transparent bg-secondary/60 focus-visible:bg-card"
      />
      <Button
        type="submit"
        disabled={!name.trim()}
        isLoading={isSaving}
        className="sm:w-auto"
      >
        {!isSaving && <FolderPlus aria-hidden />}
        Create folder
      </Button>
    </form>
  );
}
