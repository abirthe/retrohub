import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCustomOrders, updateCustomOrderStatus, CustomOrderRow } from '@/lib/shopApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  CheckCircle2,
  Mail,
  XCircle,
  MessageSquare,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'pending' | 'contacted' | 'resolved' | 'cancelled';

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Clock,
  },
  contacted: {
    label: 'Contacted',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    icon: MessageSquare,
  },
  resolved: {
    label: 'Resolved',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    icon: XCircle,
  },
};

const CustomOrdersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customOrders, isLoading, error } = useQuery<CustomOrderRow[], Error>({
    queryKey: ['admin-custom-orders'],
    queryFn: fetchCustomOrders,
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await updateCustomOrderStatus(id, newStatus);
      toast({ title: 'Status Updated', description: 'Custom order status updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin-custom-orders'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({ title: 'Update Failed', description: message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground animate-pulse text-sm">Loading custom orders...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/20 text-destructive border border-destructive/50 rounded-xl text-sm">
        Error loading custom orders: {error.message}
      </div>
    );
  }

  const allOrders = customOrders ?? [];

  // Filter orders by status and search query
  const filteredOrders = allOrders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesStatus;
    const matchesSearch =
      order.product_name.toLowerCase().includes(query) ||
      order.name.toLowerCase().includes(query) ||
      order.email.toLowerCase().includes(query) ||
      order.platform.toLowerCase().includes(query) ||
      (order.details && order.details.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const counts: Record<FilterStatus, number> = {
    all: allOrders.length,
    pending: allOrders.filter((o) => o.status === 'pending').length,
    contacted: allOrders.filter((o) => o.status === 'contacted').length,
    resolved: allOrders.filter((o) => o.status === 'resolved').length,
    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col gap-3 bg-card/60 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4">
        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by customer, product, email, platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-background/50 border-white/10 focus:border-primary/50 rounded-lg"
          />
        </div>

        {/* Status filter chips - scrollable on phone */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1 shrink-0">
            <Filter className="h-3 w-3" />
            <span className="hidden xs:inline">Filter:</span>
          </div>
          {(['all', 'pending', 'contacted', 'resolved', 'cancelled'] as const).map((status) => {
            const count = counts[status];
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-white/5 text-muted-foreground border-white/5 hover:border-white/20 hover:text-white'
                )}
              >
                <span className="capitalize">{status}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                    isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-card/40 border border-white/5 rounded-2xl p-6">
          <p className="text-muted-foreground text-sm">
            {allOrders.length === 0 ? 'No custom orders found.' : 'No custom orders match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((order: CustomOrderRow) => {
            const statusConfig = STATUS_CONFIG[order.status] ?? {
              label: order.status,
              badge: 'bg-primary/20 text-primary border-primary/30',
              icon: Clock,
            };
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={order.id}
                className="bg-card border border-white/10 rounded-xl p-3.5 sm:p-5 shadow-lg relative overflow-hidden transition-all hover:border-white/20"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left content */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Status & Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border tracking-wide uppercase',
                          statusConfig.badge
                        )}
                      >
                        <StatusIcon className="h-3 w-3 shrink-0" />
                        {statusConfig.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Product Name & Platform */}
                    <div className="pt-0.5">
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight break-words">
                        {order.product_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-primary/80 font-medium mt-0.5">
                        Platform: <span className="text-white">{order.platform}</span>
                      </p>
                    </div>

                    {/* Customer Details Box */}
                    <div className="mt-2.5 p-3 sm:p-3.5 bg-white/[0.03] rounded-lg border border-white/5 text-xs sm:text-sm space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <div className="min-w-0">
                          <span className="text-muted-foreground text-xs">Customer: </span>
                          <span className="text-white font-medium break-words">{order.name}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground text-xs">Email: </span>
                          <a
                            href={`mailto:${order.email}?subject=${encodeURIComponent(`RetroHub: Order for ${order.product_name}`)}`}
                            className="text-primary hover:underline font-mono text-xs break-all inline-flex items-center gap-1"
                          >
                            {order.email}
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                          </a>
                        </div>
                      </div>

                      {order.user_id && (
                        <div className="text-[11px] text-muted-foreground">
                          <span>User ID: </span>
                          <span className="font-mono break-all text-muted-foreground/80 select-all">
                            {order.user_id}
                          </span>
                        </div>
                      )}

                      {order.details && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider mb-1">
                            Additional Details:
                          </p>
                          <p className="whitespace-pre-wrap break-words text-xs text-white/90 bg-black/20 p-2 rounded border border-white/5">
                            {order.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Action / Status update */}
                  <div className="flex flex-col gap-2 w-full md:w-52 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                    <label
                      htmlFor={`status-select-${order.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Update Status
                    </label>
                    <Select
                      disabled={updating === order.id}
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger
                        id={`status-select-${order.id}`}
                        className="w-full h-9 text-xs sm:text-sm bg-background/50 border-white/10 focus:border-primary/50"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Quick direct contact button */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-white/10 hover:border-primary/30 hover:bg-primary/10 gap-1.5"
                    >
                      <a
                        href={`mailto:${order.email}?subject=${encodeURIComponent(`Regarding your Custom Order: ${order.product_name}`)}`}
                      >
                        <Mail className="h-3 w-3 text-primary shrink-0" />
                        <span>Email Customer</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomOrdersTab;
