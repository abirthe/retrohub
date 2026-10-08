import { Headphones, ShieldCheck, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ConsoleFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Headphones className="w-5 h-5" />
        </div>
        <div>
          <p className="font-display text-xs font-bold text-foreground tracking-wide">
            24/7 Live Triage
          </p>
          <p className="text-[11px] text-muted-foreground">
            Direct priority ticket routing with our automated Telegram concierge
          </p>
        </div>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="font-display text-xs font-bold text-foreground tracking-wide">
            Verified Fulfillment
          </p>
          <p className="text-[11px] text-muted-foreground">
            Genuine global & regional licenses directly from authorized distros
          </p>
        </div>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <p className="font-display text-xs font-bold text-foreground tracking-wide">
            Instant Key Locker
          </p>
          <p className="text-[11px] text-muted-foreground">
            Permanent access to your redeemed credentials & activation keys
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ConsoleFeatureCards;
