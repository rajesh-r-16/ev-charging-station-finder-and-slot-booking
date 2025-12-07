import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Car, Phone, Mail, Save, CheckCircle, Send, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  vehicle_model: string;
  vehicle_number: string;
  email_verified: boolean;
  verified_at: string | null;
}

const ProfileSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    vehicle_model: '',
    vehicle_number: '',
    email_verified: false,
    verified_at: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          vehicle_model: data.vehicle_model || '',
          vehicle_number: data.vehicle_number || '',
          email_verified: data.email_verified || false,
          verified_at: data.verified_at
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user?.email || ''
        }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          vehicle_model: profile.vehicle_model,
          vehicle_number: profile.vehicle_number
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSendVerificationEmail = async () => {
    if (!user) return;
    
    try {
      setSendingEmail(true);
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: user.email,
          user_id: user.id,
          origin_url: window.location.origin
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!user || !profile.phone) {
      toast({
        title: "Error",
        description: "Please enter a phone number first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSendingOTP(true);
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: {
          phone: profile.phone,
          user_id: user.id
        }
      });

      if (error) throw error;

      setShowOTPInput(true);
      toast({
        title: "OTP Sent",
        description: data.demo_otp 
          ? `Demo OTP: ${data.demo_otp} (Check console for production setup)`
          : "Please check your phone for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!user || !otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setVerifyingOTP(true);
      const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
        body: {
          otp: otp,
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Phone Verified",
          description: "Your phone number has been successfully verified!",
        });
        setShowOTPInput(false);
        setOtp('');
        fetchProfile(); // Refresh profile data
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid OTP code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Verification Status Section */}
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account Verification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Verification */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email</span>
                </div>
                {profile.email_verified ? (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {!profile.email_verified && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendVerificationEmail}
                  disabled={sendingEmail}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingEmail ? "Sending..." : "Send Verification Email"}
                </Button>
              )}
            </div>

            {/* Phone Verification */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Phone</span>
                </div>
                {profile.verified_at ? (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.phone || "No phone number added"}
              </p>
              {profile.phone && !profile.verified_at && !showOTPInput && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendPhoneOTP}
                  disabled={sendingOTP}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingOTP ? "Sending..." : "Send OTP"}
                </Button>
              )}
              {showOTPInput && (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="bg-background/50"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleVerifyPhoneOTP}
                    disabled={verifyingOTP}
                    className="w-full"
                  >
                    {verifyingOTP ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="bg-background/50"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_model" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Model
              </Label>
              <Input
                id="vehicle_model"
                value={profile.vehicle_model}
                onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                placeholder="e.g., Tesla Model 3"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vehicle_number" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Number
              </Label>
              <Input
                id="vehicle_number"
                value={profile.vehicle_number}
                onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                placeholder="e.g., ABC-1234"
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;