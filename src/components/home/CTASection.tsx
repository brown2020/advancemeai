"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

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
    <section className="w-full py-16 md:py-24 bg-muted/40">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Ready to advance your learning?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Join thousands of students who are using Advance.me to achieve their
            academic goals.
          </p>
          <Link
            href="/auth/signup"
            className={cn(buttonVariants({ size: "lg" }), "h-12")}
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  );
}
