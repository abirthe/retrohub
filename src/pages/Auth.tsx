import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import ShopHeader from '@/components/layout/ShopHeader';
import { Gamepad2, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address in the field above first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your email for the password reset link.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
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
                          onClick={handleForgotPassword}
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
