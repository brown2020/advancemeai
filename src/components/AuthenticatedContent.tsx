"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function AuthenticatedContent() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mt-8 text-center">
      <Link
        href="/practice"
        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Start Practice Tests
      </Link>
    </div>
  );
}
