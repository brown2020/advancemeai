"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveDemoBadge } from "./LiveDemoBadge";

/** Name entry for a player joining a game code. */
export function LiveJoinScreen({
  code,
  onJoin,
  onCancel,
}: {
  code: string;
  onJoin: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim());
  };

  return (
    <div className="animate-fade-in text-center">
      <LiveDemoBadge />
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Joining game
      </p>
      <p className="mt-1 font-mono text-4xl font-bold tracking-[0.2em] text-primary">{code}</p>

      <form onSubmit={submit} className="mt-10 space-y-3 text-left">
        <label htmlFor="player-name" className="block text-center text-sm font-semibold">
          What should we call you?
        </label>
        <Input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          autoComplete="nickname"
          className="h-14 text-center text-lg font-semibold"
        />
        <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
          Join game
          <ArrowRight aria-hidden />
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </form>
    </div>
  );
}
