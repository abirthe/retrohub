import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const PageErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center selection:bg-primary/20">
      <div className="max-w-md w-full bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>
        
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            Something Went Wrong
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-3 bg-secondary/30 p-3 rounded-lg border border-white/5 font-mono text-left text-destructive/90 overflow-auto max-h-24">
            {errorMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={resetErrorBoundary}
            className="w-full sm:w-auto gradient-primary font-display text-xs tracking-wider gap-2 shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={() => { window.location.href = '/'; }}
            className="w-full sm:w-auto border-white/10 hover:bg-white/5 font-display text-xs tracking-wider gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={PageErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
};

export default AppErrorBoundary;
