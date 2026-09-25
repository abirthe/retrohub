import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import ShopHeader from '@/components/layout/ShopHeader';
import { Gamepad2, ArrowRight, Loader2 } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Auth = () => {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Determine destination after successful authentication
  const returnTo = (location.state as { from?: string } | null)?.from || searchParams.get('returnTo') || '/';

  // Automatically redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(returnTo, { replace: true });
    }
  }, [user, navigate, returnTo]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const [view, setView] = useState<'auth' | 'forgot_password'>('auth');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
      navigate(returnTo, { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your email for the password reset link.',
      });
      setView('auth');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, signupName);
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to verify your account.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
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
            <p className="text-muted-foreground">The premium marketplace for gamers.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 delay-100">
            <CardContent className="pt-6">
              {view === 'forgot_password' ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-center space-y-2 mb-4">
                    <h2 className="text-xl font-display font-semibold text-white">Reset Password</h2>
                    <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="hello@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-all text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 gradient-primary font-display tracking-wider relative group overflow-hidden" disabled={loading}>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      {loading ? 'Sending link...' : 'Send Reset Link'}
                    </Button>
                  </form>
                  <Button variant="ghost" onClick={() => setView('auth')} className="w-full mt-2 text-muted-foreground hover:text-white">
                    Back to Login
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20 font-medium tracking-wide flex items-center justify-center gap-3 transition-all shadow-sm group"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
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
                    )}
                    <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#151722] px-3 text-muted-foreground tracking-wider font-semibold">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50 mb-6">
                      <TabsTrigger value="login" className="font-display text-xs tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" className="font-display text-xs tracking-wider data-[state=active]:bg-accent/20 data-[state=active]:text-accent transition-all">Register</TabsTrigger>
                    </TabsList>

                <TabsContent value="login" className="space-y-4 focus-visible:outline-none">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="hello@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(loginEmail);
                            setView('forgot_password');
                          }}
                          className="text-[10px] text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-all text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 gradient-primary font-display tracking-wider relative group overflow-hidden" disabled={loading}>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 focus-visible:outline-none">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        className="bg-background/50 border-white/10 focus:border-accent/50 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="hello@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="bg-background/50 border-white/10 focus:border-accent/50 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-background/50 border-white/10 focus:border-accent/50 transition-all text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wider relative group overflow-hidden" disabled={loading}>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Protected by reCAPTCHA and subject to the Privacy Policy and Terms of Service.
            <br />
            © 2026 RETROHUB. Dev by <span className="text-primary font-semibold">ABIR HOSSAIN</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
