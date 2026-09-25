import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import BackgroundAnimation from "@/components/BackgroundAnimation";

import { AppErrorBoundary } from "@/components/ErrorBoundary";

// Helper to auto-recover when a new Vercel deployment replaces JS chunk hashes
const lazyWithRetry = <T extends React.ComponentType<Record<string, unknown>>>(
  componentImport: () => Promise<{ default: T }>
) =>
  lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // hold until reload
      }
      throw error;
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
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
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

export default App;
