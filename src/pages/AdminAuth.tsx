import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Shield, MapPin, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .in('role', ['admin', 'station_owner'])
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return;
    }

    if (roleData?.approved) {
      navigate('/station-owner');
    } else if (roleData && !roleData.approved) {
      setPendingApproval(true);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    if (!error) {
      // Check role after sign in
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', signedInUser.id)
          .in('role', ['admin', 'station_owner'])
          .maybeSingle();

        if (roleData?.approved) {
          navigate('/station-owner');
        } else if (roleData) {
          setPendingApproval(true);
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have station owner privileges. Please register as a station owner first.",
            variant: "destructive",
          });
        }
      }
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const businessName = formData.get('businessName') as string;
    const phone = formData.get('phone') as string;

    const { error } = await signUp(email, password, fullName);
    
    if (!error) {
      // Wait for auth state to update
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser) {
        // Request station_owner role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.id,
            role: 'station_owner',
            approved: false
          });

        if (roleError) {
          console.error('Error requesting role:', roleError);
        }

        // Update profile with business info
        await supabase
          .from('profiles')
          .update({ phone })
          .eq('user_id', newUser.id);

        toast({
          title: "Registration Submitted",
          description: "Your station owner application has been submitted for review. You'll be notified once approved.",
        });
        
        setPendingApproval(true);
      }
    }
    setIsLoading(false);
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-charging-amber/10 rounded-full mb-4 mx-auto">
              <Clock className="h-8 w-8 text-charging-amber" />
            </div>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>
              Your station owner application is under review. Our team will verify your details and approve your account within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">What happens next?</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Our team verifies your business details
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  You'll receive email confirmation once approved
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Start registering your charging stations
                </li>
              </ul>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">
            Station Owner Portal
          </h1>
          <p className="text-muted-foreground">Register and manage your charging stations</p>
        </div>

        <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle>Station Owner Access</CardTitle>
            <CardDescription>Sign in or register as a charging station owner</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In as Station Owner"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Your full name"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-business">Business Name</Label>
                    <Input
                      id="signup-business"
                      name="businessName"
                      type="text"
                      placeholder="Your charging business name"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Apply as Station Owner"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Applications are reviewed within 24-48 hours
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Add Stations</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Manage Slots</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure Access</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/auth" className="text-sm text-primary hover:underline">
                Not a station owner? Sign in as user →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuth;