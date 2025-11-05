import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Filter, Zap, Clock, Star, Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useToast } from "@/hooks/use-toast";

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

interface UserLocation {
  lat: number;
  lng: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 28.6139, // Delhi coordinates as default
  lng: 77.2090
};

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
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [infoWindowStation, setInfoWindowStation] = useState<Station | null>(null);

  useEffect(() => {
    fetchStations();
    getUserLocation();
    
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
  }, [stations, searchQuery, priceFilter, availabilityFilter, sortBy, userLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
          toast({
            title: "Location found",
            description: "Showing nearby charging stations",
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location unavailable",
            description: "Using default location. Please enable location services.",
            variant: "destructive"
          });
        }
      );
    }
  };

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula for distance calculation
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getStationDistance = (station: Station): number => {
    if (!userLocation) return 0;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      station.latitude,
      station.longitude
    );
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
          case "low": return price < 100;
          case "medium": return price >= 100 && price < 150;
          case "high": return price >= 150;
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
        case "distance":
          if (!userLocation) return 0;
          return getStationDistance(a) - getStationDistance(b);
        case "price-low":
          return a.price_per_hour - b.price_per_hour;
        case "price-high":
          return b.price_per_hour - a.price_per_hour;
        case "availability":
          return b.available_slots - a.available_slots;
        case "name":
          return a.name.localeCompare(b.name);
        default:
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

  const handleReserve = (stationId: string) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    const element = document.getElementById('booking-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigate = (station: Station) => {
    window.open(`https://maps.google.com/maps?q=${station.latitude},${station.longitude}`, '_blank');
  };

  const getMarkerIcon = (station: Station) => {
    if (station.available_slots === 0) {
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } else if (station.available_slots <= 2) {
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    }
    return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:w-auto"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

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
                    <SelectItem value="low">Under ₹100/hr</SelectItem>
                    <SelectItem value="medium">₹100 - ₹150/hr</SelectItem>
                    <SelectItem value="high">Over ₹150/hr</SelectItem>
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
                <Button variant="outline" className="w-full" onClick={getUserLocation}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Google Map */}
          <div className="relative">
            <Card className="h-[600px] bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden p-0">
              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={12}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {/* User location marker */}
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={{
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                      }}
                      title="Your Location"
                    />
                  )}

                  {/* Station markers */}
                  {filteredStations.map((station) => (
                    <Marker
                      key={station.id}
                      position={{ lat: station.latitude, lng: station.longitude }}
                      icon={{
                        url: getMarkerIcon(station)
                      }}
                      onClick={() => setInfoWindowStation(station)}
                      title={station.name}
                    />
                  ))}

                  {/* Info Window */}
                  {infoWindowStation && (
                    <InfoWindow
                      position={{
                        lat: infoWindowStation.latitude,
                        lng: infoWindowStation.longitude
                      }}
                      onCloseClick={() => setInfoWindowStation(null)}
                    >
                      <div className="p-2">
                        <h3 className="font-semibold text-sm mb-1">{infoWindowStation.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">{infoWindowStation.address}</p>
                        <div className="flex gap-2 text-xs mb-2">
                          <span className="font-medium">
                            {infoWindowStation.available_slots}/{infoWindowStation.total_slots} Available
                          </span>
                          <span>₹{infoWindowStation.price_per_hour}/hr</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            setSelectedStation(infoWindowStation.id);
                            setInfoWindowStation(null);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
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
                      selectedStation === station.id
                        ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedStation(selectedStation === station.id ? null : station.id);
                      setMapCenter({ lat: station.latitude, lng: station.longitude });
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{station.name}</h4>
                        <p className="text-muted-foreground text-sm mb-2">{station.address}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {userLocation ? getStationDistance(station).toFixed(1) : '—'} km
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
                          ₹{station.price_per_hour}/hr
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

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            DC Fast
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Est. 35min charge
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(station);
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                        <Button 
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReserve(station.id);
                          }}
                          disabled={station.available_slots === 0}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Reserve
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
