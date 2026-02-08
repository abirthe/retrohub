import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchOrders } from '@/lib/shopApi';
import ShopHeader from '@/components/ShopHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';

const statusStyles: Record<string, string> = {
  completed: 'bg-success/20 text-success border-success/30',
  processing: 'bg-primary/20 text-primary border-primary/30',
  pending: 'bg-accent/20 text-accent border-accent/30',
  failed: 'bg-destructive/20 text-destructive border-destructive/30',
  validated: 'bg-primary/20 text-primary border-primary/30',
};

const AdminDashboard = () => {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    {
      label: 'Revenue Today',
      value: `$${(orders || []).reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: 'Orders Today',
      value: (orders || []).length.toString(),
      icon: Package,
      color: 'text-accent',
    },
    {
      label: 'Avg Margin',
      value: products?.length
        ? `${((products.reduce((sum, p) => sum + ((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100, 0) / products.length)).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      label: 'Failed Orders',
      value: (orders || []).filter((o) => o.status === 'failed').length.toString(),
      icon: AlertTriangle,
      color: 'text-destructive',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      <div className="container py-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
            ADMIN <span className="text-primary">DASHBOARD</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Control room for order fulfillment and inventory.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-card border border-border/50 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders table */}
        <div className="rounded-lg bg-card border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-display text-sm tracking-wider text-foreground">RECENT ORDERS</h2>
          </div>
          {ordersLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
          ) : (orders || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No orders yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Order</TableHead>
                  <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Product</TableHead>
                  <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Status</TableHead>
                  <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Total</TableHead>
                  <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders || []).map((order: any) => (
                  <TableRow key={order.id} className="border-border/50">
                    <TableCell className="font-mono text-xs text-foreground">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm text-foreground">{order.products?.title || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusStyles[order.status]}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-display text-sm text-primary">${Number(order.total).toFixed(2)}</TableCell>
                    <TableCell>
                      {order.status === 'failed' && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Inventory overview */}
        <div className="rounded-lg bg-card border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-display text-sm tracking-wider text-foreground">INVENTORY OVERVIEW</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Product</TableHead>
                <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Type</TableHead>
                <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Stock</TableHead>
                <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Cost</TableHead>
                <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Price</TableHead>
                <TableHead className="text-muted-foreground font-display text-xs tracking-wider">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products || []).map((p) => {
                const margin = (((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100).toFixed(1);
                return (
                  <TableRow key={p.id} className="border-border/50">
                    <TableCell className="text-sm text-foreground">{p.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                        {p.delivery_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{p.in_stock}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">${Number(p.cost_price).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-primary">${Number(p.sale_price).toFixed(2)}</TableCell>
                    <TableCell className="font-display text-sm text-success">{margin}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
