import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Car, Users, Battery, MapPin, Clock, Zap, DollarSign, Plus } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('v2v_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedListings: V2VListing[] = (data || []).map(listing => ({
        id: listing.id,
        providerName: 'EV Owner', // In production, fetch from profiles
        location: listing.location as any,
        availableEnergy: Number(listing.available_energy_kwh),
        pricePerKwh: Number(listing.price_per_kwh),
        minTransfer: Number(listing.min_transfer_kwh),
        maxTransfer: Number(listing.max_transfer_kwh),
        availableFrom: listing.available_from,
        availableUntil: listing.available_until,
        distance: Math.random() * 10 // Mock distance calculation
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

  const createListing = async () => {
    toast({
      title: "Creating Listing",
      description: "Your V2V energy sharing listing is being created"
    });
    setCreateDialogOpen(false);
  };

  const requestTransfer = (listing: V2VListing) => {
    toast({
      title: "Transfer Request",
      description: `Requesting energy transfer from ${listing.providerName}`
    });
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create V2V Energy Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Available Energy (kWh)</Label>
                    <Input type="number" placeholder="10" />
                  </div>
                  <div>
                    <Label>Price per kWh (₹)</Label>
                    <Input type="number" placeholder="15" />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input placeholder="Enter your location" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Available From</Label>
                      <Input type="time" />
                    </div>
                    <div>
                      <Label>Available Until</Label>
                      <Input type="time" />
                    </div>
                  </div>
                  <Button onClick={createListing} className="w-full">
                    Create Listing
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
                        <span>{listing.location.address}</span>
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
                        {new Date(listing.availableFrom).toLocaleTimeString()} - {new Date(listing.availableUntil).toLocaleTimeString()}
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