import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";

import { AppErrorBoundary } from "@/components/ErrorBoundary";
import BackgroundAnimation from "@/components/BackgroundAnimation";

// Global in-flight reload promise so all simultaneously failing chunks wait together in Suspense
let chunkReloadPromise: Promise<never> | null = null;

const handleChunkFailure = (error: unknown): Promise<never> => {
  const msg = error instanceof Error ? error.message : String(error);
  const isChunkError = /failed to fetch dynamically imported module|importing a module script failed|Chunk loaded without default export|undefined \(reading 'default'\)|Cannot read properties of undefined/i.test(msg);

  // If a reload is already in flight, return the same unresolved promise so Suspense stays active
  if (chunkReloadPromise) {
    return chunkReloadPromise;
  }

  const lastReload = parseInt(window.sessionStorage.getItem('chunk_reload_timestamp') || '0', 10);
  const now = Date.now();

  // If we haven't reloaded recently (within 15s), trigger a cache-busted page replacement
  if (isChunkError && now - lastReload > 15000) {
    chunkReloadPromise = new Promise(() => {});
    window.sessionStorage.setItem('chunk_reload_timestamp', String(now));
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(now));
    window.location.replace(url.toString());
    return chunkReloadPromise;
  }

  // If chunk error occurred right after reload, wait silently rather than flashing an error card
  if (isChunkError) {
    return new Promise(() => {});
  }

  throw error;
};

// Helper to auto-recover seamlessly when a new deployment replaces JS chunk hashes
const lazyWithRetry = <T extends React.ComponentType<Record<string, unknown>>>(
  componentImport: () => Promise<{ default: T }>
) =>
  lazy(async () => {
    try {
      const module = await componentImport();
      if (!module || !module.default) {
        return handleChunkFailure(new Error('Chunk loaded without default export, refreshing page'));
      }
      return module;
    } catch (error) {
      return handleChunkFailure(error);
    }
  });

const Index = lazyWithRetry(() => import("./pages/Index"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const ProductDetail = lazyWithRetry(() => import("./pages/ProductDetail"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const Orders = lazyWithRetry(() => import("./pages/Orders"));
const Payment = lazyWithRetry(() => import("./pages/Payment"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const CustomOrder = lazyWithRetry(() => import("./pages/CustomOrder"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background/60 backdrop-blur-sm">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => {
  useEffect(() => {
    // Clean up cosmetic URL params added by cache-busting reload
    // NOTE: Do NOT clear chunk_reload_timestamp here — that guard must persist
    // until its 15-second TTL expires naturally. Clearing it too early (while
    // lazy routes are still loading in Suspense) caused a redirect loop:
    // App mounts → guard cleared → second chunk error fires → reload again → ∞
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('v') || url.searchParams.has('reload')) {
        url.searchParams.delete('v');
        url.searchParams.delete('reload');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch {
      // Safe no-op
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
        <div className="relative w-full min-h-screen">
          <div className="fixed inset-0 z-0 pointer-events-none">
            <BackgroundAnimation />
          </div>
          <div className="relative z-10 flex flex-col w-full min-h-screen">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    {/* Storefront aliases for reverse navigation and inbound links */}
                    <Route path="/shop" element={<Navigate to="/" replace />} />
                    <Route path="/store" element={<Navigate to="/" replace />} />
                    <Route path="/products" element={<Navigate to="/" replace />} />
                    <Route path="/cart" element={<Navigate to="/checkout" replace />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/signin" element={<Navigate to="/auth" replace />} />
                    <Route path="/register" element={<Navigate to="/auth" replace />} />

                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/console" element={<Orders />} />
                    <Route path="/support" element={<Orders />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/custom-order" element={<CustomOrder />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppErrorBoundary>
            </BrowserRouter>
          </div>
        </div>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
};

export default App;
