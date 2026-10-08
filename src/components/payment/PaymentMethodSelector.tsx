import { CreditCard, Smartphone, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PaymentMethod = "card" | "bkash";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        Select Payment Method
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card Option */}
        <button
          type="button"
          onClick={() => onSelectMethod("card")}
          className={cn(
            "relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group cursor-pointer backdrop-blur-md",
            selectedMethod === "card"
              ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)] ring-1 ring-primary/40"
              : "border-white/10 bg-card/25 hover:bg-card/40 hover:border-white/20",
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              selectedMethod === "card"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/20",
            )}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="font-display text-sm font-bold tracking-wide text-white">
                Card Payment
              </span>
              {selectedMethod === "card" && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Visa, Mastercard, Amex, Intl
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ⚡ Instant Automated Delivery
            </span>
          </div>
        </button>

        {/* bKash Option */}
        <button
          type="button"
          onClick={() => onSelectMethod("bkash")}
          className={cn(
            "relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group cursor-pointer backdrop-blur-md",
            selectedMethod === "bkash"
              ? "border-pink-500 bg-pink-500/10 shadow-[0_0_20px_-5px_rgba(244,114,182,0.3)] ring-1 ring-pink-500/40"
              : "border-white/10 bg-card/25 hover:bg-card/40 hover:border-pink-500/40",
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              selectedMethod === "bkash"
                ? "bg-pink-500 text-white shadow-sm"
                : "bg-secondary/60 text-muted-foreground group-hover:text-pink-400 group-hover:bg-pink-500/20",
            )}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="font-display text-sm font-bold tracking-wide text-white">
                bKash Send Money
              </span>
              {selectedMethod === "bkash" && (
                <span className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Personal / Agent Transfer
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Official Account (+1% Fee)
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
