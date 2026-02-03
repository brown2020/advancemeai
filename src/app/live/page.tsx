"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LiveJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      setError("Please enter a valid 6-character game code");
      return;
    }

    // Navigate to the game room
    router.push(`/live/${trimmedCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Advance.me Live</h1>
          <p className="text-muted-foreground">
            Join a live study game with your class
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-2">
              Enter Game Code
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest h-14 uppercase"
              autoFocus
              autoComplete="off"
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={code.trim().length < 6}
          >
            <Users className="h-5 w-5 mr-2" />
            Join Game
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Host Option */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Are you a teacher? Host your own game
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/live/host")}
            className="w-full"
          >
            Host a Game
          </Button>
        </div>
      </div>
    </div>
  );
}
