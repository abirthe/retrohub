import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchProducts,
  fetchOrders,
  Product,
  fulfillOrder,
  holdOrder,
  cancelOrder,
  refundOrder,
  validateOrder,
  startSourcing,
} from '@/lib/shopApi';
import { sendOrderCompletionEmail } from '@/lib/emailService';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { ShopHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Package,
  ShieldAlert,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

// Subcomponents
import {
  OrdersTab,
  InventoryTab,
  CustomOrdersTab,
  AdminStatsGrid,
  OrderActionDialog,
  FeaturedTab,
  type ActionDialogState,
} from '@/components/admin';

type AdminOrder = NonNullable<Awaited<ReturnType<typeof fetchOrders>>>[number];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({ open: false, action: '', order: null });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
    enabled: isAdmin === true,
  });

  // Log query errors privately — never expose raw Supabase error objects to the UI
  useEffect(() => {
    if (ordersError) console.error('[Admin] Failed to load orders:', ordersError);
  }, [ordersError]);

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
    enabled: isAdmin === true,
  });

  const handleAction = async (data?: unknown) => {
    if (!actionDialog.order) return;
    setLoading(true);
    try {
      let result;
      switch (actionDialog.action) {
        case 'source':
          result = await startSourcing(actionDialog.order.id);
          if (result.success) {
            toast({ title: 'Sourcing Started', description: 'Order moved to sourcing.' });
          } else {
            toast({ title: 'Action Failed', description: result.error, variant: 'destructive' });
          }
          break;
        case 'fulfill': {
          const fulfillData = data as {
            deliveryCode?: string;
            costPaid?: number;
            sourcedFrom?: string;
            notes?: string;
          } | undefined;
          result = await fulfillOrder(
            actionDialog.order.id, 
            fulfillData?.deliveryCode || '', 
            fulfillData?.costPaid, 
            fulfillData?.sourcedFrom, 
            fulfillData?.notes
          );
          if (result.success) {
            await sendOrderCompletionEmail(actionDialog.order.id);
            toast({ title: 'Order Fulfilled', description: 'Product delivered successfully.' });
          } else {
            toast({ title: 'Fulfillment Failed', description: result.error, variant: 'destructive' });
          }
          break;
        }
        case 'validate':
          result = await validateOrder(actionDialog.order.id);
          if (result.success) {
            toast({ title: 'Order Validated', description: 'Order marked as validated' });
          } else {
            toast({ title: 'Validation Failed', description: result.error, variant: 'destructive' });
          }
          break;
        case 'hold':
          result = await holdOrder(actionDialog.order.id, reason);
          if (result.success) {
            toast({ title: 'Order Held', description: 'Order put on hold' });
          } else {
            toast({ title: 'Hold Failed', description: result.error, variant: 'destructive' });
          }
          break;
        case 'cancel':
          result = await cancelOrder(actionDialog.order.id, reason);
          if (result.success) {
            toast({ title: 'Order Cancelled', description: 'Order cancelled successfully' });
          } else {
            toast({ title: 'Cancellation Failed', description: result.error, variant: 'destructive' });
          }
          break;
        case 'refund':
          result = await refundOrder(actionDialog.order.id, reason);
          if (result.success) {
            toast({ title: 'Order Refunded', description: 'Order refunded successfully' });
          } else {
            toast({ title: 'Refund Failed', description: result.error, variant: 'destructive' });
          }
          break;
      }
      setActionDialog({ open: false, action: '', order: null });
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (action: string, order: AdminOrder) => {
    setActionDialog({ open: true, action, order });
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen">
        <ShopHeader />
        <div className="container py-32 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <p className="font-display tracking-wider text-muted-foreground animate-pulse text-lg">Authenticating Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <ShopHeader />

      <main className="container py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-accent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Store performance overview and management console.
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
            <ExternalLink className="h-4 w-4" /> Live Store
          </Button>
        </div>

        {/* Stats Grid */}
        <AdminStatsGrid />

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 sm:w-auto sm:inline-flex h-auto p-1 bg-secondary/30 rounded-xl border border-white/5 backdrop-blur-md gap-1">
            <TabsTrigger value="orders" className="rounded-lg gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all flex items-center justify-center">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span><span className="hidden sm:inline">Live </span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-accent/20 data-[state=active]:text-accent transition-all flex items-center justify-center">
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="custom_orders" className="rounded-lg gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all flex items-center justify-center">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Custom<span className="hidden sm:inline"> Orders</span></span>
            </TabsTrigger>
            <TabsTrigger value="featured" className="rounded-lg gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Featured</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {ordersError ? (
              <div className="p-4 bg-destructive/20 text-destructive border border-destructive/50 rounded-lg text-sm flex items-center gap-3">
                <span className="font-semibold">Failed to load orders.</span>
                <span className="text-destructive/80">Please refresh the page or contact support if the issue persists.</span>
              </div>
            ) : (
              <OrdersTab
                orders={orders}
                ordersLoading={ordersLoading}
                openActionDialog={openActionDialog}
              />
            )}
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTab products={products} />
          </TabsContent>
          
          <TabsContent value="custom_orders">
            <CustomOrdersTab />
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedTab products={products} />
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <OrderActionDialog
          dialogState={actionDialog}
          onClose={() => setActionDialog({ open: false, action: '', order: null })}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={handleAction}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
