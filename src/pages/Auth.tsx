import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Shield, Zap } from "lucide-react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { SignUpSuccess } from "@/components/auth/SignUpSuccess";

const Auth = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  if (signUpSuccess) {
    return <SignUpSuccess onBack={() => setSignUpSuccess(false)} />;
  }

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

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
          <p className="text-muted-foreground">Your EV charging companion</p>
        </div>

        <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <SignInForm
                  onSuccess={() => navigate("/dashboard")}
                  onForgotPassword={() => setShowForgotPassword(true)}
                />
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <SignUpForm onSuccess={() => setSignUpSuccess(true)} />
              </TabsContent>
            </Tabs>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <Car className="h-4 w-4 text-primary" />
                <span>EV Ready</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Zap className="h-4 w-4 text-primary" />
                <span>Fast Booking</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure</span>
              </div>
            </div>

            <div className="mt-6 text-center border-t pt-4">
              <Link to="/admin-auth" className="text-sm text-primary hover:underline">
                Are you a station owner? Register here →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
