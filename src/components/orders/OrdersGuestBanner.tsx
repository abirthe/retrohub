import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrdersGuestBannerProps {
  onSignIn: () => void;
}

export function OrdersGuestBanner({ onSignIn }: OrdersGuestBannerProps) {
  return (
    <Card className="bg-card/30 backdrop-blur border-white/5 p-8 text-center space-y-4">
      <p className="font-display text-lg text-foreground tracking-wide">
        Sign in to automatically sync and access all your past orders
      </p>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        Link your Google Account to manage purchases, get automatic
        delivery updates, and open customer support tickets with one tap.
      </p>
      <Button
        onClick={onSignIn}
        className="gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20"
      >
        Sign In with Google
      </Button>
    </Card>
  );
}

export default OrdersGuestBanner;
