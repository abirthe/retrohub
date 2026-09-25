import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ghost, ArrowLeft, Home } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-[0.05] grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <Ghost className="w-32 h-32 text-muted-foreground stroke-[1] animate-float relative z-10" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary/50 to-white/90">
            404
          </h1>
          <p className="font-display text-2xl tracking-wider text-white">
            Page Not Found
          </p>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The requested page has been moved, deleted, or never existed in this dimension.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-white/10 hover:bg-white/5 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="gradient-primary gap-2 shadow-lg shadow-primary/20"
          >
            <Home className="w-4 h-4" /> Home Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
