import React from "react";
import { Zap, ShieldCheck, Smartphone, Send, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const StoreAssurances: React.FC = () => {
  return (
    <section className="relative z-20 mb-8 sm:mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pillar 1 */}
        <div className="relative group p-4 sm:p-5 rounded-2xl bg-card/40 hover:bg-card/70 border border-white/5 hover:border-primary/30 transition-all duration-300 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-sm text-white tracking-wide mb-1 flex items-center gap-1.5">
            Instant Auto Delivery
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Direct real-time key and voucher fulfillment to your Customer
            Console & email upon checkout.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="relative group p-4 sm:p-5 rounded-2xl bg-card/40 hover:bg-card/70 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-sm text-white tracking-wide mb-1">
            100% Verified Valid Codes
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Wholesale distributor authenticated licenses backed by a
            zero-quibble replacement guarantee.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="relative group p-4 sm:p-5 rounded-2xl bg-card/40 hover:bg-card/70 border border-white/5 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-sm text-white tracking-wide mb-1">
            bKash Exclusive Checkout
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Safe, zero-hassle local payments via bKash Send Money with instant
            TrxID receipt validation.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="relative group p-4 sm:p-5 rounded-2xl bg-card/40 hover:bg-card/70 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5 rotate-45" />
          </div>
          <h3 className="font-display font-bold text-sm text-white tracking-wide mb-1">
            24/7 Telegram Concierge
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Direct chat for order status updates, game requests, and live
            support at @retrochanbot.
          </p>
          <a
            href="https://t.me/retrochanbot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 group-hover:underline"
          >
            <span>Open Telegram Bot</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default StoreAssurances;
