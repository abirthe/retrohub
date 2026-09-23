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
      
      <div className="text-muted-foreground leading-relaxed text-sm space-y-3">
        {product.description ? (
          product.description
            .split('\n')
            .map((rawLine) => rawLine.trim())
            .filter((cleanLine) => {
              if (!cleanLine) return false;
              // Ignore horizontal separators
              if (/^[-=_*]{3,}$/.test(cleanLine)) return false;
              return true;
            })
            .map((cleanLine, i) => {
              // 1. Markdown Headings (e.g. ### ⚡ Title, #### 🛡️ Highlights)
              if (cleanLine.startsWith('#')) {
                const headingText = cleanLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
                return (
                  <h4 key={i} className="font-semibold text-white text-base pt-2 flex items-center gap-2">
                    {headingText}
                  </h4>
                );
              }

              // 2. Numbered steps (e.g. 1. Step one)
              const stepMatch = cleanLine.match(/^(\d+)\.\s*(.*)/);
              if (stepMatch) {
                const num = stepMatch[1];
                const text = stepMatch[2].replace(/\*\*/g, '').trim();
                return (
                  <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="text-white/80">{text}</span>
                  </div>
                );
              }

              // 3. Bullet points and emoji list items
              const bulletMatch = cleanLine.match(/^([-*•✅📞⭐💸🛡️📋✨👉📌])\s*(.*)/u);
              if (bulletMatch) {
                const icon = bulletMatch[1];
                let text = bulletMatch[2].trim();
                if (!text) return null;

                // Handle bold label within bullet: e.g. **Label:** Value
                let label = '';
                const boldMatch = text.match(/^\*\*(.*?)\*\*[:\-]?\s*(.*)/);
                if (boldMatch) {
                  label = boldMatch[1];
                  text = boldMatch[2];
                }

                return (
                  <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-primary/20 transition-colors">
                    <div className="mt-0.5 shrink-0 text-primary">
                      {icon === '-' || icon === '*' || icon === '•' ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      ) : (
                        <span>{icon}</span>
                      )}
                    </div>
                    <span className="text-white/80">
                      {label && <strong className="text-white font-medium mr-1.5">{label}:</strong>}
                      {text.replace(/\*\*/g, '')}
                    </span>
                  </div>
                );
              }

              // 4. Key-value pairs (excluding URLs)
              if (cleanLine.includes(':') && !cleanLine.startsWith('http')) {
                const colonIdx = cleanLine.indexOf(':');
                const key = cleanLine.slice(0, colonIdx).replace(/\*\*/g, '').trim();
                const val = cleanLine.slice(colonIdx + 1).replace(/\*\*/g, '').trim();
                if (key && val) {
                  return (
                    <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="font-semibold text-primary">{key}:</span>{' '}
                      <span className="text-white/80">{val}</span>
                    </div>
                  );
                }
              }

              // 5. Normal text paragraphs
              return (
                <p key={i} className="text-white/70">
                  {cleanLine.replace(/\*\*/g, '')}
                </p>
              );
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
