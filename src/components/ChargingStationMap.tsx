import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Filter, Zap, Clock, Star } from "lucide-react";

// Mock data for charging stations
const mockStations = [
  {
    id: 1,
    name: "Tesla Supercharger - City Center",
    address: "123 Main St, Downtown",
    distance: "0.5 km",
    availableSlots: 4,
    totalSlots: 8,
    chargingSpeed: "150 kW",
    price: "$0.35/kWh",
    rating: 4.8,
    type: "DC Fast",
    status: "available"
  },
  {
    id: 2,
    name: "ChargePoint Station - Mall Plaza",
    address: "456 Shopping Blvd",
    distance: "1.2 km",
    availableSlots: 2,
    totalSlots: 6,
    chargingSpeed: "50 kW",
    price: "$0.28/kWh",
    rating: 4.5,
    type: "DC Fast",
    status: "available"
  },
  {
    id: 3,
    name: "EVgo Charging Hub - Airport",
    address: "789 Airport Rd",
    distance: "2.8 km",
    availableSlots: 0,
    totalSlots: 12,
    chargingSpeed: "350 kW",
    price: "$0.42/kWh",
    rating: 4.9,
    type: "Ultra Fast",
    status: "busy"
  },
  {
    id: 4,
    name: "Electrify America - Highway Rest",
    address: "321 Highway 101",
    distance: "5.1 km",
    availableSlots: 8,
    totalSlots: 10,
    chargingSpeed: "150 kW",
    price: "$0.38/kWh",
    rating: 4.3,
    type: "DC Fast",
    status: "available"
  }
];

const ChargingStationMap = () => {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  const getStatusColor = (status: string, availableSlots: number) => {
    if (status === "busy" || availableSlots === 0) return "destructive";
    if (availableSlots <= 2) return "warning";
    return "success";
  };

  const getStatusText = (status: string, availableSlots: number) => {
    if (status === "busy" || availableSlots === 0) return "Full";
    if (availableSlots <= 2) return "Limited";
    return "Available";
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Find <span className="bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">Charging Stations</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover nearby charging stations with real-time availability and instant booking
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map Placeholder */}
          <div className="relative">
            <Card className="h-[600px] bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-electric-blue/5 to-electric-green/5" />
              
              {/* Map controls */}
              <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
                <Button variant="secondary" size="sm">
                  <Navigation className="h-4 w-4 mr-2" />
                  My Location
                </Button>
                <Button variant="secondary" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Interactive map area */}
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium mb-2">Interactive Map</p>
                  <p className="text-muted-foreground">
                    Real-time charging station locations
                  </p>
                </div>
              </div>

              {/* Map markers simulation */}
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-primary rounded-full animate-ping" />
              <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-electric-green rounded-full animate-ping delay-300" />
              <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-electric-amber rounded-full animate-ping delay-700" />
            </Card>
          </div>

          {/* Station List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">Nearby Stations</h3>
              <Badge variant="secondary" className="text-sm">
                {mockStations.length} stations found
              </Badge>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {mockStations.map((station) => (
                <Card 
                  key={station.id}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border ${
                    selectedStation === station.id 
                      ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedStation(selectedStation === station.id ? null : station.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">{station.name}</h4>
                      <p className="text-muted-foreground text-sm mb-2">{station.address}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {station.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-electric-amber text-electric-amber" />
                          {station.rating}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusColor(station.status, station.availableSlots) as any}
                      className="ml-4"
                    >
                      {getStatusText(station.status, station.availableSlots)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-secondary/50 rounded-lg">
                      <div className="text-lg font-semibold text-primary">
                        {station.availableSlots}/{station.totalSlots}
                      </div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded-lg">
                      <div className="text-lg font-semibold text-electric-blue">
                        {station.chargingSpeed}
                      </div>
                      <div className="text-xs text-muted-foreground">Max Speed</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {station.type}
                      </Badge>
                      <span className="text-sm font-medium text-electric-green">
                        {station.price}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Reserve
                      </Button>
                      <Button variant="electric" size="sm">
                        <Zap className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChargingStationMap;