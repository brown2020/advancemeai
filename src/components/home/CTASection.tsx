"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Call to action section - only shown for unauthenticated users
 */
export function CTASection() {
  const { user } = useAuth();

  // Don't render for authenticated users
  if (user) {
    return null;
  }

  return (
    <section className="w-full py-16 md:py-24 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Ready to advance your learning?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mb-8">
            Join thousands of students who are using Advance.me to achieve their
            academic goals.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  );
}
