import { Copy } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const BankPayment = () => {
    const { toast } = useToast();

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard`,
        });
    };

    return (
        <div className="p-6 rounded-lg border border-accent/20 bg-accent/5 relative overflow-hidden group">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="group/item">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Account Number</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-lg font-mono font-bold text-accent tracking-wide">1059179090001</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy('1059179090001', 'Account Number')}>
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Account Name</Label>
                            <p className="font-semibold text-foreground/90">ABIR HOSSAIN</p>
                        </div>
                        <div>
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Bank Name</Label>
                            <p className="font-semibold text-foreground/90">BRAC Bank PLC</p>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Branch Name</Label>
                        <p className="text-sm text-foreground/80">MOGHBAZAR BRANCH</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Routing Number</Label>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-sm">060274184</p>
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleCopy('060274184', 'Routing Number')}>
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">SWIFT Code</Label>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-sm">BRAKBDDH</p>
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleCopy('BRAKBDDH', 'SWIFT Code')}>
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankPayment;
