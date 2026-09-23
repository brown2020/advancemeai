import type { Metadata } from "next";
import { MarketingHome } from "@/components/home/MarketingHome";
import { HomeAuthSwitch } from "@/components/home/HomeAuthSwitch";
import { HomeDashboardView } from "@/components/home/HomeDashboardView";
import { HomeDashboardClient } from "@/components/home/HomeDashboardClient";
import { getServerSession } from "@/lib/server-session";
import { loadDashboardData } from "@/lib/server-dashboard";

export const metadata: Metadata = {
  title: { absolute: "Advance.me · Flashcards and SAT prep" },
  description:
    "Make flashcards, study five ways, and practice for the SAT with adaptive, AI-generated questions.",
};

function getDisplayName(
  email: string | undefined,
  name: string | undefined
): string {
  if (name?.trim()) return name.trim();
  if (email) return email.split("@")[0] ?? "Student";
  return "Student";
}

export default async function Home() {
  const { user } = await getServerSession();

  if (user) {
    const dashboardData = await loadDashboardData(user.uid);
    if (dashboardData) {
      return (
        <HomeDashboardView
          displayName={getDisplayName(user.email, user.name)}
          data={dashboardData}
        />
      );
    }
    return <HomeDashboardClient />;
  }

  return (
    <HomeAuthSwitch>
      <MarketingHome />
    </HomeAuthSwitch>
  );
}
