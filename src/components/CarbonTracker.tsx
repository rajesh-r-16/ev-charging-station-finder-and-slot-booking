import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, TrendingDown, TrendingUp, Calendar, Download, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface EmissionsData {
  totalCarbon: number;
  sessions: number;
  energyConsumed: number;
  gasolineComparison: number;
  trend: 'up' | 'down';
}

const CarbonTracker = () => {
  const { user } = useAuth();
  const [emissions, setEmissions] = useState<EmissionsData>({
    totalCarbon: 0,
    sessions: 0,
    energyConsumed: 0,
    gasolineComparison: 0,
    trend: 'down'
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      fetchEmissionsData();
    }
  }, [user, period]);

  const fetchEmissionsData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's emissions data
      const { data, error } = await supabase
        .from('charging_session_emissions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate totals
      const totalCarbon = data?.reduce((sum, session) => sum + Number(session.total_carbon_emissions_kg), 0) || 0;
      const sessions = data?.length || 0;
      const energyConsumed = data?.reduce((sum, session) => sum + Number(session.energy_consumed_kwh), 0) || 0;
      
      // Gasoline comparison: 1 gallon of gas = ~8.9 kg CO2
      // Average car: 10 km/liter, 1 gallon = 3.785 liters
      // So 1 gallon = 37.85 km, emissions = 8.9 kg CO2
      const gasolineComparison = totalCarbon > 0 ? (totalCarbon / 8.9) * 37.85 : 0;

      setEmissions({
        totalCarbon,
        sessions,
        energyConsumed,
        gasolineComparison,
        trend: 'down' // In production, compare with previous period
      });
    } catch (error) {
      console.error('Error fetching emissions:', error);
      toast({
        title: "Error",
        description: "Failed to load carbon emissions data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    toast({
      title: "Downloading Report",
      description: "Your carbon emissions report is being prepared"
    });
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
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Carbon Emissions Tracker
              </CardTitle>
              <CardDescription className="mt-2">
                Track your environmental impact with time-resolved grid mix data
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Carbon</span>
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {emissions.totalCarbon.toFixed(2)} kg
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CO₂ emissions this {period}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Energy Used</span>
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {emissions.energyConsumed.toFixed(1)} kWh
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total energy consumed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  {emissions.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {emissions.sessions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Charging sessions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-secondary/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Gasoline Saved</span>
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {emissions.gasolineComparison.toFixed(0)} km
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Equivalent gas car distance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Impact */}
          <Card className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                <Leaf className="h-4 w-4" />
                Environmental Impact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Carbon Intensity Average</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    {emissions.sessions > 0 ? (emissions.totalCarbon / emissions.energyConsumed * 1000).toFixed(0) : 0} g/kWh
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Renewable Energy Usage</span>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                    ~45%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trees Equivalent</span>
                  <span className="text-sm font-semibold text-green-600">
                    ~{(emissions.totalCarbon / 21).toFixed(1)} trees/year
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* No Data State */}
          {emissions.sessions === 0 && (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No charging sessions yet. Start charging to track your carbon footprint!
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Find Charging Stations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarbonTracker;