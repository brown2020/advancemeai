"use client";

import Link from "next/link";
import Auth from "./Auth";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-gray-900 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
          </div>
          <div className="flex items-center">
            <Auth />
          </div>
        </div>
      </div>
    </nav>
  );
}
