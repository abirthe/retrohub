import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Receipt,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import BkashPayment from "./BkashPayment";

interface BkashFormProps {
  onSubmit: (trxId: string) => Promise<void>;
  isSubmitting: boolean;
  isExpired: boolean;
}

export function BkashForm({
  onSubmit,
  isSubmitting,
  isExpired,
}: BkashFormProps) {
  const [transactionId, setTransactionId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(transactionId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-pink-500/20 bg-card/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500/20" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-lg sm:text-xl flex items-center gap-2 text-pink-400">
              <Smartphone className="w-5 h-5" />
              Official bKash Send Money
            </CardTitle>
            <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-mono text-pink-400">
              Manual Verification
            </span>
          </div>
          <CardDescription className="text-slate-300 text-xs sm:text-sm">
            Send the exact total amount to our verified personal bKash account, then submit your transaction ID below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BkashPayment />
        </CardContent>
      </Card>

      {/* Transaction ID Submission Form */}
      <Card className="border-white/10 bg-card/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base sm:text-lg flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Confirm Your Transaction
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs">
            Enter the 10-character transaction ID received via SMS after sending money.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="trx-id"
                className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Transaction ID (TrxID)
              </Label>
              <div className="relative">
                <Input
                  id="trx-id"
                  placeholder="e.g. 9H7G6F5D4S"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="font-mono uppercase placeholder:normal-case border-pink-500/30 focus-visible:ring-pink-500/50 text-lg py-5 bg-white/[0.04]"
                />
                {transactionId.length >= 6 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-in zoom-in">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Usually an 8–10 character code found in your bKash SMS confirmation.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-display tracking-wide relative overflow-hidden group bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              disabled={isSubmitting || isExpired}
            >
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  "Verifying Submission..."
                ) : (
                  <>
                    Submit bKash Transaction{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default BkashForm;
