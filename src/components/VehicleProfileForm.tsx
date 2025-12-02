import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Battery, Zap, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface VehicleProfile {
  id?: string;
  vehicle_model: string;
  battery_capacity_kwh: number;
  max_charging_rate_kw: number;
  current_soc_percent: number;
  connector_types: string[];
  avg_consumption_kwh_per_km: number;
}

const VehicleProfileForm = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VehicleProfile>({
    vehicle_model: '',
    battery_capacity_kwh: 60,
    max_charging_rate_kw: 50,
    current_soc_percent: 80,
    connector_types: ['Type2'],
    avg_consumption_kwh_per_km: 0.15
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVehicleProfile();
    }
  }, [user]);

  const fetchVehicleProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicle_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setHasProfile(true);
      }
    } catch (error) {
      console.error('Error fetching vehicle profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profile.vehicle_model) {
      toast({
        title: "Missing Information",
        description: "Please enter your vehicle model",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      if (hasProfile && profile.id) {
        const { error } = await supabase
          .from('vehicle_profiles')
          .update({
            vehicle_model: profile.vehicle_model,
            battery_capacity_kwh: profile.battery_capacity_kwh,
            max_charging_rate_kw: profile.max_charging_rate_kw,
            current_soc_percent: profile.current_soc_percent,
            connector_types: profile.connector_types,
            avg_consumption_kwh_per_km: profile.avg_consumption_kwh_per_km
          })
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicle_profiles')
          .insert({
            user_id: user.id,
            vehicle_model: profile.vehicle_model,
            battery_capacity_kwh: profile.battery_capacity_kwh,
            max_charging_rate_kw: profile.max_charging_rate_kw,
            current_soc_percent: profile.current_soc_percent,
            connector_types: profile.connector_types,
            avg_consumption_kwh_per_km: profile.avg_consumption_kwh_per_km
          });

        if (error) throw error;
        setHasProfile(true);
      }

      toast({
        title: "Success",
        description: "Vehicle profile saved successfully"
      });

      fetchVehicleProfile();
    } catch (error: any) {
      console.error('Error saving vehicle profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save vehicle profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Vehicle Profile
        </CardTitle>
        <CardDescription>
          {hasProfile ? 'Update your vehicle details' : 'Add your vehicle to use V2V and V2G features'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_model">Vehicle Model *</Label>
              <Input
                id="vehicle_model"
                placeholder="e.g., Tesla Model 3"
                value={profile.vehicle_model}
                onChange={(e) => setProfile({ ...profile, vehicle_model: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="battery_capacity">Battery Capacity (kWh)</Label>
              <Input
                id="battery_capacity"
                type="number"
                placeholder="60"
                value={profile.battery_capacity_kwh}
                onChange={(e) => setProfile({ ...profile, battery_capacity_kwh: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_charging_rate">Max Charging Rate (kW)</Label>
              <Input
                id="max_charging_rate"
                type="number"
                placeholder="50"
                value={profile.max_charging_rate_kw}
                onChange={(e) => setProfile({ ...profile, max_charging_rate_kw: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_soc">Current Battery Level (%)</Label>
              <Input
                id="current_soc"
                type="number"
                min="0"
                max="100"
                placeholder="80"
                value={profile.current_soc_percent}
                onChange={(e) => setProfile({ ...profile, current_soc_percent: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="connector_type">Connector Type</Label>
              <Select 
                value={profile.connector_types[0]} 
                onValueChange={(value) => setProfile({ ...profile, connector_types: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connector type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Type2">Type 2 (AC)</SelectItem>
                  <SelectItem value="CCS">CCS (DC Fast)</SelectItem>
                  <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                  <SelectItem value="Tesla">Tesla Supercharger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avg_consumption">Avg Consumption (kWh/km)</Label>
              <Input
                id="avg_consumption"
                type="number"
                step="0.01"
                placeholder="0.15"
                value={profile.avg_consumption_kwh_per_km}
                onChange={(e) => setProfile({ ...profile, avg_consumption_kwh_per_km: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : hasProfile ? 'Update Profile' : 'Create Profile'}
            </Button>
            {hasProfile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Battery className="h-4 w-4" />
                Vehicle profile active
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleProfileForm;
