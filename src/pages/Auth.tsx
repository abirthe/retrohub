import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ShopHeader from '@/components/layout/ShopHeader';
import { Gamepad2, Loader2, ShieldCheck, Zap, KeyRound } from 'lucide-react';
import heroBg from '@/assets/hero-bg.webp';

/** Only allow same-origin relative paths to prevent open-redirect attacks. */
const sanitiseReturnTo = (url: string | null | undefined): string => {
  if (!url) return '/';
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/';
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    // url was already a relative path
    return url.startsWith('/') ? url : '/';
  }
};

const Auth = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sanitise destination to prevent open-redirect attacks
  const returnTo = sanitiseReturnTo(
    (location.state as { from?: string } | null)?.from ?? searchParams.get('returnTo')
  );

  // Redirect if already signed in — runs synchronously on the same tick
  // that loading flips to false, preventing a frame of auth UI from flashing
  useEffect(() => {
    if (!loading && user) {
      navigate(returnTo, { replace: true });
    }
  }, [user, loading, navigate, returnTo]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(returnTo);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      toast({ title: 'Google Sign In Failed', description: message, variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  // Don't render the page at all until we know if the user is signed in.
  // This prevents the login card from flashing for already-authenticated users.
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-[0.05]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
      </div>

      <div className="relative z-10">
        <ShopHeader />
      </div>

      <div className="flex-1 container flex items-center justify-center py-16 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30 mb-6">
              <Gamepad2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">RETROHUB</span>
            </h1>
            <p className="text-muted-foreground text-sm">Sign in with your Google account to access your instant codes and orders.</p>
          </div>

          <Card className="bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 delay-100 overflow-hidden">
            <CardContent className="pt-8 pb-8 px-6 sm:px-8 space-y-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border-white/15 hover:border-primary/40 font-medium tracking-wide flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-primary/20 group relative overflow-hidden text-sm"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 duration-200" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="font-display font-semibold tracking-wide">Continue with Google</span>
                  </>
                )}
              </Button>

              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Secure 256-bit OAuth authentication — no password to remember</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary shrink-0" />
                  <span>Instant access to purchased game keys, gift cards & top-ups</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <KeyRound className="w-4 h-4 text-accent shrink-0" />
                  <span>Automatic verification and real-time order tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground space-y-1">
            <span>
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
            <br />
            <span>
              © 2026 RETROHUB. Dev by <span className="text-primary font-semibold">ABIR HOSSAIN</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
