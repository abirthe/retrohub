import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product } from '@/lib/shopApi';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  quantity: number;
}

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

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
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

