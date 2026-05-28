import type { DashboardData } from "@/types/dashboard";
import { HomeDashboardView } from "./HomeDashboardView";

type HomeDashboardProps = {
  displayName: string;
  data: DashboardData;
};

/**
 * Server-rendered authenticated home dashboard.
 */
export function HomeDashboard({ displayName, data }: HomeDashboardProps) {
  return <HomeDashboardView displayName={displayName} data={data} />;
}
