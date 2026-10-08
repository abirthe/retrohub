import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PlatformSelectorProps {
  platforms: readonly string[];
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  platforms,
  selectedPlatform,
  onSelectPlatform,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] text-muted-foreground">
        Quick Select Platform:
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {platforms.map((plat) => (
          <button
            key={plat}
            type="button"
            onClick={() => onSelectPlatform(plat)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md border transition-all",
              selectedPlatform.toLowerCase().includes(plat.toLowerCase())
                ? "bg-primary/20 border-primary text-white"
                : "bg-secondary/40 border-white/5 text-muted-foreground hover:border-white/20 hover:text-white",
            )}
          >
            {plat}
          </button>
        ))}
      </div>
    </div>
  );
};
