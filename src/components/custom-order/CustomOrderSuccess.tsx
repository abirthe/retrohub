import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface CustomOrderSuccessData {
  name: string;
  email: string;
  productName: string;
  platform: string;
}

interface CustomOrderSuccessProps {
  data: CustomOrderSuccessData;
  onReset: () => void;
}

export const CustomOrderSuccess: React.FC<CustomOrderSuccessProps> = ({
  data,
  onReset,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl shadow-black/50 text-center space-y-6 animate-in fade-in zoom-in-95 duration-400">
      <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-white">
          Request <span className="text-primary">Received!</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Thank you,{" "}
          <span className="text-foreground font-semibold">
            {data.name}
          </span>
          . Our sourcing specialists are actively hunting for your
          requested product:
        </p>
      </div>

      <div className="p-4 rounded-xl bg-background/50 border border-white/5 max-w-md mx-auto text-left space-y-2 text-xs">
        <div className="flex justify-between border-b border-white/5 pb-1.5">
          <span className="text-muted-foreground">Item:</span>
          <span className="font-bold text-foreground">
            {data.productName}
          </span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1.5">
          <span className="text-muted-foreground">
            Platform / Region:
          </span>
          <span className="font-mono text-primary">
            {data.platform}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Contact Email:</span>
          <span className="text-foreground font-mono">
            {data.email}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        We typically verify inventory pricing and reply within{" "}
        <span className="text-primary font-medium">15–60 minutes</span>.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full sm:w-auto font-display text-xs tracking-wider border-white/10"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-2" />
          Submit Another Request
        </Button>

        <Button
          onClick={() => navigate("/orders")}
          className="w-full sm:w-auto gradient-primary font-display text-xs tracking-wider shadow-lg shadow-primary/20"
        >
          Open Customer Console
        </Button>
      </div>
    </div>
  );
};
