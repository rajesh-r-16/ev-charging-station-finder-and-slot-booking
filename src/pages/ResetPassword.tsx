import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery session from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setStatus('ready');
    } else {
      // Listen for auth state change (Supabase processes the token)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setStatus('ready');
        }
      });

      // Give it a moment then check
      const timeout = setTimeout(() => {
        if (status === 'loading') {
          setStatus('ready'); // Allow form anyway in case the event was already processed
        }
      }, 2000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setStatus('error');
    } else {
      setStatus('success');
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });
      setTimeout(() => navigate('/dashboard'), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            EVCharger
          </h1>
        </div>

        <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle>
              {status === 'loading' && (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Verifying...
                </span>
              )}
              {status === 'ready' && 'Set New Password'}
              {status === 'success' && (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-electric-green" /> Password Updated
                </span>
              )}
              {status === 'error' && (
                <span className="flex items-center justify-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" /> Reset Failed
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {status === 'ready' && 'Enter your new password below'}
              {status === 'success' && 'Redirecting to dashboard...'}
              {status === 'error' && 'The reset link may have expired. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(status === 'ready' || status === 'loading') && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || status === 'loading'}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}

            {status === 'success' && (
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  Back to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
