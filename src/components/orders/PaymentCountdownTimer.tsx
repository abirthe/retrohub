import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOrderRemainingSeconds,
  formatTimeRemaining,
  getTimeProgressPercent,
} from "@/lib/orderPaymentWindow";

export interface PaymentCountdownTimerProps {
  createdAt?: string | null;
  onExpire?: () => void;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export const PaymentCountdownTimer = ({
  createdAt,
  onExpire,
  className,
  showProgress = false,
  compact = false,
}: PaymentCountdownTimerProps) => {
  const [remaining, setRemaining] = useState<number>(() =>
    getOrderRemainingSeconds(createdAt),
  );

  useEffect(() => {
    // Immediate compute
    const initial = getOrderRemainingSeconds(createdAt);
    setRemaining(initial);

    if (initial <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const secs = getOrderRemainingSeconds(createdAt);
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  const isExpired = remaining <= 0;
  const isUrgent = remaining > 0 && remaining < 300; // Under 5 minutes
  const isWarning = remaining >= 300 && remaining < 600; // 5 - 10 minutes
  const progressPercent = getTimeProgressPercent(createdAt);

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-full transition-colors",
          isExpired
            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            : isUrgent
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
              : isWarning
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
          className,
        )}
      >
        {isUrgent ? (
          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 animate-bounce" />
        ) : (
          <Clock className="w-3 h-3 text-current shrink-0" />
        )}
        <span>{isExpired ? "Expired" : formatTimeRemaining(remaining)}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl p-3 border transition-all",
        isExpired
          ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
          : isUrgent
            ? "bg-rose-500/15 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse"
            : isWarning
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-primary/10 border-primary/20 text-primary-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <Clock
              className={cn(
                "w-4 h-4",
                isExpired
                  ? "text-rose-400"
                  : isWarning
                    ? "text-amber-400"
                    : "text-primary",
              )}
            />
          )}
          <span className="text-xs font-medium tracking-wide">
            {isExpired
              ? "Payment window expired"
              : isUrgent
                ? "Hurry! Payment expires soon"
                : "Complete payment within 30 mins"}
          </span>
        </div>
        <span
          className={cn(
            "font-mono font-bold text-sm tracking-wider tabular-nums px-2 py-0.5 rounded",
            isExpired
              ? "bg-rose-500/20 text-rose-300"
              : isUrgent
                ? "bg-rose-500/30 text-white font-extrabold"
                : "bg-white/10 text-white",
          )}
        >
          {isExpired ? "00:00" : formatTimeRemaining(remaining)}
        </span>
      </div>

      {showProgress && !isExpired && (
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-1000",
              isUrgent ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
