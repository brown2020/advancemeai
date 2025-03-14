"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Auth from "./Auth";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

const NavLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className={cn(
      "inline-flex items-center justify-center px-4 py-2 text-base font-medium rounded-xl transition-all duration-200",
      className
    )}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4">
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
            <NavLink
              href="/practice"
              className="text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
            >
              Practice Tests
            </NavLink>
            <NavLink
              href="/quizzes"
              className="text-white bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
            >
              Quiz Library
            </NavLink>
            <NavLink
              href="/flashcards"
              className="text-white bg-linear-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl"
            >
              Flashcards
            </NavLink>
            <NavLink
              href="/profile"
              className="text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Profile
            </NavLink>
          </>
        )}
        <Auth />
      </div>
    </nav>
  );
}
