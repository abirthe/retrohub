import { describe, it, expect } from "vitest";
import {
  PAYMENT_WINDOW_MINUTES,
  PAYMENT_WINDOW_MS,
  isOrderUnpaid,
  getOrderExpiryTimestamp,
  getOrderRemainingSeconds,
  isOrderExpired,
  formatTimeRemaining,
  getTimeProgressPercent,
} from "@/lib/orderPaymentWindow";

describe("Order Payment Window & 30-Minute Time Limit", () => {
  it("defines standard 30-minute payment window constants", () => {
    expect(PAYMENT_WINDOW_MINUTES).toBe(30);
    expect(PAYMENT_WINDOW_MS).toBe(30 * 60 * 1000);
  });

  describe("isOrderUnpaid", () => {
    it("returns true for pending order without customer_input", () => {
      expect(isOrderUnpaid({ status: "pending" })).toBe(true);
    });

    it("returns true for pending order with empty customer_input", () => {
      expect(isOrderUnpaid({ status: "pending", customer_input: {} })).toBe(true);
    });

    it("returns true for pending order with empty transaction_id", () => {
      expect(
        isOrderUnpaid({
          status: "pending",
          customer_input: { transaction_id: "   " },
        }),
      ).toBe(true);
    });

    it("returns false if transaction_id is present", () => {
      expect(
        isOrderUnpaid({
          status: "pending",
          customer_input: { transaction_id: "TRX123456" },
        }),
      ).toBe(false);
    });

    it("returns false for non-pending orders regardless of transaction_id", () => {
      expect(isOrderUnpaid({ status: "payment_submitted" })).toBe(false);
      expect(isOrderUnpaid({ status: "fulfilled" })).toBe(false);
      expect(isOrderUnpaid({ status: "cancelled" })).toBe(false);
    });
  });

  describe("Time calculation & expiration", () => {
    const fixedNow = 1700000000000;

    it("calculates exact expiry 30 minutes in the future", () => {
      const createdAt = new Date(fixedNow).toISOString();
      const expiry = getOrderExpiryTimestamp(createdAt);
      expect(expiry).toBe(fixedNow + 30 * 60 * 1000);
    });

    it("returns remaining seconds when order is 10 minutes old", () => {
      const createdAt = new Date(fixedNow - 10 * 60 * 1000).toISOString();
      const remainingSecs = getOrderRemainingSeconds(createdAt, fixedNow);
      expect(remainingSecs).toBe(20 * 60); // 20 minutes remaining = 1200s
      expect(isOrderExpired(createdAt, fixedNow)).toBe(false);
    });

    it("detects order as expired when 31 minutes have elapsed", () => {
      const createdAt = new Date(fixedNow - 31 * 60 * 1000).toISOString();
      const remainingSecs = getOrderRemainingSeconds(createdAt, fixedNow);
      expect(remainingSecs).toBe(0);
      expect(isOrderExpired(createdAt, fixedNow)).toBe(true);
    });

    it("detects order as expired when exactly 30 minutes have elapsed", () => {
      const createdAt = new Date(fixedNow - 30 * 60 * 1000).toISOString();
      const remainingSecs = getOrderRemainingSeconds(createdAt, fixedNow);
      expect(remainingSecs).toBe(0);
      expect(isOrderExpired(createdAt, fixedNow)).toBe(true);
    });

    it("clamps remaining seconds to 0 if long expired", () => {
      const createdAt = new Date(fixedNow - 60 * 60 * 1000).toISOString();
      expect(getOrderRemainingSeconds(createdAt, fixedNow)).toBe(0);
    });
  });

  describe("Formatting & Progress", () => {
    it("formats MM:SS correctly", () => {
      expect(formatTimeRemaining(1800)).toBe("30:00");
      expect(formatTimeRemaining(1785)).toBe("29:45");
      expect(formatTimeRemaining(65)).toBe("01:05");
      expect(formatTimeRemaining(9)).toBe("00:09");
      expect(formatTimeRemaining(0)).toBe("00:00");
      expect(formatTimeRemaining(-10)).toBe("00:00");
    });

    it("calculates remaining percentage progress accurately", () => {
      const fixedNow = 1700000000000;
      // Fresh order: 100%
      const freshOrder = new Date(fixedNow).toISOString();
      expect(getTimeProgressPercent(freshOrder, fixedNow)).toBe(100);

      // Halfway (15 minutes in): 50%
      const halfOrder = new Date(fixedNow - 15 * 60 * 1000).toISOString();
      expect(getTimeProgressPercent(halfOrder, fixedNow)).toBe(50);

      // Expired: 0%
      const expiredOrder = new Date(fixedNow - 35 * 60 * 1000).toISOString();
      expect(getTimeProgressPercent(expiredOrder, fixedNow)).toBe(0);
    });
  });
});
