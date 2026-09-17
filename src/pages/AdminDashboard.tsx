import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchOrders,
  fulfillOrder,
  holdOrder,
  cancelOrder,
  refundOrder,
  validateOrder,
} from '@/lib/shopApi';
import { sendOrderCompletionEmail } from '@/lib/emailService';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import ShopHeader from '@/components/ShopHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Pause,
  RotateCcw,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Subcomponents
import OrdersTab from '@/components/admin/OrdersTab';
import InventoryTab from '@/components/admin/InventoryTab';

type AdminOrder = NonNullable<Awaited<ReturnType<typeof fetchOrders>>>[number];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; order: AdminOrder | null }>({ open: false, action: '', order: null });
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

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
    enabled: isAdmin === true,
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const handleAction = async () => {
    if (!actionDialog.order) return;
    setLoading(true);
    try {
      let result;
      switch (actionDialog.action) {
        case 'fulfill':
          result = await fulfillOrder(actionDialog.order.id);
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

  const stats = [
    {
      label: 'Revenue Today',
      value: `৳${(orders || []).reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/5',
      border: 'border-primary/20'
    },
    {
      label: 'Orders Today',
      value: (orders || []).length.toString(),
      icon: Package,
      color: 'text-accent',
      bg: 'bg-accent/5',
      border: 'border-accent/20'
    },
    {
      label: 'Avg Margin',
      value: products?.length
        ? `${((products.reduce((sum, p) => sum + ((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100, 0) / products.length)).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/5',
      border: 'border-success/20'
    },
    {
      label: 'Action Required',
      value: (orders || []).filter((o) => o.status === 'pending' || o.status === 'processing').length.toString(),
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/30'
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={cn("border backdrop-blur-xl transition-all duration-300 hover:shadow-lg bg-card/40", stat.border)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl border border-white/5", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  {stat.label === 'Action Required' && Number(stat.value) > 0 && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-3xl font-bold font-display tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
            <OrdersTab 
              orders={orders} 
              ordersLoading={ordersLoading} 
              openActionDialog={openActionDialog} 
            />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTab products={products} />
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, action: '', order: null })}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 sm:max-w-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
                {actionDialog.action === 'fulfill' && <><Truck className="w-5 h-5 text-primary" /> Fulfill Order</>}
                {actionDialog.action === 'validate' && <><CheckCircle2 className="w-5 h-5 text-primary" /> Validate Order</>}
                {actionDialog.action === 'hold' && <><Pause className="w-5 h-5 text-warning" /> Hold Order</>}
                {actionDialog.action === 'cancel' && <><XCircle className="w-5 h-5 text-destructive" /> Cancel Order</>}
                {actionDialog.action === 'refund' && <><RotateCcw className="w-5 h-5 text-destructive" /> Refund Order</>}
              </DialogTitle>
              <DialogDescription>
                Confirm your action below.
              </DialogDescription>
            </DialogHeader>
            {actionDialog.order && (
              <div className="space-y-4 py-4">
                <div className="bg-black/20 p-4 rounded-lg space-y-3 text-sm border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Order ID</span>
                    <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">{actionDialog.order.id}</span>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-semibold">{actionDialog.order.products?.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-white">৳{Number(actionDialog.order.total).toFixed(2)}</span>
                  </div>
                  {(actionDialog.order.customer_input as Record<string, string> | null)?.transaction_id && (
                    <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-muted-foreground">Trx ID</span>
                      <code className="bg-primary/20 text-primary border-primary/30 border px-2 py-0.5 rounded text-xs font-mono">
                        {(actionDialog.order.customer_input as Record<string, string>).transaction_id}
                      </code>
                    </div>
                  )}
                </div>

                {(actionDialog.action === 'hold' || actionDialog.action === 'cancel' || actionDialog.action === 'refund') && (
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-xs uppercase tracking-wider text-muted-foreground">Reason (Optional)</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Add a note..."
                      className="bg-black/20 border-white/10 focus:border-white/20"
                    />
                  </div>
                )}

                {actionDialog.action === 'fulfill' && (
                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-xs text-primary/80">
                      This will mark the order as completed and release the product key/service to the customer. Ensure payment is verified.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setActionDialog({ open: false, action: '', order: null })}
                disabled={loading}
                className="hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={loading}
                className={cn(
                  "gap-2 shadow-lg",
                  (actionDialog.action === 'cancel' || actionDialog.action === 'refund')
                    ? 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20'
                    : 'gradient-primary text-primary-foreground shadow-primary/20'
                )}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
