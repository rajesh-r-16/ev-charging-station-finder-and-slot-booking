import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Filter, Zap, Clock, Star, Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const EnhancedChargingStationMap = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStations();
    
    // Set up real-time subscription for station updates
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
  }, [stations, searchQuery, priceFilter, availabilityFilter, sortBy]);

  const fetchStations = async () => {
    const { data, error } = await supabase
      .from('charging_stations')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching stations:', error);
      return;
    }
    
    setStations(data || []);
  };

  const filterAndSortStations = () => {
    let filtered = [...stations];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter(station => {
        const price = station.price_per_hour;
        switch (priceFilter) {
          case "low": return price < 0.30;
          case "medium": return price >= 0.30 && price < 0.40;
          case "high": return price >= 0.40;
          default: return true;
        }
      });
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter(station => {
        switch (availabilityFilter) {
          case "available": return station.available_slots > 0;
          case "busy": return station.available_slots === 0;
          case "limited": return station.available_slots > 0 && station.available_slots <= 2;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price_per_hour - b.price_per_hour;
        case "price-high":
          return b.price_per_hour - a.price_per_hour;
        case "availability":
          return b.available_slots - a.available_slots;
        case "name":
          return a.name.localeCompare(b.name);
        default: // distance - mock implementation
          return 0;
      }
    });

    setFilteredStations(filtered);
  };

  const getStatusColor = (availableSlots: number, totalSlots: number) => {
    if (availableSlots === 0) return "destructive";
    if (availableSlots <= 2) return "warning";
    return "default";
  };

  const getStatusText = (availableSlots: number) => {
    if (availableSlots === 0) return "Full";
    if (availableSlots <= 2) return "Limited";
    return "Available";
  };

  const calculateDistance = (lat: number, lng: number) => {
    // Mock distance calculation - in real app, use user's location
    return (Math.random() * 5 + 0.1).toFixed(1);
  };

  const handleReserve = (stationId: string) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    // Navigate to booking interface with selected station
    const element = document.getElementById('booking-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigate = (station: Station) => {
    // In a real app, this would open maps with navigation
    window.open(`https://maps.google.com/maps?q=${station.latitude},${station.longitude}`, '_blank');
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

        {/* Search and Filters */}
        <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:w-auto"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">Under $0.30/hr</SelectItem>
                    <SelectItem value="medium">$0.30 - $0.40/hr</SelectItem>
                    <SelectItem value="high">Over $0.40/hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Availability</label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Button variant="outline" className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interactive Map */}
          <div className="relative">
            <Card className="h-[600px] bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-electric-blue/5 to-electric-green/5" />
              
              {/* Map controls */}
              <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
                <Badge variant="secondary" className="px-3 py-1">
                  {filteredStations.length} stations found
                </Badge>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Navigation className="h-4 w-4 mr-2" />
                    My Location
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Map Filter
                  </Button>
                </div>
              </div>

              {/* Interactive map area */}
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium mb-2">Interactive Map</p>
                  <p className="text-muted-foreground mb-4">
                    Real-time charging station locations
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="default" className="text-xs">Available</Badge>
                    <Badge variant="warning" className="text-xs">Limited</Badge>
                    <Badge variant="destructive" className="text-xs">Full</Badge>
                  </div>
                </div>
              </div>

              {/* Map markers simulation */}
              {filteredStations.slice(0, 5).map((station, index) => (
                <div 
                  key={station.id}
                  className={`absolute w-4 h-4 rounded-full animate-ping cursor-pointer ${
                    station.available_slots > 0 ? 'bg-electric-green' : 'bg-destructive'
                  }`}
                  style={{
                    top: `${20 + index * 15}%`,
                    left: `${30 + (index % 3) * 20}%`,
                    animationDelay: `${index * 200}ms`
                  }}
                  onClick={() => setSelectedStation(selectedStation === parseInt(station.id) ? null : parseInt(station.id))}
                />
              ))}
            </Card>
          </div>

          {/* Station List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">
                {searchQuery ? 'Search Results' : 'Nearby Stations'}
              </h3>
              <Badge variant="secondary" className="text-sm">
                {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
              </Badge>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredStations.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No stations found matching your criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      setSearchQuery("");
                      setPriceFilter("all");
                      setAvailabilityFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                filteredStations.map((station) => (
                  <Card 
                    key={station.id}
                    className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border ${
                      selectedStation === parseInt(station.id)
                        ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStation(selectedStation === parseInt(station.id) ? null : parseInt(station.id))}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{station.name}</h4>
                        <p className="text-muted-foreground text-sm mb-2">{station.address}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {calculateDistance(station.latitude, station.longitude)} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-electric-amber text-electric-amber" />
                            4.{Math.floor(Math.random() * 9) + 1}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant={getStatusColor(station.available_slots, station.total_slots) as any}
                        className="ml-4"
                      >
                        {getStatusText(station.available_slots)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-secondary/50 rounded-lg">
                        <div className="text-lg font-semibold text-primary">
                          {station.available_slots}/{station.total_slots}
                        </div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-lg">
                        <div className="text-lg font-semibold text-electric-blue">
                          150 kW
                        </div>
                        <div className="text-xs text-muted-foreground">Max Speed</div>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-lg">
                        <div className="text-lg font-semibold text-electric-green">
                          ${station.price_per_hour}/hr
                        </div>
                        <div className="text-xs text-muted-foreground">Pricing</div>
                      </div>
                    </div>

                    {/* Amenities */}
                    {station.amenities && station.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {station.amenities.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {station.amenities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{station.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          DC Fast
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Est. 35min charge
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReserve(station.id);
                          }}
                          disabled={station.available_slots === 0}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Reserve
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(station);
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedChargingStationMap;