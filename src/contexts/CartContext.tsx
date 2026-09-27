import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { Product } from '@/lib/shopApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCartStorageKey, loadCartFromStorage, type CartItem } from '@/lib/cartStorage';

export type { CartItem };

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);


export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Track active user ID: undefined before auth resolution, null for guest, string for authenticated user
  const activeUserIdRef = useRef<string | null | undefined>(undefined);
  const isInitialLoadRef = useRef<boolean>(true);

  // Synchronize cart with active authentication user
  useEffect(() => {
    let isMounted = true;

    const initializeCartForUser = (userId: string | null) => {
      activeUserIdRef.current = userId;
      const key = getCartStorageKey(userId);
      const userItems = loadCartFromStorage(key);
      if (isMounted) {
        setItems(userItems);
        isInitialLoadRef.current = false;
      }
    };

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const initialUserId = session?.user?.id ?? null;
      initializeCartForUser(initialUserId);
    }).catch(() => {
      if (!isMounted) return;
      initializeCartForUser(null);
    });

    // 2. Listen for auth changes (login, logout, switch account)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      const newUserId = session?.user?.id ?? null;
      const prevUserId = activeUserIdRef.current;

      // If user hasn't changed (e.g. token refresh), skip re-loading
      if (newUserId === prevUserId && !isInitialLoadRef.current) {
        return;
      }

      activeUserIdRef.current = newUserId;
      isInitialLoadRef.current = false;
      const newKey = getCartStorageKey(newUserId);
      const targetCart = loadCartFromStorage(newKey);

      // If a guest logs in and had items in guest cart while their account cart is empty, transfer guest items
      if (prevUserId === null && newUserId !== null && event === 'SIGNED_IN') {
        const guestCart = loadCartFromStorage('cart_guest');
        if (guestCart.length > 0 && targetCart.length === 0) {
          localStorage.setItem(newKey, JSON.stringify(guestCart));
          localStorage.removeItem('cart_guest');
          setItems(guestCart);
          return;
        }
      }

      setItems(targetCart);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Save cart to localStorage whenever items change for the currently active user
  useEffect(() => {
    if (activeUserIdRef.current === undefined || isInitialLoadRef.current) {
      return;
    }
    const key = getCartStorageKey(activeUserIdRef.current);
    localStorage.setItem(key, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    let result: 'stock_error' | 'updated' | 'added' = 'added';
    const availableStock = product.in_stock;

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.in_stock) {
          result = 'stock_error';
          return prev;
        }
        result = 'updated';
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      if (quantity > product.in_stock) {
        result = 'stock_error';
        return prev;
      }
      result = 'added';
      return [...prev, { product, quantity }];
    });

    // Schedule toast outside of state updater to keep interaction latency < 50ms (Good INP)
    queueMicrotask(() => {
      if (result === 'stock_error') {
        toast({
          title: 'Insufficient stock',
          description: `Only ${availableStock} items available`,
          variant: 'destructive',
        });
      } else if (result === 'updated') {
        toast({
          title: 'Added to cart',
          description: `${product.title} quantity updated`,
        });
      } else {
        toast({
          title: 'Added to cart',
          description: `${product.title} added to your cart`,
        });
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    queueMicrotask(() => {
      toast({
        title: 'Removed from cart',
        description: 'Item removed from your cart',
      });
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    let stockError = false;
    let availableStock = 0;

    setItems((prev) => {
      const item = prev.find((item) => item.product.id === productId);
      if (!item) return prev;
      if (quantity > item.product.in_stock) {
        stockError = true;
        availableStock = item.product.in_stock;
        return prev;
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });

    if (stockError) {
      queueMicrotask(() => {
        toast({
          title: 'Insufficient stock',
          description: `Only ${availableStock} items available`,
          variant: 'destructive',
        });
      });
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.product.sale_price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
