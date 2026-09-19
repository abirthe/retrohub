import { ShieldCheck, Zap, Clock, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export interface ProductFeaturesProps {
  product: {
    title: string;
    description: string | null;
  };
}

export const ProductFeatures = ({ product }: ProductFeaturesProps) => {
  return (
    <div className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 space-y-4">
      <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
        <Star className="w-4 h-4 text-accent" />
        About This Product
      </h3>
      
      <div className="text-muted-foreground leading-relaxed text-sm space-y-4">
        {product.description ? (
          // Split by newlines OR emojis that act as list markers
          product.description.split(/(?=\n|✅|📞|⭐|💸|-|\*)/u).filter(Boolean).map((line, i) => {
            const cleanLine = line.trim();
            if (!cleanLine) return null;

            // If it starts with an emoji or bullet, format as a list item
            const isBullet = /^[✅📞⭐💸\-*]/u.test(cleanLine);
            
            if (isBullet) {
              // Extract the first character as the icon, and the rest as text
              const icon = cleanLine.charAt(0);
              const text = cleanLine.slice(1).trim();
              
              return (
                <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-primary/20 transition-colors">
                  <div className="mt-0.5 shrink-0 text-primary">
                    {icon === '-' || icon === '*' ? <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" /> : <span>{icon}</span>}
                  </div>
                  <span className="text-white/80">{text}</span>
                </div>
              );
            }
            
            if (cleanLine.includes(':')) {
              const [key, ...val] = cleanLine.split(':');
              return (
                <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="font-semibold text-primary">{key.trim()}:</span> {val.join(':').trim()}
                </div>
              );
            }
            return <p key={i} className="text-white/70">{cleanLine}</p>;
          })
        ) : (
          <p className="italic text-white/50">Experience the ultimate digital journey with {product.title}. Securely delivered to you instantly.</p>
        )}
      </div>
      
      <Separator className="bg-white/5" />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Secure Transaction</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Zap className="w-4 h-4" />
          </div>
          <span>Instant - 30min Delivery</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
            <Clock className="w-4 h-4" />
          </div>
          <span>24/7 Support</span>
        </div>
      </div>
    </div>
  );
};
