import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShopHeader } from '@/components/layout';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { submitCustomOrder } from '@/lib/shopApi';
import { cn } from '@/lib/utils';

const ROTATING_WORDS = ['Order', 'Support'];

const CustomOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    productName: '',
    platform: '',
    details: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await submitCustomOrder(formData);
      
      toast({
        title: "Request Submitted!",
        description: "We have received your custom order request. Our team will contact you shortly via email.",
      });
      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Submission Failed",
        description: message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setWordIndex(prev => (prev + 1) % ROTATING_WORDS.length);
        setIsVisible(true);
      }, 250);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-primary/20 flex flex-col">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <ShopHeader />
      
      <div className="container relative z-10 flex-1 py-8 sm:py-16 max-w-3xl flex flex-col">
        <Button
          variant="ghost"
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
          className="font-display text-xs tracking-wider text-muted-foreground hover:text-white self-start mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Store
        </Button>

        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-black/50">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-wider text-white flex items-center justify-center flex-wrap gap-x-2">
              <span>Request Custom</span>
              <span
                className={cn(
                  'inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-accent transition-all duration-300 transform',
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-2 scale-95'
                )}
              >
                {ROTATING_WORDS[wordIndex]}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-md">
              Can't find the game or top-up you're looking for? Let us know what you need, and we'll get it for you at the best price.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">Your Name</Label>
                <Input 
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-muted-foreground">Product / Game Name</Label>
                <Input 
                  id="productName"
                  name="productName"
                  required
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="e.g. Call of Duty: Black Ops 6"
                  className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-muted-foreground">Platform / Region</Label>
                <Input 
                  id="platform"
                  name="platform"
                  required
                  value={formData.platform}
                  onChange={handleChange}
                  placeholder="e.g. Steam / Global"
                  className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-muted-foreground">Additional Details (Optional)</Label>
              <Textarea 
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Any specific edition, version, or quantity you're looking for?"
                className="min-h-[120px] bg-background/50 border-white/10 focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-sm tracking-widest uppercase font-bold gradient-primary hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomOrder;
