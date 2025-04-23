"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function DebugPage() {
  const { user, isLoading } = useAuth();
  const [cookies, setCookies] = useState<string>("");

  // Access practice page with a test parameter
  const goToPracticeWithTestParam = () => {
    window.location.href = "/practice?test=true";
  };

  // Direct access to practice
  const goToPractice = () => {
    window.location.href = "/practice";
  };

  // Check current cookies
  const checkCookies = () => {
    setCookies(document.cookie);
  };

  useEffect(() => {
    checkCookies();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>

      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <p className="mb-2">Loading: {isLoading ? "Yes" : "No"}</p>
        <p className="mb-2">
          User: {user ? `Logged in as ${user.email}` : "Not logged in"}
        </p>
        <p className="mb-2">Cookies: {cookies || "None"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Actions</h2>
          <div className="flex flex-col space-y-3">
            <button
              onClick={checkCookies}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Cookies
            </button>
            <Link
              href="/auth/signin"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Navigation Actions</h2>
          <div className="flex flex-col space-y-3">
            <button
              onClick={goToPractice}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Practice (Normal)
            </button>
            <button
              onClick={goToPracticeWithTestParam}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Practice (With Test Flag)
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h2 className="text-xl font-semibold mb-2">Debugging Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check your authentication status above</li>
          <li>If not logged in, use the Sign In button</li>
          <li>Try navigating to the Practice page with one of the buttons</li>
          <li>
            If you&apos;re still redirected, use the &quot;With Test Flag&quot;
            option
          </li>
          <li>Check browser console for any errors</li>
        </ol>
      </div>
    </div>
  );
}
