import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Zap, Search, SlidersHorizontal, Battery, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ChargingSlot {
  id: string;
  slot_number: number;
  status: string;
  connector_type: string;
  power_output_kw: number;
}

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  available_slots: number;
  total_slots: number;
  amenities: string[] | null;
  charging_slots?: ChargingSlot[];
}

interface UserLocation {
  lat: number;
  lng: number;
}

const EnhancedChargingStationMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    fetchStations();
    getUserLocation();
    
    const channel = supabase
      .channel('station-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'charging_stations'
      }, () => {
        fetchStations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAndSortStations();
  }, [stations, searchQuery, priceFilter, availabilityFilter, sortBy, userLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Location found",
            description: "Showing nearby charging stations",
          });
        },
        () => {
          toast({
            title: "Location unavailable",
            description: "Using default location.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const fetchStations = async () => {
    const { data, error } = await supabase
      .from('charging_stations')
      .select(`*, charging_slots (id, slot_number, status, connector_type, power_output_kw)`)
      .order('name');
    
    if (!error) setStations(data || []);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getStationDistance = (station: Station): number => {
    if (!userLocation) return 0;
    return calculateDistance(userLocation.lat, userLocation.lng, station.latitude, station.longitude);
  };

  const filterAndSortStations = () => {
    let filtered = [...stations];

    if (searchQuery) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (priceFilter !== "all") {
      filtered = filtered.filter(station => {
        const price = station.price_per_hour;
        if (priceFilter === "low") return price < 100;
        if (priceFilter === "medium") return price >= 100 && price < 150;
        if (priceFilter === "high") return price >= 150;
        return true;
      });
    }

    if (availabilityFilter !== "all") {
      filtered = filtered.filter(station => {
        if (availabilityFilter === "available") return station.available_slots > 0;
        if (availabilityFilter === "busy") return station.available_slots === 0;
        if (availabilityFilter === "limited") return station.available_slots > 0 && station.available_slots <= 2;
        return true;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === "distance" && userLocation) return getStationDistance(a) - getStationDistance(b);
      if (sortBy === "price-low") return a.price_per_hour - b.price_per_hour;
      if (sortBy === "price-high") return b.price_per_hour - a.price_per_hour;
      if (sortBy === "availability") return b.available_slots - a.available_slots;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    setFilteredStations(filtered);
  };

  const getStatusColor = (availableSlots: number) => {
    if (availableSlots === 0) return "destructive";
    if (availableSlots <= 2) return "warning";
    return "default";
  };

  const getStatusText = (availableSlots: number) => {
    if (availableSlots === 0) return "Full";
    if (availableSlots <= 2) return "Limited";
    return "Available";
  };

  const handleReserve = (stationId: string) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigate = (station: Station) => {
    window.open(`https://maps.google.com/maps?q=${station.latitude},${station.longitude}`, '_blank');
  };

  const openMapView = (station?: Station) => {
    if (station) {
      window.open(`https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}#map=15/${station.latitude}/${station.longitude}`, '_blank');
    } else if (userLocation) {
      window.open(`https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}#map=13/${userLocation.lat}/${userLocation.lng}`, '_blank');
    } else {
      window.open(`https://www.openstreetmap.org/#map=12/28.6139/77.2090`, '_blank');
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Find <span className="bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">Charging Stations</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover nearby charging stations with real-time availability
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => openMapView()}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Map
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">Under ₹100/hr</SelectItem>
                    <SelectItem value="medium">₹100 - ₹150/hr</SelectItem>
                    <SelectItem value="high">Over ₹150/hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Availability</label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stations</SelectItem>
                    <SelectItem value="available">Available Now</SelectItem>
                    <SelectItem value="limited">Limited Slots</SelectItem>
                    <SelectItem value="busy">Full/Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="availability">Most Available</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Button variant="outline" className="w-full" onClick={getUserLocation}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Station List */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold">Nearby Stations</h3>
          <Badge variant="secondary">{filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found</Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.length === 0 ? (
            <Card className="p-6 text-center col-span-full">
              <p className="text-muted-foreground">No stations found.</p>
              <Button variant="outline" className="mt-2" onClick={() => { setSearchQuery(""); setPriceFilter("all"); setAvailabilityFilter("all"); }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            filteredStations.map((station) => (
              <Card key={station.id} className={`p-6 cursor-pointer transition-all hover:shadow-lg border ${selectedStation === station.id ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]' : 'border-border/50 hover:border-primary/50'}`} onClick={() => setSelectedStation(station.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{station.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" />{station.address}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(station.available_slots) as any}>{getStatusText(station.available_slots)}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="p-2 rounded bg-muted/50">
                    <div className="font-bold text-primary">{station.available_slots}/{station.total_slots}</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <div className="font-bold text-electric-green">₹{station.price_per_hour}</div>
                    <div className="text-xs text-muted-foreground">Per Hour</div>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <div className="font-bold">{userLocation ? `${getStationDistance(station).toFixed(1)} km` : '--'}</div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                  </div>
                </div>

                {station.charging_slots && station.charging_slots.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {station.charging_slots.slice(0, 4).map((slot) => (
                        <Badge key={slot.id} variant={slot.status === 'available' ? 'default' : 'secondary'} className={slot.status === 'available' ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}>
                          {slot.connector_type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={(e) => { e.stopPropagation(); handleReserve(station.id); }}>Reserve</Button>
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleNavigate(station); }}><Navigation className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); openMapView(station); }}><MapPin className="h-4 w-4" /></Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default EnhancedChargingStationMap;
