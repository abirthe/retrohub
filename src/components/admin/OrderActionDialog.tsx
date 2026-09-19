import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, CheckCircle2, Pause, XCircle, RotateCcw, BoxSelect, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { fetchOrders } from '@/lib/shopApi';

type AdminOrder = NonNullable<Awaited<ReturnType<typeof fetchOrders>>>[number];

export interface ActionDialogState {
  open: boolean;
  action: string;
  order: AdminOrder | null;
}

interface OrderActionDialogProps {
  dialogState: ActionDialogState;
  onClose: () => void;
  reason: string;
  onReasonChange: (val: string) => void;
  onConfirm: (data?: unknown) => void;
  loading: boolean;
}

export const OrderActionDialog = ({
  dialogState,
  onClose,
  reason,
  onReasonChange,
  onConfirm,
  loading,
}: OrderActionDialogProps): React.ReactElement => {
  const { open, action, order } = dialogState;
  
  const [deliveryCode, setDeliveryCode] = React.useState('');
  const [costPaid, setCostPaid] = React.useState('');
  const [sourcedFrom, setSourcedFrom] = React.useState('');
  
  // Initialize state when opening
  React.useEffect(() => {
    if (open && order) {
      setDeliveryCode('');
      setCostPaid(order.products?.cost_price ? String(order.products.cost_price) : '');
      setSourcedFrom(order.products?.source_platform || '');
    }
  }, [open, order]);

  const handleConfirm = () => {
    if (action === 'fulfill') {
      onConfirm({
        deliveryCode,
        costPaid: costPaid ? Number(costPaid) : undefined,
        sourcedFrom,
        notes: reason
      });
    } else {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
            {action === 'fulfill' && <><Truck className="w-5 h-5 text-primary" /> Fulfill Order</>}
            {action === 'validate' && <><CheckCircle2 className="w-5 h-5 text-primary" /> Verify Payment</>}
            {action === 'source' && <><BoxSelect className="w-5 h-5 text-accent" /> Start Sourcing</>}
            {action === 'hold' && <><Pause className="w-5 h-5 text-warning" /> Hold Order</>}
            {action === 'cancel' && <><XCircle className="w-5 h-5 text-destructive" /> Cancel Order</>}
            {action === 'refund' && <><RotateCcw className="w-5 h-5 text-destructive" /> Refund Order</>}
          </DialogTitle>
          <DialogDescription>
            Confirm your action below.
          </DialogDescription>
        </DialogHeader>
        
        {order && (
          <div className="space-y-4 py-4">
            <div className="bg-black/20 p-4 rounded-lg space-y-3 text-sm border border-white/5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wider shrink-0">Order ID</span>
                <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded truncate max-w-[180px]">{order.id}</span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground shrink-0">Product</span>
                <span className="font-semibold text-right line-clamp-2 text-sm">{order.products?.title}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground shrink-0">Revenue</span>
                <span className="font-bold text-white">৳{Number(order.total).toFixed(2)}</span>
              </div>
              {(order.customer_input as Record<string, string> | null)?.transaction_id && (
                <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="text-muted-foreground">Trx ID</span>
                  <code className="bg-primary/20 text-primary border-primary/30 border px-2 py-0.5 rounded text-xs font-mono">
                    {(order.customer_input as Record<string, string>).transaction_id}
                  </code>
                </div>
              )}
            </div>

            {/* Validation warning */}
            {action === 'validate' && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-primary/80">
                  Are you sure you want to verify this payment? Ensure you have received ৳{Number(order.total).toFixed(2)}.
                </p>
              </div>
            )}

            {/* Hold / Cancel / Refund reason */}
            {(action === 'hold' || action === 'cancel' || action === 'refund') && (
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs uppercase tracking-wider text-muted-foreground">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  placeholder="Add a note for the log..."
                  className="bg-black/20 border-white/10 focus:border-white/20"
                />
              </div>
            )}

            {/* Fulfill action inputs */}
            {action === 'fulfill' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryCode" className="text-xs uppercase tracking-wider text-foreground flex items-center gap-1">
                    Delivery Code / Key <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="deliveryCode"
                    value={deliveryCode}
                    onChange={(e) => setDeliveryCode(e.target.value)}
                    placeholder="Game key, account credentials, or link..."
                    className="w-full min-h-[80px] font-mono rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPaid" className="text-xs uppercase tracking-wider text-muted-foreground">Cost Paid (৳)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="costPaid"
                        type="number"
                        value={costPaid}
                        onChange={(e) => setCostPaid(e.target.value)}
                        placeholder="0.00"
                        className="bg-black/20 border-white/10 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourcedFrom" className="text-xs uppercase tracking-wider text-muted-foreground">Sourced From</Label>
                    <Input
                      id="sourcedFrom"
                      value={sourcedFrom}
                      onChange={(e) => setSourcedFrom(e.target.value)}
                      placeholder="Eneba, Binance, etc."
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fulfillNotes" className="text-xs uppercase tracking-wider text-muted-foreground">Internal Notes (Optional)</Label>
                  <Input
                    id="fulfillNotes"
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    placeholder="Private note for this delivery..."
                    className="bg-black/20 border-white/10 focus:border-white/20"
                  />
                </div>

                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex gap-3 items-start">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[11px] text-primary/80">
                    This will mark the order as completed and release the delivery code to the customer. This action is final.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (action === 'fulfill' && !deliveryCode)}
            className={cn(
              "gap-2 shadow-lg",
              (action === 'cancel' || action === 'refund')
                ? 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20'
                : 'gradient-primary text-primary-foreground shadow-primary/20'
            )}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderActionDialog;
