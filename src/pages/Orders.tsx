import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
  CreditCard,
  Send,
  Sparkles,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { ShopHeader } from "@/components/layout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileOrderCard, DesktopOrderTable } from "@/components/orders";
import { updateOrderTransactionId, type Order, type Delivery } from "@/lib/shopApi";

const statusStyles: Record<
  string,
  { className: string; icon: React.ReactNode; label: string }
> = {
  pending: {
    className:
      "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Pending Verification",
  },
  payment_submitted: {
    className:
      "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    icon: <CreditCard className="h-3.5 w-3.5" />,
    label: "Payment Under Review",
  },
  payment_verified: {
    className:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Payment Verified",
  },
  processing: {
    className:
      "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Processing Order",
  },
  sourcing: {
    className:
      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Sourcing Digital Key",
  },
  on_hold: {
    className:
      "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "On Hold (Action Needed)",
  },
  fulfilled: {
    className:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Delivered",
  },
  refunded: {
    className:
      "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    label: "Refunded",
  },
  cancelled: {
    className:
      "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Cancelled",
  },
  failed: {
    className:
      "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Failed",
  },
};

interface OrderProduct {
  id: string;
  title: string;
  platform: string | null;
  category: string;
}

type OrderWithDetails = Order & {
  products?: OrderProduct | null;
  deliveries?: Delivery[];
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState<"all" | "fulfilled" | "active">(
    "all",
  );

  const sessionId = searchParams.get("session_id");
  const orderIdsParam = searchParams.get("order_ids");

  useEffect(() => {
    if (sessionId) {
      toast({
        title: "Payment Confirmed! 🎉",
        description: "Your card payment was processed securely by Stripe. We are preparing your order.",
        className: "bg-success text-success-foreground",
      });

      if (orderIdsParam) {
        const ids = orderIdsParam.split(",").filter(Boolean);
        updateOrderTransactionId(ids, `STRIPE_${sessionId.slice(-12)}`)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["user-orders"] });
          })
          .catch((err) => {
            console.warn("Could not auto-link transaction id to orders:", err);
          });
      }

      // Clean query parameters from URL without a page reload
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("session_id");
      newParams.delete("order_ids");
      setSearchParams(newParams, { replace: true });
    }
  }, [sessionId, orderIdsParam, toast, queryClient, searchParams, setSearchParams]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(id, title, platform, category), deliveries(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as OrderWithDetails[];
    },
    enabled: !!user,
    refetchInterval: (query) => {
      const list = query.state.data as OrderWithDetails[] | undefined;
      const hasActive = list?.some(
        (o) =>
          o.status !== "fulfilled" &&
          o.status !== "cancelled" &&
          o.status !== "refunded" &&
          o.status !== "failed",
      );
      return hasActive ? 8000 : false;
    },
  });

  const filteredOrders = (orders || []).filter((order) => {
    if (filterTab === "fulfilled") return order.status === "fulfilled";
    if (filterTab === "active")
      return order.status !== "fulfilled" && order.status !== "cancelled";
    return true;
  });

  return (
    <div className="min-h-screen selection:bg-primary/20 pb-16">
      <ShopHeader />

      <div className="container py-8 max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/");
              }}
              className="mb-2 font-display text-xs tracking-wider text-muted-foreground hover:text-white p-0 h-auto hover:bg-transparent"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-2" />
              Back to Store
            </Button>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider text-foreground">
              Customer <span className="text-primary">Console</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time delivery tracker, license key locker, and 24/7 Telegram
              support concierge
            </p>
          </div>

          {/* Quick Telegram Launcher in Header */}
          <div className="flex items-center gap-3">
            <a
              href="https://t.me/retrochanbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-display text-xs tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5 rotate-45" />
              <span>Launch Support Bot</span>
              <Sparkles className="w-3 h-3 text-cyan-200 animate-pulse" />
            </a>
          </div>
        </div>

        {/* Support Banner & Feature Cards */}
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
                Instant self-service on Telegram or human agent escalation
              </p>
            </div>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-xs font-bold text-foreground tracking-wide">
                Verified Fulfillment
              </p>
              <p className="text-[11px] text-muted-foreground">
                Genuine global & regional licenses directly from authorized
                distros
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

        {/* Logged-In User Order History */}
        {user ? (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={filterTab === "all" ? "default" : "ghost"}
                  onClick={() => setFilterTab("all")}
                  className={
                    filterTab === "all"
                      ? "gradient-primary text-xs"
                      : "text-xs text-muted-foreground hover:text-white"
                  }
                >
                  All ({orders?.length || 0})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "fulfilled" ? "default" : "ghost"}
                  onClick={() => setFilterTab("fulfilled")}
                  className={
                    filterTab === "fulfilled"
                      ? "gradient-primary text-xs"
                      : "text-xs text-muted-foreground hover:text-white"
                  }
                >
                  Delivered (
                  {orders?.filter((o) => o.status === "fulfilled").length || 0})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "active" ? "default" : "ghost"}
                  onClick={() => setFilterTab("active")}
                  className={
                    filterTab === "active"
                      ? "gradient-primary text-xs"
                      : "text-xs text-muted-foreground hover:text-white"
                  }
                >
                  In Progress (
                  {orders?.filter(
                    (o) => o.status !== "fulfilled" && o.status !== "cancelled",
                  ).length || 0}
                  )
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-card/40 rounded-xl animate-pulse border border-white/5"
                  />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="bg-card/40 backdrop-blur-xl border-white/5">
                <CardContent className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-lg text-foreground">
                      No orders found
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Explore our catalog for instant digital activation codes
                      and subscriptions.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/")}
                    className="gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20"
                  >
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/60 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
                {/* Mobile card layout */}
                <div className="sm:hidden divide-y divide-white/5">
                  {filteredOrders.map((order) => {
                    const status =
                      statusStyles[order.status || "pending"] ||
                      statusStyles.pending;
                    const orderDate = new Date(
                      order.created_at || "",
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                    return (
                      <MobileOrderCard
                        key={order.id}
                        order={order}
                        statusStyle={status}
                        orderDate={orderDate}
                      />
                    );
                  })}
                </div>

                {/* Desktop table layout */}
                <DesktopOrderTable
                  orders={filteredOrders}
                  statusStyles={statusStyles}
                />
              </Card>
            )}
          </div>
        ) : (
          /* Non-logged in banner */
          <Card className="bg-card/30 backdrop-blur border-white/5 p-8 text-center space-y-4">
            <p className="font-display text-lg text-foreground tracking-wide">
              Sign in to automatically sync and access all your past orders
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Link your Google Account to manage purchases, get automatic
              delivery updates, and open customer support tickets with one tap.
            </p>
            <Button
              onClick={() => navigate("/auth", { state: { from: "/orders" } })}
              className="gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20"
            >
              Sign In with Google
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Orders;
