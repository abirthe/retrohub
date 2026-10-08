import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import {
  isOrderUnpaid,
  isOrderExpired,
  getOrderRemainingSeconds,
} from "@/lib/orderPaymentWindow";
import { cancelUnpaidOrder, expireStaleOrders, type Order, type Product } from "@/lib/shopApi";

export interface OrderWithProductInfo extends Order {
  products?: (Product & { id: string; title: string; sale_price: number | string }) | null;
}

export function useUnpaidOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["unpaid-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(*)")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as OrderWithProductInfo[];
    },
    enabled: !!user,
    refetchInterval: (query) => {
      const data = query.state.data as OrderWithProductInfo[] | undefined;
      const hasPending = data && data.length > 0;
      return hasPending ? 5000 : false;
    },
  });

  const unpaidOrders = orders.filter(
    (o) => isOrderUnpaid(o) && !isOrderExpired(o.created_at),
  );

  const expiredPendingOrders = orders.filter(
    (o) => isOrderUnpaid(o) && isOrderExpired(o.created_at),
  );

  // Background auto-expire stale orders if any found
  useEffect(() => {
    if (expiredPendingOrders.length > 0 && user) {
      expireStaleOrders().then(() => {
        queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      });
    }
  }, [expiredPendingOrders.length, user, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      return cancelUnpaidOrder(orderId, reason || "Cancelled by customer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({
        title: "Order Cancelled",
        description: "Your unpaid order has been cancelled and removed.",
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      toast({
        title: "Cancellation Failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const reorderToCart = (order: OrderWithProductInfo) => {
    if (order.products) {
      addToCart(order.products as unknown as Product, 1);
      toast({
        title: "Added to Cart",
        description: `"${order.products.title}" has been restored to your cart.`,
      });
    }
  };

  return {
    unpaidOrders,
    hasUnpaidOrders: unpaidOrders.length > 0,
    activeUnpaidCount: unpaidOrders.length,
    latestUnpaidOrder: unpaidOrders[0] || null,
    expiredPendingOrders,
    isLoading,
    refetch,
    cancelOrder: (orderId: string, reason?: string) =>
      cancelMutation.mutateAsync({ orderId, reason }),
    isCancelling: cancelMutation.isPending,
    reorderToCart,
  };
}
