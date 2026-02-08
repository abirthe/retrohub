import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Search, Calendar } from 'lucide-react';
import ShopHeader from '@/components/ShopHeader';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  completed: {
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Completed',
  },
  processing: {
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    icon: <Clock className="h-3.5 w-3.5 animate-pulse" />,
    label: 'Processing',
  },
  pending: {
    className: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: 'Pending',
  },
  validated: {
    className: 'bg-primary/20 text-primary border-primary/30',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Validated',
  },
  failed: {
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Failed',
  },
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
        .select('*, products(title, platform, category)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="container py-32 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <p className="font-display tracking-wider mb-4 text-xl">Please sign in to view your orders</p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <ShopHeader />
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
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

          {/* Could add a search/filter here later */}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/50">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pl-6">Order ID</TableHead>
                      <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Product</TableHead>
                      <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Status</TableHead>
                      <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Total</TableHead>
                      <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Date</TableHead>
                      <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pr-6">Delivery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => {
                      const status = statusStyles[order.status] || statusStyles.pending;
                      const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                          <TableCell className="font-mono text-xs text-muted-foreground pl-6">
                            #{order.id.slice(0, 8)}
                          </TableCell>

                          <TableCell className="text-sm font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded bg-background/50 border border-white/5 flex items-center justify-center text-[10px] text-muted-foreground">
                                {order.products?.platform?.charAt(0) || '?'}
                              </span>
                              {order.products?.title || 'Unknown Product'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-normal px-2.5 py-0.5 flex items-center gap-1.5 w-fit transition-colors", status.className)}
                            >
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-display text-sm font-bold text-white group-hover:text-primary transition-colors">
                            ৳{Number(order.total).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 opacity-50" />
                              {orderDate}
                            </div>
                          </TableCell>

                          <TableCell className="pr-6">
                            {order.final_output ? (
                              <div className="text-xs space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                                <div className="font-mono text-success break-all bg-success/5 p-2 rounded border border-success/20 select-all selection:bg-success/30">
                                  {order.final_output}
                                </div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                  Sent to email
                                </p>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic opacity-50">
                                Awaiting completion...
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;

