"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";

/**
 * Hero section with authentication-aware content
 * Client component for user state access
 */
export function HomeHero() {
  const { user } = useAuth();

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="mb-8">
            <Image
              src="/advance_icon.png"
              alt="Advance.me Logo"
              width={180}
              height={180}
              className="w-32 h-32 md:w-40 md:h-40 drop-shadow-lg"
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
      <p className="text-xl text-gray-600 max-w-2xl mb-8">
        Continue your learning journey with personalized practice tests,
        quizzes, and flashcards.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link
          href="/practice"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Continue Practice
        </Link>
        <Link
          href="/profile"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-base font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
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
      <p className="text-xl text-gray-600 max-w-2xl mb-8">
        Personalized practice tests, quizzes, and flashcards to help you master
        any subject.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link
          href="#features"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Learn More
        </Link>
        <div className="flex gap-2">
          <Link
            href="/auth/signin"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-base font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-blue-500 bg-white px-6 text-base font-medium text-blue-600 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
