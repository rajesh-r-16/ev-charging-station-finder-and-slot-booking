import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Car, Phone, Mail, Save } from 'lucide-react';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  vehicle_model: string;
  vehicle_number: string;
}

const ProfileSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    vehicle_model: '',
    vehicle_number: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          vehicle_number: data.vehicle_number || ''
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