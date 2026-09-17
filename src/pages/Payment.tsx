import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import ShopHeader from '@/components/ShopHeader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { updateOrderTransactionId } from '@/lib/shopApi';

import BkashPayment from '@/components/payment/BkashPayment';
import BankPayment from '@/components/payment/BankPayment';

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('bkash');

    const { orderIds, totalPrice } = location.state || { orderIds: [], totalPrice: 0 };

    useEffect(() => {
        if (!orderIds || orderIds.length === 0) {
            // If accessed directly without orders, maybe redirect or just show generic
            // For now, we allow it but show a warning
        }
    }, [orderIds]);

    const calculateTotal = () => {
        if (!totalPrice) return 0;
        if (selectedMethod === 'bkash') {
            return totalPrice * 1.01; // 1% charge
        }
        return totalPrice;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionId.trim()) {
            toast({
                title: "Error",
                description: "Please enter a valid Transaction ID",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (orderIds.length > 0) {
                await updateOrderTransactionId(orderIds, transactionId);
            } else {
                // Fallback simulation if no order IDs (e.g. testing)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            toast({
                title: "Payment Submitted",
                description: "Your transaction ID has been received. We will verify it shortly.",
                className: "bg-success text-success-foreground",
            });

            // Navigate to orders page after success
            setTimeout(() => {
                navigate('/orders');
            }, 1500);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update payment status.";
            toast({
                title: "Submission Failed",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            <ShopHeader />

            <main className="container py-12 md:py-20">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Complete Your Payment
                        </h1>
                        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                            Choose your preferred payment method and submit the transaction details below.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                        {/* Left Column: Payment Methods */}
                        <div className="space-y-6">
                            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="font-display text-xl flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                        Payment Details
                                    </CardTitle>
                                    <CardDescription>
                                        Send money to one of the accounts below
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="bkash" className="w-full" onValueChange={setSelectedMethod}>
                                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50 p-1">
                                            <TabsTrigger value="bkash" className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                                                BKASH
                                            </TabsTrigger>
                                            <TabsTrigger value="bank" className="font-display data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-300">
                                                BANK
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="bkash" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                            <BkashPayment />
                                        </TabsContent>

                                        <TabsContent value="bank" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                            <BankPayment />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Transaction Input */}
                        <div className="space-y-6">
                            <Card className="border-border/50 bg-card shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                                <CardHeader>
                                    <CardTitle className="font-display">Confirm Payment</CardTitle>
                                    <CardDescription>
                                        Enter the transaction ID from your payment provider.
                                    </CardDescription>
                                </CardHeader>

                                <div className="bg-secondary/30 px-6 py-4 border-y border-border/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-muted-foreground">Amount to Pay</span>
                                        <span className="font-display font-bold text-xl text-primary">৳{calculateTotal().toFixed(2)}</span>
                                    </div>
                                    {selectedMethod === 'bkash' && (
                                        <p className="text-xs text-muted-foreground text-right">*Includes 1% charge</p>
                                    )}
                                    {orderIds.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground block mb-1">Order Reference IDs:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {orderIds.map((id: string) => (
                                                    <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
                                                        #{id.slice(0, 8)}...
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="trx-id" className="text-sm font-medium">Transaction ID</Label>
                                            <div className="relative">
                                                <Input
                                                    id="trx-id"
                                                    placeholder="e.g. 9H7G6F5D4S"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    className="font-mono uppercase placeholder:normal-case border-primary/30 focus-visible:ring-primary/50 text-lg py-6 bg-background/50"
                                                />
                                                {transactionId && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success animate-in zoom-in">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Usually a 10-character alphanumeric code sent via SMS.
                                            </p>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-lg font-display tracking-wide relative overflow-hidden group"
                                            disabled={isSubmitting}
                                        >
                                            <span className={cn(
                                                "absolute inset-0 bg-gradient-to-r from-primary via-primary to-accent opacity-100 transition-all duration-300",
                                                isSubmitting ? "opacity-90" : "group-hover:opacity-90"
                                            )} />
                                            <span className="relative flex items-center gap-2 text-primary-foreground">
                                                {isSubmitting ? 'Verifying...' : (
                                                    <>
                                                        Submit Transaction <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </span>
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="bg-secondary/30 p-4 rounded-lg border border-border/50 backdrop-blur text-sm text-center text-muted-foreground">
                                Need help? <a href="#" className="text-primary hover:underline underline-offset-4">Contact Support</a>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Payment;
