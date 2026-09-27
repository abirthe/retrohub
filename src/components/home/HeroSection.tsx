import { Zap, ShieldCheck, Smartphone, Send } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
        }}
      >
        <img
          src="/hero-bg.webp"
          alt="Hero Background"
          width="1440"
          height="810"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-top opacity-5 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="container relative z-10 text-center space-y-4 max-w-4xl px-4 py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-display tracking-widest text-[11px] uppercase">Official Digital Storefront</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black tracking-wider text-white uppercase leading-[1.08]">
          Game <span className="text-primary">Keys</span> & Top-Ups
        </h1>

        <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Instant automated delivery for authentic PC, console keys, digital gift cards, subscriptions, and gaming balances.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-muted-foreground pt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 shadow-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-foreground/90 font-medium">Instant Auto-Delivery</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-foreground/90 font-medium">100% Verified Valid Codes</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 shadow-sm">
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span className="text-foreground/90 font-medium">bKash Exclusive Pay</span>
          </div>

          <a 
            href="https://t.me/retrochanbot"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5 rotate-45 text-cyan-400" />
            <span className="font-medium">24/7 Telegram Concierge</span>
          </a>
        </div>
      </div>
    </section>
  );
}

