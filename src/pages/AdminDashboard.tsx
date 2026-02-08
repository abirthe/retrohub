import { mockOrders, mockProducts } from '@/data/mockData';
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

const stats = [
  {
    label: 'Revenue Today',
    value: '$169.96',
    icon: DollarSign,
    color: 'text-primary',
  },
  {
    label: 'Orders Today',
    value: '4',
    icon: Package,
    color: 'text-accent',
  },
  {
    label: 'Profit Margin',
    value: '18.2%',
    icon: TrendingUp,
    color: 'text-success',
  },
  {
    label: 'Failed Orders',
    value: '1',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
];

const AdminDashboard = () => {
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
              {mockOrders.map((order) => (
                <TableRow key={order.id} className="border-border/50">
                  <TableCell className="font-mono text-xs text-foreground">{order.id}</TableCell>
                  <TableCell className="text-sm text-foreground">{order.productTitle}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[order.status]}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-display text-sm text-primary">${order.total.toFixed(2)}</TableCell>
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
              {mockProducts.map((p) => {
                const margin = (((p.salePrice - p.costPrice) / p.salePrice) * 100).toFixed(1);
                return (
                  <TableRow key={p.id} className="border-border/50">
                    <TableCell className="text-sm text-foreground">{p.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                        {p.deliveryType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{p.inStock}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">${p.costPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-primary">${p.salePrice.toFixed(2)}</TableCell>
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
