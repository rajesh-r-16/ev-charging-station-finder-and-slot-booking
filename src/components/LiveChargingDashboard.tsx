import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Battery, Zap, MapPin, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChargingSlot {
  id: string;
  slot_number: number;
  status: string;
  connector_type: string;
  power_output_kw: number;
  last_status_update: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  available_slots: number;
  total_slots: number;
  charging_slots: ChargingSlot[];
}

const LiveChargingDashboard = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStations = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from("charging_stations")
        .select(`
          *,
          charging_slots (*)
        `)
        .order("name");

      if (error) throw error;

      setStations(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching stations:", error);
      toast({
        title: "Error",
        description: "Failed to load charging station data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStations();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStations, 10000);

    // Set up real-time subscription
    const channel = supabase
      .channel("charging-slots-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "charging_slots",
        },
        () => {
          fetchStations();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-success/20 text-success border-success/30";
      case "occupied":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "charging":
        return "bg-warning/20 text-warning border-warning/30";
      case "maintenance":
        return "bg-muted text-muted-foreground border-muted-foreground/30";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "charging":
        return <Zap className="w-3 h-3 animate-pulse" />;
      case "available":
        return <Battery className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTotalStats = () => {
    const total = stations.reduce((acc, station) => {
      const slots = station.charging_slots || [];
      return {
        total: acc.total + slots.length,
        available: acc.available + slots.filter(s => s.status === "available").length,
        charging: acc.charging + slots.filter(s => s.status === "charging").length,
        occupied: acc.occupied + slots.filter(s => s.status === "occupied").length,
        maintenance: acc.maintenance + slots.filter(s => s.status === "maintenance").length,
      };
    }, { total: 0, available: 0, charging: 0, occupied: 0, maintenance: 0 });
    return total;
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 bg-background">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">
              Live Charging Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">Real-time status of all charging points</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-4 pb-4">
              <div className="text-xl font-bold text-success">{stats.available}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="pt-4 pb-4">
              <div className="text-xl font-bold text-warning">{stats.charging}</div>
              <div className="text-xs text-muted-foreground">Charging</div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4 pb-4">
              <div className="text-xl font-bold text-destructive">{stats.occupied}</div>
              <div className="text-xs text-muted-foreground">Occupied</div>
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/30 bg-muted/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-xl font-bold text-muted-foreground">{stats.maintenance}</div>
              <div className="text-xs text-muted-foreground">Maintenance</div>
            </CardContent>
          </Card>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stations.map((station) => (
            <Card key={station.id} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{station.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{station.address}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {station.available_slots}/{station.total_slots} Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {station.charging_slots?.map((slot) => (
                    <div
                      key={slot.id}
                      className={`
                        p-4 rounded-lg border transition-all
                        ${getStatusColor(slot.status)}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Point {slot.slot_number}</span>
                        {getStatusIcon(slot.status)}
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>{slot.power_output_kw}kW</span>
                        </div>
                        <div className="font-medium uppercase text-xs">
                          {slot.connector_type}
                        </div>
                        <div className="capitalize text-xs opacity-90">
                          {slot.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveChargingDashboard;
