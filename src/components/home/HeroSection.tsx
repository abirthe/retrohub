import heroBg from '@/assets/hero-bg.jpg';
import { Zap, ShieldAlert } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
        }}
      >
        <img
          src={heroBg}
          alt="Hero Background"
          className="w-full h-full object-cover object-top opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)]" />
      </div>

      <div className="container relative z-10 text-center space-y-4 max-w-4xl px-4 py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="font-display tracking-widest text-[11px] uppercase">Official Digital Storefront</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black tracking-wider text-white uppercase leading-[1.08]">
          Game <span className="text-primary">Keys</span> & Top-Ups
        </h1>

        <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Instant digital delivery for PC, console keys, gift cards, subscriptions, and gaming balances.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-foreground/90 font-medium">Instant Delivery</span>
          </div>
          <span className="hidden sm:inline text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-foreground/90 font-medium">100% Secure Checkout</span>
          </div>
          <span className="hidden sm:inline text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-foreground/90 font-medium">Guaranteed Valid Codes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
