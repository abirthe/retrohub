import { CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface CheckoutSummaryProps {
  totalPrice: number;
  loading: boolean;
  onCheckout: () => void;
}

export const CheckoutSummary = ({ totalPrice, loading, onCheckout }: CheckoutSummaryProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur-xl border-white/10 border shadow-2xl sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg tracking-wider">Order Summary</CardTitle>
        <CardDescription>Review your order before paying</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display">৳{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Handling</span>
            <span className="font-display text-success">Free</span>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex justify-between items-end">
            <span className="font-display font-medium">Total</span>
            <span className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              ৳{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={onCheckout}
          className="w-full h-12 gradient-primary font-display text-sm tracking-wider gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 relative overflow-hidden group"
          size="lg"
          disabled={loading}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Proceed to Payment
            </>
          )}
        </Button>

        <div className="rounded-lg bg-secondary/30 p-3 flex gap-3 items-start border border-white/5">
          <ShieldCheck className="w-5 h-5 text-success shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">Secure Checkout</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Your transaction is secured with end-to-end encryption. We typically process orders within 5 minutes.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
