import { HomeHero } from "@/components/home/HomeHero";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CTASection } from "@/components/home/CTASection";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { HomeDashboardClient } from "@/components/home/HomeDashboardClient";
import { getServerSession } from "@/lib/server-session";
import { loadDashboardData } from "@/lib/server-dashboard";

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
    const displayName = getDisplayName(user.email, user.name);

    if (dashboardData) {
      return <HomeDashboard displayName={displayName} data={dashboardData} />;
    }

    return <HomeDashboardClient />;
  }

  return (
    <div className="flex flex-col items-center">
      <HomeHero />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
