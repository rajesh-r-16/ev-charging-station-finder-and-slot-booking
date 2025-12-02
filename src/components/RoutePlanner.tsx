import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Battery, Zap, DollarSign, Leaf, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RouteOption {
  id: string;
  mode: 'fastest' | 'cheapest' | 'lowest_carbon' | 'nearest_v2v';
  distance: number;
  duration: number;
  cost: number;
  carbon: number;
  chargingStops: number;
}

const RoutePlanner = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [currentSoC, setCurrentSoC] = useState(80);
  const [targetSoC, setTargetSoC] = useState(20);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  const calculateRoutes = async () => {
    if (!startLocation || !endLocation) {
      toast({
        title: "Missing Information",
        description: "Please enter start and end locations",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-route', {
        body: {
          startLocation,
          endLocation,
          currentSoc: currentSoC,
          targetSoc: targetSoC,
          optimizationModes: ['fastest', 'cheapest', 'lowest_carbon', 'nearest_v2v']
        }
      });

      if (error) throw error;

      if (data?.routes && data.routes.length > 0) {
        setRoutes(data.routes.map((r: any, i: number) => ({
          id: String(i + 1),
          mode: r.mode,
          distance: r.distance,
          duration: r.duration,
          cost: r.cost,
          carbon: r.carbonFootprint,
          chargingStops: r.chargingStops?.length || 0
        })));
        
        toast({
          title: "Routes Calculated",
          description: `Found ${data.routes.length} optimized routes with AI`
        });
      } else {
        toast({
          title: "No Routes Found",
          description: "Try different locations",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error calculating routes:', error);
      toast({
        title: "Error",
        description: "Failed to calculate routes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'fastest': return <Clock className="h-4 w-4" />;
      case 'cheapest': return <DollarSign className="h-4 w-4" />;
      case 'lowest_carbon': return <Leaf className="h-4 w-4" />;
      case 'nearest_v2v': return <Zap className="h-4 w-4" />;
      default: return <Navigation className="h-4 w-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'fastest': return 'bg-primary/10 text-primary border-primary/20';
      case 'cheapest': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'lowest_carbon': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'nearest_v2v': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Battery-Aware Route Planner
          </CardTitle>
          <CardDescription>
            Plan your journey with guaranteed SoC targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start"
                  placeholder="Enter starting point"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">Destination</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end"
                  placeholder="Enter destination"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSoC">Current Battery SoC (%)</Label>
              <Input
                id="currentSoC"
                type="number"
                min="0"
                max="100"
                value={currentSoC}
                onChange={(e) => setCurrentSoC(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetSoC">Minimum Arrival SoC (%)</Label>
              <Input
                id="targetSoC"
                type="number"
                min="0"
                max="100"
                value={targetSoC}
                onChange={(e) => setTargetSoC(Number(e.target.value))}
              />
            </div>
          </div>

          <Button onClick={calculateRoutes} disabled={loading} className="w-full">
            {loading ? 'Calculating...' : 'Calculate Optimal Routes'}
          </Button>

          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Route Options</h3>
              <div className="grid grid-cols-1 gap-4">
                {routes.map((route) => (
                  <Card 
                    key={route.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedRoute?.id === route.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedRoute(route)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className={getModeColor(route.mode)}>
                          {getModeIcon(route.mode)}
                          <span className="ml-1 capitalize">{route.mode.replace('_', ' ')}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {route.chargingStops} stops
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Distance</div>
                          <div className="font-semibold">{route.distance} km</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Duration</div>
                          <div className="font-semibold">{Math.floor(route.duration / 60)}h {route.duration % 60}m</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Cost</div>
                          <div className="font-semibold text-green-600">₹{route.cost}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Carbon</div>
                          <div className="font-semibold text-secondary">{route.carbon} kg</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRoute && (
                <Button 
                  className="w-full"
                  onClick={() => {
                    window.open(`https://www.google.com/maps/dir/${encodeURIComponent(startLocation)}/${encodeURIComponent(endLocation)}`, '_blank');
                    toast({
                      title: "Navigation Started",
                      description: `${selectedRoute.mode.replace('_', ' ')} route selected with ${selectedRoute.chargingStops} charging stops`
                    });
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Navigation
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutePlanner;