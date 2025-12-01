import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Battery, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const V2GEnrollment = () => {
  const [vehicleProfiles, setVehicleProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [availableCapacity, setAvailableCapacity] = useState(20);
  const [maxDischargeRate, setMaxDischargeRate] = useState(10);
  const [minBatteryReserve, setMinBatteryReserve] = useState(20);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicleProfiles();
  }, []);

  const fetchVehicleProfiles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('vehicle_profiles')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setVehicleProfiles(data);
      if (data.length > 0) setSelectedProfile(data[0].id);
    }
  };

  const handleEnroll = async () => {
    if (!selectedProfile) {
      toast({
        title: "Missing Information",
        description: "Please select a vehicle profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enroll-v2g', {
        body: {
          vehicleProfileId: selectedProfile,
          availableCapacity,
          maxDischargeRate,
          minBatteryReserve,
          participationHours: {
            weekdays: ['00:00-24:00'],
            weekends: ['00:00-24:00']
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You're now enrolled in the V2G program!",
      });
    } catch (error) {
      console.error('V2G enrollment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in V2G",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Battery className="h-5 w-5" />
          V2G Enrollment
        </CardTitle>
        <CardDescription>
          Enroll your vehicle to sell energy back to the grid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {vehicleProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Please create a vehicle profile first in your settings
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {vehicleProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.vehicle_model} - {profile.battery_capacity_kwh} kWh
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Available Capacity (kWh)</Label>
              <Input
                type="number"
                value={availableCapacity}
                onChange={(e) => setAvailableCapacity(parseFloat(e.target.value))}
                min={1}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Discharge Rate (kW)</Label>
              <Input
                type="number"
                value={maxDischargeRate}
                onChange={(e) => setMaxDischargeRate(parseFloat(e.target.value))}
                min={1}
                max={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Battery Reserve (%)</Label>
              <Input
                type="number"
                value={minBatteryReserve}
                onChange={(e) => setMinBatteryReserve(parseFloat(e.target.value))}
                min={10}
                max={80}
              />
            </div>

            <Button
              onClick={handleEnroll}
              disabled={loading}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              {loading ? 'Enrolling...' : 'Enroll in V2G'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default V2GEnrollment;
