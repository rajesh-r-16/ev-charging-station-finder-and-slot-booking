import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Zap, Search, SlidersHorizontal, Battery } from "lucide-react";
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

// Leaflet Map Component (loaded dynamically)
const LeafletMap = ({ stations, userLocation, onStationSelect, selectedStation }: {
  stations: Station[];
  userLocation: UserLocation | null;
  onStationSelect: (id: string) => void;
  selectedStation: string | null;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      if (typeof window === 'undefined' || !mapRef.current) return;
      
      // Load CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || mapInstanceRef.current) return;

      const center = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [28.6139, 77.2090]; // Delhi default

      mapInstanceRef.current = L.map(mapRef.current).setView(center, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create marker icons
    const createIcon = (color: string) => L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });

    const greenIcon = createIcon('#22c55e');
    const yellowIcon = createIcon('#eab308');
    const redIcon = createIcon('#ef4444');

    // Add station markers
    stations.forEach(station => {
      const icon = station.available_slots === 0 
        ? redIcon 
        : station.available_slots <= 2 
          ? yellowIcon 
          : greenIcon;

      const marker = L.marker([station.latitude, station.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 200px; font-family: system-ui;">
            <h3 style="margin: 0 0 4px; font-weight: 600; font-size: 14px;">${station.name}</h3>
            <p style="margin: 0 0 8px; color: #666; font-size: 12px;">${station.address}</p>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <span style="background: ${station.available_slots > 0 ? '#dcfce7' : '#fecaca'}; color: ${station.available_slots > 0 ? '#16a34a' : '#dc2626'}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                ${station.available_slots}/${station.total_slots} Available
              </span>
              <span style="font-size: 12px; font-weight: 500;">₹${station.price_per_hour}/hr</span>
            </div>
            <button onclick="window.selectStation('${station.id}')" style="
              width: 100%;
              background: linear-gradient(135deg, #00d4aa, #0099ff);
              color: white;
              border: none;
              padding: 8px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              font-size: 12px;
            ">View Details</button>
          </div>
        `);

      marker.on('click', () => onStationSelect(station.id));
      markersRef.current.push(marker);
    });

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="
          background: #3b82f6;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<strong>Your Location</strong>');
      
      markersRef.current.push(userMarker);
    }

    // Setup global function for popup button
    (window as any).selectStation = (id: string) => {
      onStationSelect(id);
      mapInstanceRef.current.closePopup();
    };

  }, [stations, userLocation, onStationSelect]);

  // Pan to selected station
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStation) return;
    const station = stations.find(s => s.id === selectedStation);
    if (station) {
      mapInstanceRef.current.setView([station.latitude, station.longitude], 15);
    }
  }, [selectedStation, stations]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '500px', background: '#e5e7eb' }}
    />
  );
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
            <Button variant="outline" onClick={getUserLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              My Location
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
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
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interactive Map */}
          <Card className="h-[600px] overflow-hidden border border-border/50">
            <LeafletMap
              stations={filteredStations}
              userLocation={userLocation}
              onStationSelect={setSelectedStation}
              selectedStation={selectedStation}
            />
          </Card>

          {/* Station List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Stations</h3>
              <Badge variant="secondary">{filteredStations.length} found</Badge>
            </div>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
              {filteredStations.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No stations found.</p>
                  <Button variant="outline" className="mt-2" onClick={() => { setSearchQuery(""); setPriceFilter("all"); setAvailabilityFilter("all"); }}>
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                filteredStations.map((station) => (
                  <Card 
                    key={station.id} 
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg border ${selectedStation === station.id ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]' : 'border-border/50 hover:border-primary/50'}`} 
                    onClick={() => setSelectedStation(station.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{station.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1 shrink-0" />
                            <span className="truncate max-w-[200px]">{station.address}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(station.available_slots) as any}>{getStatusText(station.available_slots)}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <div className="font-bold text-primary">{station.available_slots}/{station.total_slots}</div>
                        <div className="text-xs text-muted-foreground">Slots</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="font-bold text-electric-green">₹{station.price_per_hour}</div>
                        <div className="text-xs text-muted-foreground">Per Hr</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="font-bold">{userLocation ? `${getStationDistance(station).toFixed(1)}km` : '--'}</div>
                        <div className="text-xs text-muted-foreground">Away</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleReserve(station.id); }}>Reserve</Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleNavigate(station); }}>
                        <Navigation className="h-4 w-4" />
                      </Button>
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
