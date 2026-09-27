import { describe, it, expect, beforeEach } from 'vitest';
import { getCartStorageKey, loadCartFromStorage } from '@/lib/cartStorage';
import type { Product } from '@/lib/shopApi';

const mockProduct: Product = {
  id: 'prod-123',
  title: 'Test Game',
  category: 'pc_game',
  cost_price: 10.0,
  sale_price: 15.99,
  in_stock: 5,
  description: 'A test game',
  delivery_type: 'instant_code',
  image_url: null,
  platform: 'PC',
  region: 'GLOBAL',
  source_platform: null,
  source_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Cart Storage & User Partitioning', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates correct partitioned keys for guest vs authenticated users', () => {
    expect(getCartStorageKey(null)).toBe('cart_guest');
    expect(getCartStorageKey('user-1')).toBe('cart_user-1');
    expect(getCartStorageKey('user-2')).toBe('cart_user-2');
  });

  it('returns empty array when no cart exists in storage', () => {
    expect(loadCartFromStorage('cart_guest')).toEqual([]);
    expect(loadCartFromStorage('cart_user-1')).toEqual([]);
  });

  it('loads saved cart items for specific partitioned key', () => {
    const userCart = [{ product: mockProduct, quantity: 2 }];
    localStorage.setItem('cart_user-1', JSON.stringify(userCart));

    expect(loadCartFromStorage('cart_user-1')).toEqual(userCart);
    expect(loadCartFromStorage('cart_user-2')).toEqual([]);
    expect(loadCartFromStorage('cart_guest')).toEqual([]);
  });

  it('migrates legacy unpartitioned "cart" key to "cart_guest"', () => {
    const legacyCart = [{ product: mockProduct, quantity: 1 }];
    localStorage.setItem('cart', JSON.stringify(legacyCart));

    const loaded = loadCartFromStorage('cart_guest');
    expect(loaded).toEqual(legacyCart);
    expect(localStorage.getItem('cart')).toBeNull();
    expect(localStorage.getItem('cart_guest')).toBe(JSON.stringify(legacyCart));
  });

  it('handles corrupted JSON in storage gracefully without throwing', () => {
    localStorage.setItem('cart_user-broken', 'invalid json {{{');
    const loaded = loadCartFromStorage('cart_user-broken');
    expect(loaded).toEqual([]);
    expect(localStorage.getItem('cart_user-broken')).toBeNull();
  });
});
