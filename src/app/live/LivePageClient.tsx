"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Gamepad2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/common/UIComponents";
import { LiveDemoBadge } from "@/components/live/LiveDemoBadge";

const CODE_LENGTH = 6;

export default function LivePageClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length !== CODE_LENGTH) {
      setError("Please enter a valid 6-character game code");
      return;
    }
    router.push(`/live/${trimmedCode}`);
  };

  return (
    <PageContainer className="max-w-md py-12 md:py-16">
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <Gamepad2 className="size-8" aria-hidden />
        </div>
        <div className="mb-3 flex justify-center">
          <LiveDemoBadge />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Advance.me Live</h1>
        <p className="mt-2 text-muted-foreground">Join a live study game with your class.</p>
      </div>

      <form onSubmit={handleJoin} className="mt-10 space-y-3" noValidate>
        <label htmlFor="game-code" className="block text-center text-sm font-semibold">
          Game code
        </label>
        <Input
          id="game-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
          placeholder="ABC123"
          maxLength={CODE_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-16 text-center font-mono text-3xl font-bold uppercase tracking-[0.35em] placeholder:text-muted-foreground/50"
          error={error ?? undefined}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={code.trim().length < CODE_LENGTH}
        >
          Join game
          <ArrowRight aria-hidden />
        </Button>
      </form>

      <div className="relative my-10" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs font-semibold uppercase">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="text-center">
        <p className="mb-3 text-sm text-muted-foreground">Teaching? Run a game for your class.</p>
        <Link href="/live/host" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          <Presentation aria-hidden />
          Host a game
        </Link>
      </div>
    </PageContainer>
  );
}
