"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageHeader,
  SectionContainer,
} from "@/components/common/UIComponents";

export default function DebugPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [cookies, setCookies] = useState<string>("");

  // Access practice page with a test parameter
  const goToPracticeWithTestParam = () => {
    router.push("/practice?test=true");
  };

  // Direct access to practice
  const goToPractice = () => {
    router.push("/practice");
  };

  // Check current cookies
  const checkCookies = () => {
    setCookies(document.cookie);
  };

  useEffect(() => {
    checkCookies();
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Authentication Debug Page" />

      <SectionContainer title="Authentication Status">
        <p className="mb-2">Loading: {isLoading ? "Yes" : "No"}</p>
        <p className="mb-2">
          User: {user ? `Logged in as ${user.email}` : "Not logged in"}
        </p>
        <p className="mb-2">Cookies: {cookies || "None"}</p>
      </SectionContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SectionContainer title="Authentication Actions" className="mb-0">
          <div className="flex flex-col space-y-3">
            <Button onClick={checkCookies} variant="secondary">
              Check Cookies
            </Button>
            <Link
              href="/auth/signin"
              className="inline-flex"
            >
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </SectionContainer>

        <SectionContainer title="Navigation Actions" className="mb-0">
          <div className="flex flex-col space-y-3">
            <Button onClick={goToPractice} variant="secondary">
              Go to Practice (Normal)
            </Button>
            <Button onClick={goToPracticeWithTestParam} variant="secondary">
              Go to Practice (With Test Flag)
            </Button>
            <Link
              href="/"
              className="inline-flex"
            >
              <Button className="w-full" variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer title="Debugging Instructions">
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
      </SectionContainer>
    </PageContainer>
  );
}
