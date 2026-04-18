import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";

interface SignUpSuccessProps {
  onBack: () => void;
}

export const SignUpSuccess = ({ onBack }: SignUpSuccessProps) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
    <Card className="w-full max-w-md border-0 shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-electric-green/10 rounded-full mb-4 mx-auto">
          <Mail className="h-8 w-8 text-electric-green" />
        </div>
        <CardTitle>Check Your Email</CardTitle>
        <CardDescription>
          We've sent a verification link to your email address. Please click the link to verify your account before signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">What to do next:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              Open your email inbox
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              Click the verification link in the email
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              Come back here and sign in
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Didn't receive an email? Check your spam folder or try signing up again.
        </p>
        <Button variant="outline" className="w-full" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Button>
      </CardContent>
    </Card>
  </div>
);
