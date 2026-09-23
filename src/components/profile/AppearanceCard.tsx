import { Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

/** Theme picker (same control as the header's account menu). */
export function AppearanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5 text-muted-foreground" aria-hidden />
          Appearance
        </CardTitle>
        <CardDescription>
          Applies instantly on this device. System follows your device setting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThemeSwitcher className="max-w-sm" />
      </CardContent>
    </Card>
  );
}
