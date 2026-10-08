import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface PaymentExpiredCardProps {
  onReorder: () => void;
}

export function PaymentExpiredCard({ onReorder }: PaymentExpiredCardProps) {
  return (
    <Card className="border-rose-500/30 bg-card/40 backdrop-blur-xl p-8 text-center space-y-6 shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-in zoom-in-95">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
        <AlertTriangle className="w-8 h-8 animate-bounce" />
      </div>
      <div className="space-y-2 max-w-lg mx-auto">
        <h2 className="font-display text-2xl font-bold text-white tracking-wide">
          Payment Window Expired
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Orders are reserved for <strong>30 minutes</strong> to ensure inventory availability. Because payment was not completed within the time limit, this order reservation has been released.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={onReorder}
          className="gradient-primary text-sm font-display tracking-wider px-6 h-11 gap-2 shadow-lg shadow-primary/20"
        >
          <RotateCcw className="w-4 h-4" />
          Restore Items to Cart & Re-order
        </Button>
        <Link to="/orders">
          <Button
            variant="outline"
            className="text-sm font-display tracking-wider h-11 border-white/10"
          >
            View All Orders
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default PaymentExpiredCard;
