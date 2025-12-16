"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

/**
 * Hero section with authentication-aware content
 * Client component for user state access
 */
export function HomeHero() {
  const { user } = useAuth();

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/40">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="mb-8">
            <Image
              src="/advance_icon.png"
              alt="Advance.me Logo"
              width={180}
              height={180}
              className="w-32 h-32 md:w-40 md:h-40"
              priority
            />
          </div>
          {user ? (
            <AuthenticatedHero email={user.email} />
          ) : (
            <UnauthenticatedHero />
          )}
        </div>
      </div>
    </section>
  );
}

function AuthenticatedHero({ email }: { email: string | null }) {
  const displayName = email?.split("@")[0] || "Student";

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl max-w-3xl mb-4">
        Welcome Back, {displayName}!
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Continue your learning journey with personalized practice tests,
        quizzes, and flashcards.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link
          href="/practice"
          className={cn(buttonVariants({ size: "lg" }), "h-12")}
        >
          Continue Practice
        </Link>
        <Link
          href="/profile"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12"
          )}
        >
          View Progress
        </Link>
      </div>
    </>
  );
}

function UnauthenticatedHero() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl max-w-3xl mb-4">
        Advance Your Learning Journey
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Personalized practice tests, quizzes, and flashcards to help you master
        any subject.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link
          href="#features"
          className={cn(buttonVariants({ size: "lg" }), "h-12")}
        >
          Learn More
        </Link>
        <div className="flex gap-2">
          <Link
            href="/auth/signin"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 px-6"
            )}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
