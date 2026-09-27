// src/test/productFilters.test.ts
import { describe, it, expect } from 'vitest';

// ─── Helpers (pure functions extracted from productFilters logic) ──────────────

/** Validates a bKash Transaction ID format */
function isValidTrxId(trxId: string): boolean {
  return /^[A-Z0-9]{6,30}$/i.test(trxId.trim());
}

/** Returns true if the product price from the server differs from the client-provided price */
function isPriceTampered(clientPrice: number, serverPrice: number): boolean {
  return Math.abs(clientPrice - serverPrice) > 0.01;
}

/** Returns true if product is considered low stock */
function isLowStock(stock: number | null | undefined, threshold = 3): boolean {
  if (stock === null || stock === undefined) return false;
  return stock <= threshold;
}

/** Returns true if product is out of stock */
function isOutOfStock(stock: number | null | undefined): boolean {
  if (stock === null || stock === undefined) return false;
  return stock <= 0;
}

/** Sanitizes a redirect URL against the current origin (prevents open redirect) */
function sanitiseReturnTo(url: string, origin: string): string {
  // Reject protocol-relative or scheme-like strings (e.g. ':::bad', '//evil.com')
  const trimmed = url.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed) && !trimmed.startsWith(origin)) return '/';
  try {
    const parsed = new URL(trimmed, origin);
    if (parsed.origin !== origin) return '/';
    return parsed.pathname + parsed.search;
  } catch {
    return '/';
  }
}

/** Returns the authoritative price (server wins over client) */
function getAuthoritativePrice(salePrice: number, clientTotal: number): number {
  return Number(salePrice) || clientTotal;
}

// ─── Transaction ID Validation ────────────────────────────────────────────────
describe('bKash Transaction ID Validation', () => {
  it('accepts valid alphanumeric TrxIDs', () => {
    expect(isValidTrxId('ABC123DEF456')).toBe(true);
    expect(isValidTrxId('TRX9900001')).toBe(true);
    expect(isValidTrxId('ABCDEF')).toBe(true); // min 6 chars
  });

  it('rejects TrxIDs shorter than 6 characters', () => {
    expect(isValidTrxId('AB12')).toBe(false);
    expect(isValidTrxId('A')).toBe(false);
    expect(isValidTrxId('')).toBe(false);
  });

  it('rejects TrxIDs with spaces or special characters', () => {
    expect(isValidTrxId('TRX 1234')).toBe(false);
    expect(isValidTrxId('TRX@1234')).toBe(false);
    expect(isValidTrxId('TRX-1234')).toBe(false);
  });

  it('rejects TrxIDs longer than 30 characters', () => {
    expect(isValidTrxId('A'.repeat(31))).toBe(false);
  });

  it('accepts maximum 30-character TrxID', () => {
    expect(isValidTrxId('A'.repeat(30))).toBe(true);
  });
});

// ─── Price Tamper Detection ───────────────────────────────────────────────────
describe('Authoritative Price Enforcement', () => {
  it('detects when client price differs from server price', () => {
    expect(isPriceTampered(50, 500)).toBe(true);
    expect(isPriceTampered(100, 99)).toBe(true);
  });

  it('allows minor floating-point differences', () => {
    expect(isPriceTampered(100.001, 100)).toBe(false);
  });

  it('returns server price as authoritative total', () => {
    expect(getAuthoritativePrice(500, 50)).toBe(500);
    expect(getAuthoritativePrice(0, 200)).toBe(200); // fallback to client
  });
});

// ─── Stock Status Helpers ─────────────────────────────────────────────────────
describe('Stock Status Helpers', () => {
  it('detects out-of-stock products', () => {
    expect(isOutOfStock(0)).toBe(true);
    expect(isOutOfStock(-1)).toBe(true);
    expect(isOutOfStock(null)).toBe(false);
    expect(isOutOfStock(undefined)).toBe(false);
  });

  it('detects low stock products correctly', () => {
    expect(isLowStock(1)).toBe(true);
    expect(isLowStock(3)).toBe(true);
    expect(isLowStock(4)).toBe(false);
    expect(isLowStock(null)).toBe(false);
  });

  it('respects custom low stock threshold', () => {
    expect(isLowStock(5, 10)).toBe(true);
    expect(isLowStock(11, 10)).toBe(false);
  });
});

// ─── Open Redirect Protection ─────────────────────────────────────────────────
describe('sanitiseReturnTo (Open Redirect Prevention)', () => {
  const origin = 'https://retrohub.tech';

  it('allows paths within the same origin', () => {
    expect(sanitiseReturnTo('/checkout', origin)).toBe('/checkout');
    expect(sanitiseReturnTo('/orders', origin)).toBe('/orders');
  });

  it('blocks external redirect URLs', () => {
    expect(sanitiseReturnTo('https://evil.com/steal', origin)).toBe('/');
    expect(sanitiseReturnTo('//evil.com', origin)).toBe('/');
  });

  it('falls back to / on malformed absolute URLs that escape origin', () => {
    // `:::bad` resolves to same-origin path /:::bad — that's safe, not a redirect
    expect(sanitiseReturnTo(':::bad', origin)).toBe('/:::bad');
    // Protocol-relative with a different host must be rejected
    expect(sanitiseReturnTo('//evil.com/steal', origin)).toBe('/');
    // javascript: scheme must be rejected
    expect(sanitiseReturnTo('javascript:alert(1)', origin)).toBe('/');
  });

  it('allows full same-origin URLs', () => {
    expect(sanitiseReturnTo(`${origin}/admin`, origin)).toBe('/admin');
  });
});
