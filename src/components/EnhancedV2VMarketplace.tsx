import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Car, Users, Battery, MapPin, Clock, Zap, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface V2VListing {
  id: string;
  providerName: string;
  location: { lat: number; lng: number; address: string };
  availableEnergy: number;
  pricePerKwh: number;
  minTransfer: number;
  maxTransfer: number;
  availableFrom: string;
  availableUntil: string;
  distance?: number;
}

const EnhancedV2VMarketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<V2VListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [energy, setEnergy] = useState('20');
  const [price, setPrice] = useState('15');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [availableFrom, setAvailableFrom] = useState('09:00');
  const [availableUntil, setAvailableUntil] = useState('18:00');
  const [minTransfer, setMinTransfer] = useState('5');
  const [maxTransfer, setMaxTransfer] = useState('15');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('v2v_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedListings: V2VListing[] = (data || []).map(listing => ({
        id: listing.id,
        providerName: 'EV Owner',
        location: listing.location as any,
        availableEnergy: Number(listing.available_energy_kwh),
        pricePerKwh: Number(listing.price_per_kwh),
        minTransfer: Number(listing.min_transfer_kwh),
        maxTransfer: Number(listing.max_transfer_kwh),
        availableFrom: listing.available_from,
        availableUntil: listing.available_until,
        distance: Math.random() * 10
      }));

      setListings(transformedListings);
    } catch (error) {
      console.error('Error fetching V2V listings:', error);
      toast({
        title: "Error",
        description: "Failed to load V2V listings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLng(position.coords.longitude.toString());
          toast({
            title: "Location Updated",
            description: "Your current location has been set"
          });
        },
        () => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Using default.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const createListing = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a listing",
        variant: "destructive"
      });
      return;
    }

    if (!energy || !price || !address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      
      const today = new Date();
      const fromDate = new Date(today);
      const [fromHours, fromMinutes] = availableFrom.split(':');
      fromDate.setHours(parseInt(fromHours), parseInt(fromMinutes), 0, 0);
      
      const untilDate = new Date(today);
      const [untilHours, untilMinutes] = availableUntil.split(':');
      untilDate.setHours(parseInt(untilHours), parseInt(untilMinutes), 0, 0);
      
      if (untilDate <= fromDate) {
        untilDate.setDate(untilDate.getDate() + 1);
      }

      const { data, error } = await supabase.functions.invoke('create-v2v-listing', {
        body: {
          availableEnergy: parseFloat(energy),
          location: {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            address: address
          },
          pricePerKwh: parseFloat(price),
          availableFrom: fromDate.toISOString(),
          availableUntil: untilDate.toISOString(),
          maxTransfer: parseFloat(maxTransfer),
          minTransfer: parseFloat(minTransfer)
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your V2V listing has been created"
      });
      
      setCreateDialogOpen(false);
      // Reset form
      setEnergy('20');
      setPrice('15');
      setAddress('');
      setMinTransfer('5');
      setMaxTransfer('15');
      
      fetchListings();
    } catch (error: any) {
      console.error('Create listing error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create listing. Make sure you have a vehicle profile.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const requestTransfer = async (listing: V2VListing) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a transfer",
        variant: "destructive"
      });
      return;
    }

    const energyRequested = prompt(`How much energy do you need? (${listing.minTransfer}-${listing.maxTransfer} kWh)`);
    if (!energyRequested) return;

    const requestedAmount = parseFloat(energyRequested);
    if (isNaN(requestedAmount) || requestedAmount < listing.minTransfer || requestedAmount > listing.maxTransfer) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a value between ${listing.minTransfer} and ${listing.maxTransfer} kWh`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('request-v2v-transfer', {
        body: {
          listingId: listing.id,
          energyRequested: requestedAmount
        }
      });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: `Your transfer request for ${requestedAmount} kWh has been sent. Total cost: ₹${(requestedAmount * listing.pricePerKwh).toFixed(2)}`
      });
    } catch (error: any) {
      console.error('Request transfer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request transfer",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">How to Use V2V Marketplace</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary mt-0.5">1.</span>
                  <span><strong>Create Listing:</strong> Click "Create Listing" to share your available battery energy with others</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary mt-0.5">2.</span>
                  <span><strong>Set Details:</strong> Enter available energy (kWh), your price, location, and availability time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary mt-0.5">3.</span>
                  <span><strong>Request Transfer:</strong> Browse listings and click "Request Transfer" to get energy from nearby EVs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary mt-0.5">4.</span>
                  <span><strong>Meet & Connect:</strong> Use V2V charging cable to safely transfer power between vehicles</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                V2V Energy Marketplace
              </CardTitle>
              <CardDescription className="mt-2">
                Share or request power from nearby EV owners
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create V2V Energy Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="energy">Available Energy (kWh) *</Label>
                    <Input 
                      id="energy"
                      type="number" 
                      placeholder="20" 
                      value={energy}
                      onChange={(e) => setEnergy(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per kWh (₹) *</Label>
                    <Input 
                      id="price"
                      type="number" 
                      placeholder="15" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Location Address *</Label>
                    <Input 
                      id="address"
                      placeholder="Enter your current location" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={getCurrentLocation}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Use Current Location
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minTransfer">Min Transfer (kWh)</Label>
                      <Input 
                        id="minTransfer"
                        type="number" 
                        placeholder="5" 
                        value={minTransfer}
                        onChange={(e) => setMinTransfer(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxTransfer">Max Transfer (kWh)</Label>
                      <Input 
                        id="maxTransfer"
                        type="number" 
                        placeholder="15" 
                        value={maxTransfer}
                        onChange={(e) => setMaxTransfer(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="availableFrom">Available From</Label>
                      <Input 
                        id="availableFrom"
                        type="time" 
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="availableUntil">Available Until</Label>
                      <Input 
                        id="availableUntil"
                        type="time" 
                        value={availableUntil}
                        onChange={(e) => setAvailableUntil(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={createListing} disabled={creating} className="w-full">
                    {creating ? 'Creating...' : 'Create Listing'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{listing.providerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.location?.address || 'Location available'}</span>
                        <Badge variant="outline" className="ml-2">
                          {listing.distance?.toFixed(1)} km away
                        </Badge>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Available</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        {listing.availableEnergy} kWh
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Price</div>
                      <div className="font-semibold text-green-600">
                        ₹{listing.pricePerKwh}/kWh
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Min Transfer</div>
                      <div className="font-semibold">{listing.minTransfer} kWh</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Max Transfer</div>
                      <div className="font-semibold">{listing.maxTransfer} kWh</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(listing.availableFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(listing.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => requestTransfer(listing)}>
                      <Zap className="h-3 w-3 mr-2" />
                      Request Transfer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No active V2V listings nearby. Be the first to share energy!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedV2VMarketplace;
