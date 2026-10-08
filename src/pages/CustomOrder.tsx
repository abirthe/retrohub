import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShopHeader } from "@/components/layout";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  CustomOrderSuccess,
  PlatformSelector,
} from "@/components/custom-order";
import { submitCustomOrder } from "@/lib/customOrderApi";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const ROTATING_WORDS = ["Order", "Game Key", "Support", "Subscription"];
const POPULAR_PLATFORMS = [
  "Steam",
  "Epic Games",
  "PlayStation",
  "Xbox",
  "Nintendo",
  "Riot Games",
  "EA App",
  "Mobile",
];

const CustomOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    productName: string;
    platform: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    productName: "",
    platform: "",
    details: "",
  });

  // Auto-fill from authenticated user profile
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name:
          prev.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectPlatform = (platform: string) => {
    setFormData((prev) => ({ ...prev, platform }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.productName.trim() ||
      !formData.platform.trim()
    ) {
      toast({
        title: "Required Fields Missing",
        description:
          "Please fill in your name, email, product name, and platform.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await submitCustomOrder(formData);
      queryClient.invalidateQueries({ queryKey: ["admin-custom-orders"] });

      setSubmittedData({
        name: formData.name,
        email: formData.email,
        productName: formData.productName,
        platform: formData.platform,
      });

      toast({
        title: "Request Submitted! 🎮",
        description:
          "Our sourcing team has been notified. We will reach out to you via email shortly.",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Submission Failed",
        description: message || "Something went wrong. Please try again.",
        variant: "destructive",
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
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setIsVisible(true);
      }, 250);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-primary/20 flex flex-col pb-16">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <ShopHeader />

      <div className="container relative z-10 flex-1 py-8 sm:py-12 max-w-3xl flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            className="font-display text-xs tracking-wider text-muted-foreground hover:text-white p-0 h-auto hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>

          <a
            href="https://t.me/retrochanbot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20"
          >
            <Send className="w-3 h-3 rotate-45" />
            <span>Chat via Telegram</span>
            <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
          </a>
        </div>

        {submittedData ? (
          <CustomOrderSuccess
            data={submittedData}
            onReset={() => {
              setSubmittedData(null);
              setFormData((prev) => ({
                ...prev,
                productName: "",
                platform: "",
                details: "",
              }));
            }}
          />
        ) : (
          /* Request Form */
          <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-black/50">
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-wider text-white flex items-center justify-center flex-wrap gap-x-2">
                <span>Request Custom</span>
                <span
                  className={cn(
                    "inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-accent transition-all duration-300 transform",
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 -translate-y-2 scale-95",
                  )}
                >
                  {ROTATING_WORDS[wordIndex]}
                </span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
                Can't find the game, subscription, or top-up you're looking for?
                Submit your request below. We source directly from authorized
                digital distributors at wholesale rates with rapid 15–60 minute
                turnaround, exclusive bKash payment, and 100% valid key
                guarantees.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Email Address (for quote & delivery)
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="productName"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Product / Game / Subscription
                  </Label>
                  <Input
                    id="productName"
                    name="productName"
                    required
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="e.g. Monster Hunter Wilds, Discord Nitro"
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="platform"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Platform / Region
                  </Label>
                  <Input
                    id="platform"
                    name="platform"
                    required
                    value={formData.platform}
                    onChange={handleChange}
                    placeholder="e.g. Steam Global, PSN Turkey, Xbox"
                    className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors h-11"
                  />
                </div>
              </div>

              {/* Quick Select Platform Chips */}
              <PlatformSelector
                platforms={POPULAR_PLATFORMS}
                selectedPlatform={formData.platform}
                onSelectPlatform={handleSelectPlatform}
              />

              <div className="space-y-2">
                <Label
                  htmlFor="details"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Additional Details (Optional)
                </Label>
                <Textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="Edition (Deluxe / Standard), target budget, or specific region requirements..."
                  className="min-h-[110px] bg-background/50 border-white/10 focus:border-primary/50 transition-colors resize-none text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-xs tracking-widest uppercase font-bold gradient-primary hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Custom Request
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomOrder;
