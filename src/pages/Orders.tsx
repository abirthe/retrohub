import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw, CreditCard } from 'lucide-react';
import { ShopHeader } from '@/components/layout';
import { useNavigate } from 'react-router-dom';
import { MobileOrderCard, DesktopOrderTable } from '@/components/orders';

const statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  pending: {
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: 'Pending',
  },
  payment_submitted: {
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    icon: <CreditCard className="h-3.5 w-3.5" />,
    label: 'Payment Submitted',
  },
  payment_verified: {
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Payment Verified',
  },
  sourcing: {
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    icon: <Clock className="h-3.5 w-3.5 animate-pulse" />,
    label: 'Processing',
  },
  fulfilled: {
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Fulfilled',
  },
  cancelled: {
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Cancelled',
  },
  refunded: {
    className: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    label: 'Refunded',
  },
  failed: {
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Failed',
  }
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, products(title, platform, category), deliveries(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen">
        <ShopHeader />
        <div className="container py-32 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <p className="font-display tracking-wider mb-4 text-xl">Please sign in to view your orders</p>
          <Button onClick={() => navigate('/auth', { state: { from: '/orders' } })} className="gradient-primary">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <ShopHeader />
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
              className="mb-2 font-display text-xs tracking-wider text-muted-foreground hover:text-white p-0 h-auto hover:bg-transparent"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Back to Shop
            </Button>
            <h1 className="font-display text-3xl font-bold tracking-wider text-foreground">
              My <span className="text-primary">Orders</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage your purchases</p>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <Card className="bg-card/50 backdrop-blur border-white/5">
              <CardContent className="p-8 text-center py-20">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-display tracking-wider animate-pulse text-muted-foreground">Retrieving your history...</p>
              </CardContent>
            </Card>
          ) : !orders || orders.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur border-white/5">
              <CardContent className="p-12 text-center space-y-6 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center opacity-50">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="font-display text-xl tracking-wider text-foreground">No orders found</p>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">You haven't purchased anything yet. Check out our store for the latest game keys and top-ups.</p>
                </div>
                <Button onClick={() => navigate('/')} className="gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20">
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/60 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
              {/* Mobile card layout */}
              <div className="sm:hidden divide-y divide-white/5">
                {orders.map((order) => {
                  const status = statusStyles[order.status || 'pending'] || statusStyles.pending;
                  const orderDate = new Date(order.created_at || '').toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
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
              <DesktopOrderTable orders={orders} statusStyles={statusStyles} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
