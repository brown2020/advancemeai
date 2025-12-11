import { HomeHero } from "@/components/home/HomeHero";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CTASection } from "@/components/home/CTASection";

/**
 * Home page - Server component with client islands for interactivity
 */
export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <HomeHero />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
