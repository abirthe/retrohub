
import { useEffect, useState } from 'react';
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
  checkInventoryAvailability
} from '@/lib/shopApi';
import { sendOrderCompletionEmail } from '@/lib/emailService';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import ShopHeader from '@/components/ShopHeader';
import { Badge } from '@/components/ui/badge';
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
  MoreVertical,
  Truck,
  Search,
  Users,
  CreditCard,
  Copy,
  ExternalLink,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  completed: {
    className: 'bg-success/20 text-success border-success/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Completed'
  },
  processing: {
    className: 'bg-primary/20 text-primary border-primary/30',
    icon: <Clock className="h-3 w-3 animate-pulse" />,
    label: 'Processing'
  },
  pending: {
    className: 'bg-accent/20 text-accent border-accent/30',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Pending'
  },
  failed: {
    className: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Failed'
  },
  validated: {
    className: 'bg-primary/20 text-primary border-primary/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Validated'
  },
  cancelled: {
    className: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled'
  },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; order: any }>({ open: false, action: '', order: null });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
            const emailResult = await sendOrderCompletionEmail(actionDialog.order.id);
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
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Operation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (action: string, order: any) => {
    setActionDialog({ open: true, action, order });
  };

  const filteredOrders = orders?.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.products?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_input as any)?.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="text-xs font-normal bg-secondary/30 text-muted-foreground border-white/5 px-3 py-1">
                Showing {filteredOrders?.length || 0} orders
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ordersLoading ? (
                <div className="text-center py-20 text-muted-foreground animate-pulse">Loading orders...</div>
              ) : filteredOrders?.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-card/10">
                  No orders found.
                </div>
              ) : (
                filteredOrders?.map((order: any) => (
                  <Card key={order.id} className="overflow-hidden border-white/5 bg-card/40 backdrop-blur-md hover:border-primary/20 transition-all duration-300 group">
                    <div className="p-0 flex flex-col md:flex-row">
                      <div className={cn("w-full md:w-1.5 h-1 md:h-auto",
                        order.status === 'completed' ? "bg-success" :
                          order.status === 'failed' ? "bg-destructive" :
                            order.status === 'validated' ? "bg-primary" : "bg-accent/50"
                      )} />

                      <div className="p-6 flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 border-0 gap-1.5", (statusStyles[order.status] || statusStyles.pending).className)}>
                                {(statusStyles[order.status] || statusStyles.pending).icon}
                                {(statusStyles[order.status] || statusStyles.pending).label}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded border border-white/5">
                                #{order.id.slice(0, 8)}...
                                <button onClick={() => {
                                  navigator.clipboard.writeText(order.id);
                                  toast({ title: 'Copied', description: 'Order ID copied' });
                                }} className="hover:text-primary transition-colors">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            </div>

                            <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{order.products?.title || 'Unknown Product'}</h3>

                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{new Date(order.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-2">
                            <div className="text-xl font-bold font-display text-white">
                              ৳{Number(order.total).toFixed(2)}
                            </div>
                            {(order.customer_input as any)?.transaction_id && (
                              <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                                <CreditCard className="h-3 w-3" />
                                <span className="font-mono tracking-wider">{(order.customer_input as any).transaction_id}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-3 items-center">
                          <p className="text-xs text-muted-foreground mr-auto">Actions:</p>
                          {order.status === 'pending' && (
                            <Button size="sm" onClick={() => openActionDialog('validate', order)} className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 h-8 text-xs font-display tracking-wide">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Validate
                            </Button>
                          )}
                          {(order.status === 'validated' || order.status === 'pending' || order.status === 'failed') && (
                            <Button
                              size="sm"
                              onClick={() => openActionDialog('fulfill', order)}
                              disabled={(order.products?.in_stock || 0) <= 0}
                              className="gradient-primary text-primary-foreground shadow-lg shadow-primary/20 h-8 text-xs font-display tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Truck className="h-3.5 w-3.5 mr-1.5" /> Fulfill
                            </Button>
                          )}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openActionDialog('hold', order)} className="h-8 text-xs text-muted-foreground hover:text-white">
                                <Pause className="h-3.5 w-3.5 mr-1.5" /> Hold
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => openActionDialog('cancel', order)}>
                                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel
                              </Button>
                            </>
                          )}
                          {order.status === 'completed' && (
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => openActionDialog('refund', order)}>
                              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="bg-card/40 backdrop-blur-xl border-white/10 overflow-hidden shadow-xl">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="font-display text-lg tracking-wider">Inventory Status</CardTitle>
                <CardDescription>Real-time stock levels and margin analysis</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/20 text-muted-foreground font-display text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-semibold opacity-70">Product</th>
                        <th className="p-4 font-semibold opacity-70">Type</th>
                        <th className="p-4 font-semibold opacity-70">Stock</th>
                        <th className="p-4 font-semibold opacity-70">Cost</th>
                        <th className="p-4 font-semibold opacity-70">Price</th>
                        <th className="p-4 font-semibold opacity-70 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {products?.map((p) => {
                        const margin = (((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100).toFixed(1);
                        return (
                          <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-medium text-foreground group-hover:text-primary transition-colors">{p.title}</td>
                            <td className="p-4">
                              <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground bg-secondary/30">
                                {p.delivery_type.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  p.in_stock > 5 ? "bg-success" :
                                    p.in_stock > 0 ? "bg-warning" : "bg-destructive animate-pulse"
                                )}></span>
                                <span className={cn(
                                  "font-mono font-bold text-xs",
                                  p.in_stock > 5 ? "text-success" :
                                    p.in_stock > 0 ? "text-warning" : "text-destructive"
                                )}>
                                  {p.in_stock}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground font-mono text-xs opacity-70">৳{Number(p.cost_price).toFixed(2)}</td>
                            <td className="p-4 font-bold text-white font-mono text-xs">৳{Number(p.sale_price).toFixed(2)}</td>
                            <td className="p-4 font-display font-bold text-right">
                              <span className="text-success bg-success/10 px-2 py-1 rounded text-xs border border-success/20">
                                +{margin}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
                  {(actionDialog.order.customer_input as any)?.transaction_id && (
                    <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-muted-foreground">Trx ID</span>
                      <code className="bg-primary/20 text-primary border-primary/30 border px-2 py-0.5 rounded text-xs font-mono">
                        {(actionDialog.order.customer_input as any).transaction_id}
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
