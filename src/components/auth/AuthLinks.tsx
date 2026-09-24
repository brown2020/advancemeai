"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button-variants";
import { signInHref, signUpHref } from "@/constants/appConstants";

/** Sign-in and sign-up links that return the user to the current page. */
export function AuthLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <Link
        href={signInHref(pathname)}
        className={cn(buttonVariants({ size: "lg" }), "flex-1")}
      >
        <LogIn aria-hidden />
        Sign in
      </Link>
      <Link
        href={signUpHref(pathname)}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}
      >
        Create free account
      </Link>
    </div>
  );
}
