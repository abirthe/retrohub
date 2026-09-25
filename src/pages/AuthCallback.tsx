import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, KeyRound } from 'lucide-react';
import ShopHeader from '@/components/layout/ShopHeader';
import heroBg from '@/assets/hero-bg.jpg';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'recovery'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for error in hash or query params (Supabase standard behavior)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      const authError = hashParams.get('error_description') || hashParams.get('error') || searchParams.get('error_description') || searchParams.get('error');
      const type = hashParams.get('type') || searchParams.get('type');
      const code = searchParams.get('code');
      const returnTo = searchParams.get('returnTo') || '/';

      if (authError) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(authError.replace(/\+/g, ' ')));
        return;
      }

      // If this is a password recovery link
      if (type === 'recovery') {
        setStatus('recovery');
        return;
      }

      // If PKCE auth code is present, exchange for session
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // Fall back to getSession if already handled
        }
      }

      // Check current session to see if verification succeeded
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      // Listen for the PASSWORD_RECOVERY event just in case it fires
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setStatus('recovery');
        } else if (event === 'SIGNED_IN') {
          setStatus('success');
          setTimeout(() => {
            navigate(returnTo);
          }, 2000);
        }
      });

      // If we already have a session and no specific recovery type, assume success
      if (session && type !== 'recovery') {
        setStatus('success');
        setTimeout(() => {
          navigate(returnTo);
        }, 2000);
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    handleAuthCallback();
  }, [navigate]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated. You are now logged in.',
      });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while updating password';
      toast({
        title: 'Error updating password',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
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

      <div className="flex-1 container flex items-center justify-center py-16 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="w-full max-w-md glass border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
          
          {status === 'loading' && (
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h3 className="text-xl font-display font-semibold text-foreground">Verifying your request...</h3>
              <p className="text-muted-foreground text-sm">Please wait a moment while we confirm your details.</p>
            </CardContent>
          )}

          {status === 'success' && (
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-2 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">Verification Successful</h3>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                Your email has been successfully verified. You are being redirected to the homepage...
              </p>
              <Button 
                className="mt-6 w-full" 
                onClick={() => navigate('/')}
              >
                Go to Homepage now
              </Button>
            </CardContent>
          )}

          {status === 'error' && (
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-2 animate-in zoom-in duration-500">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">Verification Failed</h3>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                {errorMessage || "The verification link may have expired or is invalid. Please try requesting a new one."}
              </p>
              <Button 
                variant="outline" 
                className="mt-6 w-full border-primary/30 hover:bg-primary/10" 
                onClick={() => navigate('/auth')}
              >
                Back to Login
              </Button>
            </CardContent>
          )}

          {status === 'recovery' && (
            <>
              <CardHeader className="text-center space-y-2 pb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display text-white">Reset Password</CardTitle>
                <CardDescription>
                  Please enter your new password below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background/50 border-white/10 focus:border-primary/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

        </Card>
      </div>
    </div>
  );
}
