import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { fetchOrders, fetchProducts } from '@/lib/shopApi';

type AdminOrder = NonNullable<Awaited<ReturnType<typeof fetchOrders>>>[number];
type AdminProduct = NonNullable<Awaited<ReturnType<typeof fetchProducts>>>[number];

interface AdminStatsGridProps {
  orders: AdminOrder[] | undefined;
  products: AdminProduct[] | undefined;
}

export const AdminStatsGrid = ({ orders, products }: AdminStatsGridProps): React.ReactElement => {
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

  return (
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
  );
};

export default AdminStatsGrid;
