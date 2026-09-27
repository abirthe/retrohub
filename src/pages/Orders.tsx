import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
  CreditCard,
  Search,
  Send,
  Sparkles,
  ShieldCheck,
  Headphones,
  Copy,
  Check,
} from 'lucide-react';
import { ShopHeader } from '@/components/layout';
import { useNavigate } from 'react-router-dom';
import { MobileOrderCard, DesktopOrderTable } from '@/components/orders';
import type { Order, Delivery } from '@/lib/shopApi';

const statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  pending: {
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: 'Pending Verification',
  },
  payment_submitted: {
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    icon: <CreditCard className="h-3.5 w-3.5" />,
    label: 'Payment Submitted',
  },
  payment_verified: {
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Payment Verified',
  },
  sourcing: {
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    icon: <Clock className="h-3.5 w-3.5 animate-pulse" />,
    label: 'Processing Delivery',
  },
  fulfilled: {
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Fulfilled & Delivered',
  },
  cancelled: {
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Cancelled',
  },
  refunded: {
    className: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    label: 'Refunded',
  },
  failed: {
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Failed',
  },
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState<'all' | 'fulfilled' | 'active'>('all');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<(Order & { products?: any; deliveries?: Delivery[] }) | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, products(id, title, platform, category), deliveries(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as (Order & { products?: any; deliveries?: Delivery[] })[];
    },
    enabled: !!user,
  });

  const handleSearchOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchOrderId.trim();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    try {
      // 1. Try direct ID match
      let query = supabase
        .from('orders')
        .select('*, products(id, title, platform, category), deliveries(*)');

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
        const { data } = await query.eq('id', clean).maybeSingle();
        if (data) {
          setSearchedOrder(data as any);
          setIsSearching(false);
          return;
        }
      }

      // 2. Try prefix search on recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*, products(id, title, platform, category), deliveries(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      const match = recent?.find((o: any) => o.id.toLowerCase().startsWith(clean.toLowerCase()));
      if (match) {
        setSearchedOrder(match as any);
      } else {
        setSearchError(`No order found matching "${clean}". Please check your order confirmation.`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error looking up order');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const filteredOrders = (orders || []).filter((o) => {
    if (filterTab === 'fulfilled') return o.status === 'fulfilled';
    if (filterTab === 'active') return ['pending', 'payment_submitted', 'payment_verified', 'sourcing'].includes(o.status || '');
    return true;
  });

  return (
    <div className="min-h-screen selection:bg-primary/20 pb-20">
      <ShopHeader />

      <div className="container py-8 max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate('/');
              }}
              className="mb-2 font-display text-xs tracking-wider text-muted-foreground hover:text-white p-0 h-auto hover:bg-transparent"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-2" />
              Back to Store
            </Button>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider text-foreground">
              Customer <span className="text-primary">Console</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time delivery tracker, license key locker, and 24/7 Telegram support concierge
            </p>
          </div>

          {/* Quick Telegram Launcher in Header */}
          <div className="flex items-center gap-3">
            <a
              href="https://t.me/retrochanbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-display text-xs tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5 rotate-45" />
              <span>Launch Support Bot</span>
              <Sparkles className="w-3 h-3 text-cyan-200 animate-pulse" />
            </a>
          </div>
        </div>

        {/* Support Banner & Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-xs font-bold text-foreground tracking-wide">24/7 Live Triage</p>
              <p className="text-[11px] text-muted-foreground">Instant self-service on Telegram or human agent escalation</p>
            </div>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-xs font-bold text-foreground tracking-wide">Verified Fulfillment</p>
              <p className="text-[11px] text-muted-foreground">Genuine global & regional licenses directly from authorized distros</p>
            </div>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-xs font-bold text-foreground tracking-wide">Instant Key Locker</p>
              <p className="text-[11px] text-muted-foreground">Permanent access to your redeemed credentials & activation keys</p>
            </div>
          </Card>
        </div>

        {/* Quick Order Lookup Form */}
        <Card className="bg-card/60 backdrop-blur-xl border-white/10 p-5 md:p-6 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-foreground tracking-wide flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Track Order by ID
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter your 8-digit Order prefix or full ID from your receipt
              </p>
            </div>

            {!user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth', { state: { from: '/orders' } })}
                className="text-xs border-white/10 hover:bg-white/5"
              >
                Sign In to View All Orders
              </Button>
            )}
          </div>

          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="e.g. c7c482a2 or 8-character ID prefix..."
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="bg-background/50 border-white/10 font-mono text-sm pl-4 pr-10 focus-visible:ring-primary h-11"
              />
              {searchOrderId && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchOrderId('');
                    setSearchedOrder(null);
                    setSearchError(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSearching || !searchOrderId.trim()}
              className="gradient-primary h-11 px-6 font-display text-xs tracking-wider"
            >
              {isSearching ? 'Searching...' : 'Track'}
            </Button>
          </form>

          {searchError && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Searched Order Result Card */}
          {searchedOrder && (
            <div className="mt-4 p-4 rounded-xl bg-background/60 border border-primary/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">#{searchedOrder.id.slice(0, 8)}</span>
                    <Badge
                      variant="outline"
                      className={statusStyles[searchedOrder.status || 'pending']?.className}
                    >
                      {statusStyles[searchedOrder.status || 'pending']?.label}
                    </Badge>
                  </div>
                  <p className="font-display text-sm font-bold text-foreground mt-1">
                    {searchedOrder.products?.title || 'Unknown Product'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-white text-base">
                    ৳{Number(searchedOrder.total).toFixed(2)}
                  </span>
                  <a
                    href={`https://t.me/retrochanbot?start=order_${searchedOrder.id.slice(0, 8)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors"
                  >
                    <Send className="w-3 h-3 rotate-45" />
                    <span>Telegram Triage</span>
                  </a>
                </div>
              </div>

              {/* Delivery info */}
              {searchedOrder.deliveries && searchedOrder.deliveries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-success font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Your Digital Key:
                  </p>
                  {searchedOrder.deliveries.map((del) => (
                    <div
                      key={del.id}
                      className="bg-success/5 border border-success/20 rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <span className="font-mono text-xs text-success select-all break-all">
                        {del.delivery_code}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(del.id, del.delivery_code)}
                        className="h-7 px-2 text-xs text-success hover:bg-success/20 shrink-0"
                      >
                        {copiedKeyId === del.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Order status: {searchedOrder.status}. Credentials will appear here upon completion.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Logged-In User Order History */}
        {user ? (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={filterTab === 'all' ? 'default' : 'ghost'}
                  onClick={() => setFilterTab('all')}
                  className={filterTab === 'all' ? 'gradient-primary text-xs' : 'text-xs text-muted-foreground hover:text-white'}
                >
                  All ({orders?.length || 0})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'fulfilled' ? 'default' : 'ghost'}
                  onClick={() => setFilterTab('fulfilled')}
                  className={filterTab === 'fulfilled' ? 'gradient-primary text-xs' : 'text-xs text-muted-foreground hover:text-white'}
                >
                  Delivered ({orders?.filter((o) => o.status === 'fulfilled').length || 0})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'active' ? 'default' : 'ghost'}
                  onClick={() => setFilterTab('active')}
                  className={filterTab === 'active' ? 'gradient-primary text-xs' : 'text-xs text-muted-foreground hover:text-white'}
                >
                  Processing ({orders?.filter((o) => ['pending', 'payment_submitted', 'payment_verified', 'sourcing'].includes(o.status || '')).length || 0})
                </Button>
              </div>
            </div>

            {isLoading ? (
              <Card className="bg-card/50 backdrop-blur border-white/5">
                <CardContent className="p-8 text-center py-20">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-display tracking-wider animate-pulse text-muted-foreground">
                    Retrieving your purchases...
                  </p>
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur border-white/5">
                <CardContent className="p-12 text-center space-y-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center opacity-50">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-lg tracking-wider text-foreground">No orders in this view</p>
                    <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                      Explore our catalog for instant digital activation codes and subscriptions.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/')}
                    className="gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20"
                  >
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/60 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
                {/* Mobile card layout */}
                <div className="sm:hidden divide-y divide-white/5">
                  {filteredOrders.map((order) => {
                    const status = statusStyles[order.status || 'pending'] || statusStyles.pending;
                    const orderDate = new Date(order.created_at || '').toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <MobileOrderCard
                        key={order.id}
                        order={order}
                        statusStyle={status}
                        orderDate={orderDate}
                      />
                    );
                  })}
                </div>

                {/* Desktop table layout */}
                <DesktopOrderTable orders={filteredOrders} statusStyles={statusStyles} />
              </Card>
            )}
          </div>
        ) : (
          /* Non-logged in banner */
          <Card className="bg-card/30 backdrop-blur border-white/5 p-8 text-center space-y-4">
            <p className="font-display text-lg text-foreground tracking-wide">
              Sign in to automatically sync and access all your past orders
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Link your Google Account to manage purchases, get automatic delivery updates, and open customer support tickets with one tap.
            </p>
            <Button
              onClick={() => navigate('/auth', { state: { from: '/orders' } })}
              className="gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20"
            >
              Sign In with Google
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Orders;
