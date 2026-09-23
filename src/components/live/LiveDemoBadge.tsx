import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Live games run on one device only (no realtime sync yet); say so plainly. */
export function LiveDemoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className}>
      <FlaskConical aria-hidden />
      Demo
    </Badge>
  );
}
