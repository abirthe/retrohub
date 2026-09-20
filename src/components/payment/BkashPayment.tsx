import { Copy, Send, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const BkashPayment = () => {
    const { toast } = useToast();

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard`,
        });
    };

    return (
        <div className="p-6 rounded-lg border border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Send className="w-24 h-24" />
            </div>

            <div className="space-y-4 relative z-10">
                <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Number (Send Money)</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <code className="text-2xl font-mono font-bold text-primary tracking-wider">01580382868</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => handleCopy('01580382868', 'Bkash Number')}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <Separator className="bg-primary/20" />

                <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Instructions</Label>
                    <ul className="text-sm space-y-2 text-foreground/90 list-disc list-inside marker:text-primary">
                        <li>Use the <strong>Send Money</strong> option.</li>
                        <li>Please add <span className="text-accent font-bold">1% charge</span> to the total amount.</li>
                        <li>Use your Order ID as reference.</li>
                    </ul>
                </div>

                <div className="bg-background/40 p-3 rounded border border-white/5 text-xs text-muted-foreground flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>After sending, confirm the last 4 digits or take a screenshot for verification.</span>
                </div>
            </div>
        </div>
    );
};

export default BkashPayment;
