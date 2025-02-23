"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Auth from "./Auth";
import Image from "next/image";

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
        />
        Advance.me
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Practice Tests
            </Link>
            <Link
              href="/quizzes"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Quiz Library
            </Link>
          </>
        )}
        <Auth />
      </div>
    </nav>
  );
}
