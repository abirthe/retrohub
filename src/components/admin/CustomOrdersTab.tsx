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

const CustomOrdersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: customOrders, isLoading, error } = useQuery({
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
    return <div className="text-center py-8 text-muted-foreground animate-pulse">Loading custom orders...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/20 text-destructive border border-destructive/50 rounded-lg">
        Error loading custom orders: {JSON.stringify(error, null, 2)}
      </div>
    );
  }

  if (!customOrders || customOrders.length === 0) {
    return (
      <div className="text-center py-16 bg-card/40 border border-white/5 rounded-2xl">
        <p className="text-muted-foreground">No custom orders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {customOrders.map((order: CustomOrderRow) => (
        <div key={order.id} className="bg-card border border-white/10 rounded-xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                  {order.status}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{order.product_name}</h3>
              <p className="text-sm text-muted-foreground font-medium">Platform: {order.platform}</p>
              
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10 text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {order.name}</p>
                <p><span className="text-muted-foreground">Email:</span> {order.email}</p>
                {order.user_id && <p><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{order.user_id}</span></p>}
                {order.details && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-muted-foreground text-xs mb-1">Additional Details:</p>
                    <p className="whitespace-pre-wrap">{order.details}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Update Status</h4>
              <Select
                disabled={updating === order.id}
                value={order.status}
                onValueChange={(val) => handleStatusChange(order.id, val)}
              >
                <SelectTrigger className="w-full bg-background/50 border-white/10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomOrdersTab;
