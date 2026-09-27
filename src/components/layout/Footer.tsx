import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  Smartphone,
  Send,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";

export const Footer: React.FC = () => {
  const location = useLocation();

  // Hide footer on administrative console to maintain a distraction-free management workspace
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative z-20 border-t border-white/10 bg-background/80 backdrop-blur-xl mt-auto">
      {/* Top Trust & Value Properties Bar */}
      <div className="border-b border-white/5 bg-white/[0.015]">
        <div className="container py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Property 1 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-card/20 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-white tracking-wide">
                  Instant Delivery
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automated digital keys & credentials dispatched straight to
                  your Customer Console.
                </p>
              </div>
            </div>

            {/* Property 2 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-card/20 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-white tracking-wide">
                  100% Verified Valid
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Genuine distributor wholesale keys backed by our full
                  replacement guarantee.
                </p>
              </div>
            </div>

            {/* Property 3 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-card/20 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-white tracking-wide">
                  bKash Exclusive Pay
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fast, secure local payments with bKash Send Money & instant
                  TrxID submission.
                </p>
              </div>
            </div>

            {/* Property 4 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-card/20 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Send className="w-5 h-5 rotate-45" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-display text-sm font-bold text-white tracking-wide">
                    Telegram Concierge
                  </h4>
                  <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  24/7 dedicated live assistance and custom product sourcing via
                  @retrochanbot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Brand Section */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/images/logo-monogram.jpg"
                alt="RetroHub"
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-primary/40 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all duration-300 group-hover:scale-105"
              />
              <span className="font-display text-xl font-extrabold tracking-wider text-foreground">
                <span className="text-primary">RETRO</span>HUB
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              The premier digital gaming storefront for PC & console keys, gift
              cards, subscriptions, and gaming balances with instant automated
              delivery.
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>SSL Encrypted Checkout • Verified Official Sourcing</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="font-display text-xs font-bold uppercase tracking-widest text-white">
              Storefront
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/?category=games"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Game Keys
                </Link>
              </li>
              <li>
                <Link
                  to="/?category=topup"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  In-Game Top-Ups
                </Link>
              </li>
              <li>
                <Link
                  to="/?category=subscriptions"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link
                  to="/?category=giftcards"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Gift Cards
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h5 className="font-display text-xs font-bold uppercase tracking-widest text-white">
              Customer Hub
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/orders"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Customer Console
                </Link>
              </li>
              <li>
                <Link
                  to="/custom-order"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Custom Order Request</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                    15m
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/retrochanbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>Telegram Support Bot</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Payment */}
          <div className="space-y-3">
            <h5 className="font-display text-xs font-bold uppercase tracking-widest text-white">
              Security & Policies
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80 block">
                  Accepted Payment:{" "}
                  <strong className="text-pink-400 font-semibold">
                    bKash Only
                  </strong>
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/80 block">
                  Support:{" "}
                  <span className="font-mono text-foreground">
                    @retrochanbot
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} RETROHUB. All rights reserved. Dev by
            ABIR HOSSAIN.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-muted-foreground/60">
              Instant Auto Delivery
            </span>
            <span className="text-white/10">•</span>
            <span className="text-muted-foreground/60">
              100% Genuine Working Codes
            </span>
            <span className="text-white/10">•</span>
            <span className="text-muted-foreground/60">bKash Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
