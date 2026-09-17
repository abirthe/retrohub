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
import { Truck, CheckCircle2, Pause, XCircle, RotateCcw, Bot, Loader2 } from 'lucide-react';
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
  onConfirm: () => void;
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
  
  const [fulfillmentCode, setFulfillmentCode] = React.useState('');
  const [isDelayed, setIsDelayed] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  // Clean up state when closing
  React.useEffect(() => {
    if (!open) {
      setFulfillmentCode('');
      setIsDelayed(false);
      setIsGenerating(false);
    }
  }, [open]);

  const handleGenerateEmail = async () => {
    if (!order || !fulfillmentCode) return;
    setIsGenerating(true);
    try {
      const { generateFulfillmentEmail } = await import('@/lib/grokApi');
      // order user profiles email or name would be nice, but we might just use 'Customer' if not available in order
      const customerName = 'Customer'; 
      const emailBody = await generateFulfillmentEmail(
        order.id, 
        order.products?.title || 'Your Product', 
        customerName, 
        fulfillmentCode, 
        isDelayed
      );
      onReasonChange(emailBody);
    } catch (e) {
      console.error(e);
      // Fallback
      onReasonChange(`Here is your code: ${fulfillmentCode}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
            {action === 'fulfill' && <><Truck className="w-5 h-5 text-primary" /> Fulfill Order</>}
            {action === 'validate' && <><CheckCircle2 className="w-5 h-5 text-primary" /> Validate Order</>}
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Order ID</span>
                <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">{order.id}</span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Product</span>
                <span className="font-semibold">{order.products?.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount</span>
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

            {(action === 'hold' || action === 'cancel' || action === 'refund') && (
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs uppercase tracking-wider text-muted-foreground">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  placeholder="Add a note..."
                  className="bg-black/20 border-white/10 focus:border-white/20"
                />
              </div>
            )}

            {action === 'fulfill' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fulfillmentCode" className="text-xs uppercase tracking-wider text-muted-foreground">Order Code / Game Key</Label>
                  <Input
                    id="fulfillmentCode"
                    value={fulfillmentCode}
                    onChange={(e) => setFulfillmentCode(e.target.value)}
                    placeholder="XXXX-YYYY-ZZZZ"
                    className="bg-black/20 border-white/10 font-mono"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isDelayed" 
                    checked={isDelayed} 
                    onChange={(e) => setIsDelayed(e.target.checked)} 
                    className="accent-primary"
                  />
                  <Label htmlFor="isDelayed" className="text-sm cursor-pointer">Order was delayed (Tell customer not to panic)</Label>
                </div>

                <Button 
                  onClick={handleGenerateEmail}
                  disabled={!fulfillmentCode || isGenerating}
                  variant="outline"
                  className="w-full border-primary/20 text-primary hover:bg-primary/10 gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  Generate AI Greetings Email
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="emailBody" className="text-xs uppercase tracking-wider text-muted-foreground">Generated Email (Sent to Customer)</Label>
                  <textarea
                    id="emailBody"
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    placeholder="Email body will appear here..."
                    className="w-full min-h-[120px] rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>

                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs text-primary/80">
                    This will mark the order as completed and release the email/key to the customer. Ensure payment is verified.
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
            onClick={onConfirm}
            disabled={loading}
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
