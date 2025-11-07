import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('error');
        setMessage('Please log in to verify your email');
        return;
      }

      // Verify the token matches
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('verification_token')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !profile) {
        setStatus('error');
        setMessage('Unable to verify email. Please try again.');
        return;
      }

      if (profile.verification_token !== token) {
        setStatus('error');
        setMessage('Invalid or expired verification link');
        return;
      }

      // Update verification status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_verified: true,
          verified_at: new Date().toISOString(),
          verification_token: null
        })
        .eq('user_id', user.id);

      if (updateError) {
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
        return;
      }

      setStatus('success');
      setMessage('Your email has been successfully verified!');

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
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
            <CardTitle className="flex items-center justify-center gap-2">
              {status === 'verifying' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
              <span>
                {status === 'verifying' && 'Verifying Email...'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {message}
            </p>

            {status === 'success' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard in 3 seconds...
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard Now
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                  Back to Login
                </Button>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
