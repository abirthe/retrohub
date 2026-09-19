import { useState } from 'react';
import { Search, Copy, CheckCircle2, Truck, Pause, XCircle, RotateCcw, AlertCircle, Clock, ExternalLink, BoxSelect, CreditCard, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateOrderEmailTemplate } from '@/lib/emailTemplates';
import type { fetchOrders } from '@/lib/shopApi';

type AdminOrder = NonNullable<Awaited<ReturnType<typeof fetchOrders>>>[number];

const statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  pending: {
    className: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Pending'
  },
  payment_submitted: {
    className: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    icon: <CreditCard className="h-3 w-3" />,
    label: 'Payment Submitted'
  },
  payment_verified: {
    className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Payment Verified'
  },
  sourcing: {
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <Clock className="h-3 w-3 animate-pulse" />,
    label: 'Sourcing'
  },
  fulfilled: {
    className: 'bg-success/20 text-success border-success/30',
    icon: <Truck className="h-3 w-3" />,
    label: 'Fulfilled'
  },
  failed: {
    className: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Failed'
  },
  cancelled: {
    className: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled'
  },
  refunded: {
    className: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    icon: <RotateCcw className="h-3 w-3" />,
    label: 'Refunded'
  },
};

interface OrdersTabProps {
  orders: AdminOrder[] | undefined;
  ordersLoading: boolean;
  openActionDialog: (action: string, order: AdminOrder) => void;
}

const OrdersTab = ({ orders, ordersLoading, openActionDialog }: OrdersTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredOrders = orders?.filter(order => {
    const customerInput = order.customer_input as Record<string, string> | null;
    return (
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customerInput?.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  });

  return (
    <div className="space-y-4">
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
          filteredOrders?.map((order) => {
            const customerInput = order.customer_input as Record<string, string> | null;
            const style = statusStyles[order.status || 'pending'] || statusStyles.pending;
            
            return (
              <Card key={order.id} className="overflow-hidden border-white/5 bg-card/40 backdrop-blur-md hover:border-white/10 transition-all duration-300 group">
                <div className="p-0 flex flex-col md:flex-row">
                  <div className={cn("w-full md:w-1.5 h-1 md:h-auto",
                    order.status === 'fulfilled' ? "bg-success" :
                      (order.status === 'cancelled' || order.status === 'failed') ? "bg-destructive" :
                        order.status === 'sourcing' ? "bg-purple-500" :
                          order.status === 'payment_verified' ? "bg-emerald-500" :
                            "bg-amber-500"
                  )} />

                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 border-0 gap-1.5", style.className)}>
                            {style.icon}
                            {style.label}
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
                          <span>{new Date(order.created_at || '').toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-2">
                        <div className="text-xl font-bold font-display text-white">
                          ৳{Number(order.total).toFixed(2)}
                        </div>
                        {customerInput?.transaction_id && (
                          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                            <span className="font-mono tracking-wider">TrxID: {customerInput.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-3 items-center">
                      <p className="text-xs text-muted-foreground mr-auto">Actions:</p>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs font-display tracking-wide border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white"
                        asChild
                      >
                        <a href={generateOrderEmailTemplate(order, (order.profiles as { email?: string } | null)?.email || 'customer@example.com')}>
                          <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                        </a>
                      </Button>

                      {(order.status === 'pending' || order.status === 'payment_submitted') && (
                        <Button size="sm" onClick={() => openActionDialog('validate', order)} className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 h-8 text-xs font-display tracking-wide">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Verify Payment
                        </Button>
                      )}

                      {order.status === 'payment_verified' && (
                        <>
                          <Button size="sm" onClick={() => openActionDialog('source', order)} className="bg-accent/20 text-accent hover:bg-accent/30 border-accent/20 h-8 text-xs font-display tracking-wide">
                            <BoxSelect className="h-3.5 w-3.5 mr-1.5" /> Start Sourcing
                          </Button>
                          {order.products?.source_url && (
                            <Button size="sm" variant="outline" asChild className="border-white/10 h-8 text-xs font-display tracking-wide text-muted-foreground hover:text-white">
                              <a href={order.products.source_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1.5" /> Source Link
                              </a>
                            </Button>
                          )}
                        </>
                      )}

                      {order.status === 'sourcing' && (
                        <Button
                          size="sm"
                          onClick={() => openActionDialog('fulfill', order)}
                          className="gradient-primary text-primary-foreground shadow-lg shadow-primary/20 h-8 text-xs font-display tracking-wide"
                        >
                          <Truck className="h-3.5 w-3.5 mr-1.5" /> Fulfill
                        </Button>
                      )}

                      {order.status !== 'fulfilled' && order.status !== 'cancelled' && order.status !== 'refunded' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openActionDialog('hold', order)} className="h-8 text-xs text-muted-foreground hover:text-white">
                            <Pause className="h-3.5 w-3.5 mr-1.5" /> Hold
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => openActionDialog('cancel', order)}>
                            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel
                          </Button>
                        </>
                      )}

                      {order.status === 'fulfilled' && (
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => openActionDialog('refund', order)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
