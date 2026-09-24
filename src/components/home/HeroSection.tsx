import { useState, useEffect } from 'react';
import heroBg from '@/assets/hero-bg.jpg';
import { Sparkles, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROTATING_ITEMS = [
  'Game Keys',
  'Top-Ups & Coins',
  'Gift Cards',
  'Subscriptions',
  'Game Accounts',
  'Gaming & Digital Services',
];

function AnimatedTagline() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_ITEMS.length);
        setIsVisible(true);
      }, 250);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-8 sm:h-10 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <p className="text-muted-foreground text-sm sm:text-lg md:text-xl font-medium tracking-wide flex items-center gap-1.5 sm:gap-2">
        <span>Instant delivery for</span>
        <span
          className={cn(
            'inline-block font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-accent transition-all duration-300 transform',
            isVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-95'
          )}
        >
          {ROTATING_ITEMS[index]}
        </span>
      </p>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[440px] sm:min-h-[520px] lg:min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Hero Background"
          className="w-full h-full object-cover object-top opacity-40 animate-pulse [animation-duration:15s]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)]" />
      </div>

      <div className="container relative z-10 text-center space-y-5 max-w-5xl px-4 py-12 sm:py-16">
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

        <AnimatedTagline />

        <div className="flex flex-wrap justify-center gap-3 pt-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
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
