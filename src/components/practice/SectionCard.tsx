import { ROUTES } from "@/constants/appConstants";
import { ActionLink, SectionContainer } from "@/components/common/UIComponents";
import type { TestSection } from "@/services/practiceTestService";

export function SectionCard({ section }: { section: TestSection }) {
  return (
    <SectionContainer>
      <h2 className="text-lg font-bold mb-2">{section.title}</h2>
      <div className="text-sm text-primary mb-3">
        <span>AI-Generated Practice Questions</span>
      </div>
      <p className="text-muted-foreground mb-4">{section.description}</p>
      <div className="mt-4">
        <ActionLink
          href={ROUTES.PRACTICE.SECTION(section.id)}
          variant="primary"
        >
          Start Practice
        </ActionLink>
      </div>
    </SectionContainer>
  );
}
