"use client";

import { useSearchParams } from "next/navigation";
import { env } from "@/config/env";

export function useTestMode(): boolean {
  const searchParams = useSearchParams();
  return env.allowTestMode && searchParams.get("test") === "true";
}
