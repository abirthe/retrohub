import heroBg from '@/assets/hero-bg.jpg';
import { Sparkles, Zap, ShieldAlert } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[480px] sm:min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Hero Background"
          className="w-full h-full object-cover object-top opacity-40"
          style={{ animationDuration: '15s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)]" />
      </div>

      <div className="container relative z-10 text-center space-y-6 max-w-5xl px-4 py-14 sm:py-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-display font-medium tracking-[0.2em] text-primary uppercase">
            Premium Digital Store
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-wider text-white drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.3)] leading-[1.1] animate-in zoom-in-95 duration-700 delay-100 uppercase">
          Game <span className="text-transparent bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-primary via-white to-accent filter drop-shadow-none animate-shimmer">Keys</span>{' '}
          <span className="text-primary">&</span>{' '}<br />
          <span className="text-white">Top-Ups</span>
        </h1>

        <p className="text-muted-foreground text-base md:text-2xl max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Instant delivery for game keys, gift cards, in-game currencies and subscriptions.
          <br className="hidden sm:block" />
          <span className="mt-2 inline-block">
            Powered by <span className="text-primary font-bold border-b border-primary/30 pb-0.5">automated H2H fulfillment</span>.
          </span>
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-xs sm:text-sm hover:border-primary/30 transition-colors">
            <Zap className="w-4 h-4 text-primary fill-primary/20" />
            <span className="font-semibold text-foreground">24/7 Instant Delivery</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-xs sm:text-sm hover:border-primary/30 transition-colors">
            <ShieldAlert className="w-4 h-4 text-success fill-success/20" />
            <span className="font-semibold text-foreground">100% Secure Payment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
