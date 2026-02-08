import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { createOrder } from '@/lib/shopApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Trash2, CreditCard, CheckCircle2, ShieldCheck, Gamepad2 } from 'lucide-react';
import ShopHeader from '@/components/ShopHeader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import heroBg from '@/assets/hero-bg.jpg';

const Checkout = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customerInput, setCustomerInput] = useState<Record<string, string>>({});

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="container py-32 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">Sign in to Checkout</h1>
          <p className="text-muted-foreground mb-4 max-w-md">You need to have an account to place orders. It's free and takes seconds.</p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">Sign In / Register</Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="container py-32 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-2">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mb-4">Looks like you haven't added anything yet.</p>
          <Button onClick={() => navigate('/')} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const failedOrders: string[] = [];

      const createdOrderIds: string[] = [];

      // Create orders for each item with stock validation
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          try {
            const order = await createOrder(item.product.id, Number(item.product.sale_price), customerInput);
            createdOrderIds.push(order.id);
          } catch (error: any) {
            // If stock validation fails, track it
            if (error.message?.includes('out of stock') || error.message?.includes('stock')) {
              failedOrders.push(item.product.title);
            } else {
              throw error; // Re-throw other errors
            }
          }
        }
      }

      if (failedOrders.length > 0) {
        toast({
          title: 'Partial order placed',
          description: `Some items are out of stock: ${failedOrders.join(', ')}`,
          variant: 'default',
        });
      }

      if (createdOrderIds.length > 0) {
        clearCart();
        toast({
          title: 'Order initiated',
          description: 'Please complete your payment.',
        });
        navigate('/payment', { state: { orderIds: createdOrderIds, totalPrice } });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <ShopHeader />
      <div className="container relative z-10 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="font-display text-xs tracking-wider text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="font-display text-2xl font-bold tracking-wider text-right">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 backdrop-blur-md border-white/5 border overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {items.map((item) => (
                    <div key={item.product.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-white/5 transition-colors">
                      <div className="w-24 h-24 bg-secondary/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/5">
                        <span className="font-display text-2xl font-black text-muted-foreground/20">
                          {item.product.platform?.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="font-display text-base font-bold text-foreground">{item.product.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.product.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center rounded-md border border-white/10 bg-background/50">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-none hover:bg-white/10"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="text-xs font-mono w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-none hover:bg-white/10"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.in_stock}
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-display text-xl font-bold text-white tracking-tight">
                          ৳{(Number(item.product.sale_price) * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ৳{Number(item.product.sale_price).toFixed(2)} / unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-xl border-white/10 border shadow-2xl sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg tracking-wider">Order Summary</CardTitle>
                <CardDescription>Review your order before paying</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-display">৳{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Handling</span>
                    <span className="font-display text-success">Free</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-end">
                    <span className="font-display font-medium">Total</span>
                    <span className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                      ৳{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 gradient-primary font-display text-sm tracking-wider gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 relative overflow-hidden group"
                  size="lg"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-secondary/30 p-3 flex gap-3 items-start border border-white/5">
                  <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">Secure Checkout</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Your transaction is secured with end-to-end encryption. We typically process orders within 5 minutes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

