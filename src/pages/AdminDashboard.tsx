import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
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
import ShopHeader from '@/components/layout/ShopHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Package,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

// Subcomponents
import OrdersTab from '@/components/admin/OrdersTab';
import InventoryTab from '@/components/admin/InventoryTab';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';
import OrderActionDialog, { type ActionDialogState } from '@/components/admin/OrderActionDialog';

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

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, title, sale_price, cost_price, image_url, category, platform, region, in_stock, delivery_type, created_at, is_active').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
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
        case 'fulfill':
          result = await fulfillOrder(
            actionDialog.order.id, 
            data?.deliveryCode, 
            data?.costPaid, 
            data?.sourcedFrom, 
            data?.notes
          );
          if (result.success) {
            await sendOrderCompletionEmail(actionDialog.order.id);
            toast({ title: 'Order Fulfilled', description: 'Product delivered successfully.' });
          } else {
            toast({ title: 'Fulfillment Failed', description: result.error, variant: 'destructive' });
          }
          break;
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
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background selection:bg-primary/20">
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
          <TabsList className="bg-secondary/30 p-1 rounded-xl border border-white/5 backdrop-blur-md">
            <TabsTrigger value="orders" className="rounded-lg gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">
              <Package className="h-4 w-4" /> Live Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent transition-all">
              <RefreshCw className="h-4 w-4" /> Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {ordersError ? (
              <div className="p-4 bg-destructive/20 text-destructive border border-destructive/50 rounded-lg">
                Error loading orders: {ordersError instanceof Error ? ordersError.message : String(ordersError)}
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
