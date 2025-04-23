"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Enhanced navigation function with fallback
  const handleNavigation = (path: string) => {
    console.log("Navigating to:", path);

    // If no user is logged in, add test=true parameter to bypass auth check
    if (!user && path.startsWith("/practice")) {
      path = `${path}?test=true`;
      console.log("Adding test parameter for unauthenticated access:", path);
    }

    window.location.href = path;
  };

  // Reset navigation state when component unmounts or after successful navigation
  useEffect(() => {
    return () => {
      setIsNavigating(false);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
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
              <>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl max-w-3xl mb-4">
                  Welcome Back, {user.email?.split("@")[0] || "Student"}!
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mb-8">
                  Continue your learning journey with personalized practice
                  tests, quizzes, and flashcards.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  {/* Use button with onClick for more reliable navigation */}
                  <button
                    onClick={() => handleNavigation("/practice")}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Continue Practice
                  </button>
                  <Link
                    href="/profile"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-base font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                  >
                    View Progress
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl max-w-3xl mb-4">
                  Advance Your Learning Journey
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mb-8">
                  Personalized practice tests, quizzes, and flashcards to help
                  you master any subject.
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
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Everything you need to accelerate your learning
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Practice Tests</h3>
              <p className="text-gray-600 text-center">
                Realistic practice tests with detailed explanations to help you
                prepare
              </p>
              {!user && (
                <button
                  onClick={() => handleNavigation("/practice")}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Try it now →
                </button>
              )}
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Flashcards</h3>
              <p className="text-gray-600 text-center">
                Create and study with interactive flashcards for effective
                memorization
              </p>
              {!user && (
                <Link
                  href="/flashcards"
                  className="mt-4 text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Try it now →
                </Link>
              )}
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Quizzes</h3>
              <p className="text-gray-600 text-center">
                Quick quizzes to test your knowledge and identify areas for
                improvement
              </p>
              {!user && (
                <Link
                  href="/quizzes"
                  className="mt-4 text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Try it now →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section - Only show for logged out users */}
      {!user && (
        <section className="w-full py-16 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Ready to advance your learning?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mb-8">
                Join thousands of students who are using Advance.me to achieve
                their academic goals.
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
      )}

      {/* Hidden debug link */}
      <div className="mt-10 text-center opacity-20 hover:opacity-100 transition-opacity">
        <Link
          href="/practice/debug"
          className="text-xs text-gray-400 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            console.log("Debug link clicked");
            window.location.href = "/practice/debug";
          }}
        >
          Debug
        </Link>
      </div>
    </div>
  );
}
