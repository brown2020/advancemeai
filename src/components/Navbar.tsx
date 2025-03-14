"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Auth from "./Auth";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { Button, buttonVariants } from "@/components/ui/button";

type NavLinkProps = {
  href: string;
  variant?: "default" | "practice" | "quiz" | "flashcard" | "profile";
  children: React.ReactNode;
};

const NavLink = ({ href, variant = "default", children }: NavLinkProps) => (
  <Link
    href={href}
    className={cn(
      buttonVariants({
        variant,
        size: "default",
      })
    )}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
      <Link href="/" className="text-xl font-bold flex items-center gap-2">
        <Image
          src="/advance_icon.png"
          alt="Advance.me Logo"
          width={32}
          height={32}
          className="w-8 h-8"
          priority
          loading="eager"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
        />
        Advance.me
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <NavLink href="/practice" variant="practice">
              Practice Tests
            </NavLink>
            <NavLink href="/quizzes" variant="quiz">
              Quiz Library
            </NavLink>
            <NavLink href="/flashcards" variant="flashcard">
              Flashcards
            </NavLink>
            <NavLink href="/profile" variant="profile">
              Profile
            </NavLink>
          </>
        )}
        <Auth />
      </div>
    </nav>
  );
}
