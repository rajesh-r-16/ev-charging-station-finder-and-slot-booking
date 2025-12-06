import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2,
  Zap,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Plug,
  Settings,
  LogOut,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  total_slots: number;
  available_slots: number;
  amenities: string[] | null;
  owner_user_id: string | null;
  created_at: string;
}

interface ChargingSlot {
  id: string;
  station_id: string;
  slot_number: number;
  status: string;
  connector_type: string;
  power_output_kw: number;
}

const StationOwnerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [slots, setSlots] = useState<ChargingSlot[]>([]);
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [editingStation, setEditingStation] = useState<ChargingStation | null>(null);
  const [stats, setStats] = useState({
    totalStations: 0,
    totalSlots: 0,
    availableSlots: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  const [stationForm, setStationForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    price_per_hour: '',
    total_slots: '4',
    amenities: [] as string[]
  });

  useEffect(() => {
    if (!user) {
      navigate('/admin-auth');
      return;
    }
    checkAuthorization();
  }, [user, navigate]);

  const checkAuthorization = async () => {
    if (!user) return;

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .in('role', ['admin', 'station_owner'])
      .eq('approved', true)
      .maybeSingle();

    if (error || !roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate('/admin-auth');
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
    fetchStations();
    fetchStats();
  };

  const fetchStations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stations:', error);
      return;
    }

    setStations(data || []);
  };

  const fetchStats = async () => {
    if (!user) return;

    // Fetch user's stations
    const { data: stationsData } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('owner_user_id', user.id);

    const stationIds = stationsData?.map(s => s.id) || [];
    
    if (stationIds.length === 0) {
      setStats({
        totalStations: 0,
        totalSlots: 0,
        availableSlots: 0,
        totalBookings: 0,
        totalRevenue: 0
      });
      return;
    }

    // Fetch bookings for these stations
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('total_amount')
      .in('station_id', stationIds);

    const totalSlots = stationsData?.reduce((sum, s) => sum + s.total_slots, 0) || 0;
    const availableSlots = stationsData?.reduce((sum, s) => sum + s.available_slots, 0) || 0;
    const totalRevenue = bookingsData?.reduce((sum, b) => sum + b.total_amount, 0) || 0;

    setStats({
      totalStations: stationsData?.length || 0,
      totalSlots,
      availableSlots,
      totalBookings: bookingsData?.length || 0,
      totalRevenue
    });
  };

  const fetchSlots = async (stationId: string) => {
    const { data, error } = await supabase
      .from('charging_slots')
      .select('*')
      .eq('station_id', stationId)
      .order('slot_number', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
      return;
    }

    setSlots(data || []);
  };

  const handleAddStation = async () => {
    if (!user) return;

    try {
      const { data: newStation, error } = await supabase
        .from('charging_stations')
        .insert({
          name: stationForm.name,
          address: stationForm.address,
          latitude: parseFloat(stationForm.latitude),
          longitude: parseFloat(stationForm.longitude),
          price_per_hour: parseFloat(stationForm.price_per_hour),
          total_slots: parseInt(stationForm.total_slots),
          available_slots: parseInt(stationForm.total_slots),
          amenities: stationForm.amenities,
          owner_user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create charging slots for this station
      const slotsToCreate = [];
      for (let i = 1; i <= parseInt(stationForm.total_slots); i++) {
        slotsToCreate.push({
          station_id: newStation.id,
          slot_number: i,
          status: 'available',
          connector_type: 'CCS2',
          power_output_kw: 50
        });
      }

      await supabase.from('charging_slots').insert(slotsToCreate);

      toast({
        title: "Success",
        description: "Charging station added successfully.",
      });

      setIsAddingStation(false);
      resetStationForm();
      fetchStations();
      fetchStats();

    } catch (error: any) {
      console.error('Error adding station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add station.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStation = async () => {
    if (!editingStation) return;

    try {
      const { error } = await supabase
        .from('charging_stations')
        .update({
          name: stationForm.name,
          address: stationForm.address,
          latitude: parseFloat(stationForm.latitude),
          longitude: parseFloat(stationForm.longitude),
          price_per_hour: parseFloat(stationForm.price_per_hour),
          total_slots: parseInt(stationForm.total_slots),
          amenities: stationForm.amenities
        })
        .eq('id', editingStation.id)
        .eq('owner_user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Station updated successfully.",
      });

      setEditingStation(null);
      resetStationForm();
      fetchStations();
      fetchStats();

    } catch (error: any) {
      console.error('Error updating station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update station.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSlotStatus = async (slotId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('charging_slots')
        .update({ status: newStatus, last_status_update: new Date().toISOString() })
        .eq('id', slotId);

      if (error) throw error;

      // Update available_slots count on station
      if (selectedStation) {
        const availableCount = slots.filter(s => 
          s.id === slotId ? newStatus === 'available' : s.status === 'available'
        ).length;

        await supabase
          .from('charging_stations')
          .update({ available_slots: availableCount })
          .eq('id', selectedStation.id);

        fetchSlots(selectedStation.id);
        fetchStations();
      }

      toast({
        title: "Success",
        description: "Slot status updated.",
      });

    } catch (error: any) {
      console.error('Error updating slot:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update slot.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrice = async (stationId: string, newPrice: string) => {
    try {
      const { error } = await supabase
        .from('charging_stations')
        .update({ price_per_hour: parseFloat(newPrice) })
        .eq('id', stationId)
        .eq('owner_user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Price updated successfully.",
      });

      fetchStations();

    } catch (error: any) {
      console.error('Error updating price:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update price.",
        variant: "destructive",
      });
    }
  };

  const resetStationForm = () => {
    setStationForm({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      price_per_hour: '',
      total_slots: '4',
      amenities: []
    });
  };

  const populateEditForm = (station: ChargingStation) => {
    setStationForm({
      name: station.name,
      address: station.address,
      latitude: station.latitude.toString(),
      longitude: station.longitude.toString(),
      price_per_hour: station.price_per_hour.toString(),
      total_slots: station.total_slots.toString(),
      amenities: station.amenities || []
    });
    setEditingStation(station);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">Station Owner Dashboard</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-electric-blue/10 border-primary/20">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">My Stations</p>
                <p className="text-2xl font-bold">{stats.totalStations}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-electric-green/10 to-primary/10 border-electric-green/20">
            <div className="flex items-center gap-3">
              <Plug className="h-8 w-8 text-electric-green" />
              <div>
                <p className="text-sm text-muted-foreground">Available Slots</p>
                <p className="text-2xl font-bold">{stats.availableSlots}/{stats.totalSlots}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-electric-blue/10 to-primary/10 border-electric-blue/20">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-electric-blue" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-charging-amber/10 to-electric-green/10 border-charging-amber/20">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-charging-amber" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="stations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stations">
              <MapPin className="h-4 w-4 mr-2" />
              My Stations
            </TabsTrigger>
            <TabsTrigger value="slots">
              <Plug className="h-4 w-4 mr-2" />
              Manage Slots
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
          </TabsList>

          {/* Stations Tab */}
          <TabsContent value="stations">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">My Charging Stations</h2>
                <Dialog open={isAddingStation} onOpenChange={setIsAddingStation}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Station
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Register New Charging Station</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Station Name</Label>
                        <Input
                          id="name"
                          value={stationForm.name}
                          onChange={(e) => setStationForm({...stationForm, name: e.target.value})}
                          placeholder="My EV Station"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={stationForm.address}
                          onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
                          placeholder="Full address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={stationForm.latitude}
                          onChange={(e) => setStationForm({...stationForm, latitude: e.target.value})}
                          placeholder="28.6139"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={stationForm.longitude}
                          onChange={(e) => setStationForm({...stationForm, longitude: e.target.value})}
                          placeholder="77.2090"
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Price per Hour (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={stationForm.price_per_hour}
                          onChange={(e) => setStationForm({...stationForm, price_per_hour: e.target.value})}
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slots">Number of Charging Points</Label>
                        <Input
                          id="slots"
                          type="number"
                          min="1"
                          max="20"
                          value={stationForm.total_slots}
                          onChange={(e) => setStationForm({...stationForm, total_slots: e.target.value})}
                          placeholder="4"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setIsAddingStation(false)}>Cancel</Button>
                      <Button onClick={handleAddStation}>Add Station</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {stations.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stations yet</h3>
                  <p className="text-muted-foreground mb-4">Register your first charging station to get started.</p>
                  <Button onClick={() => setIsAddingStation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Station
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stations.map((station) => (
                    <Card key={station.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{station.name}</h3>
                          <p className="text-sm text-muted-foreground">{station.address}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={station.available_slots > 0 ? "default" : "destructive"}>
                              {station.available_slots}/{station.total_slots} available
                            </Badge>
                            <span className="text-sm text-electric-green font-medium">
                              ₹{station.price_per_hour}/hr
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => populateEditForm(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStation(station);
                              fetchSlots(station.id);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Edit Station Dialog */}
            <Dialog open={!!editingStation} onOpenChange={(open) => !open && setEditingStation(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Station</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Station Name</Label>
                    <Input
                      id="edit-name"
                      value={stationForm.name}
                      onChange={(e) => setStationForm({...stationForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={stationForm.address}
                      onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-latitude">Latitude</Label>
                    <Input
                      id="edit-latitude"
                      type="number"
                      step="any"
                      value={stationForm.latitude}
                      onChange={(e) => setStationForm({...stationForm, latitude: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-longitude">Longitude</Label>
                    <Input
                      id="edit-longitude"
                      type="number"
                      step="any"
                      value={stationForm.longitude}
                      onChange={(e) => setStationForm({...stationForm, longitude: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-price">Price per Hour (₹)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={stationForm.price_per_hour}
                      onChange={(e) => setStationForm({...stationForm, price_per_hour: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-slots">Total Slots</Label>
                    <Input
                      id="edit-slots"
                      type="number"
                      value={stationForm.total_slots}
                      onChange={(e) => setStationForm({...stationForm, total_slots: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setEditingStation(null)}>Cancel</Button>
                  <Button onClick={handleUpdateStation}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Slots Tab */}
          <TabsContent value="slots">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Manage Charging Slots</h2>
              
              {stations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Add a station first to manage its slots.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label>Select Station</Label>
                    <Select
                      value={selectedStation?.id || ''}
                      onValueChange={(value) => {
                        const station = stations.find(s => s.id === value);
                        setSelectedStation(station || null);
                        if (station) fetchSlots(station.id);
                      }}
                    >
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Select a station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStation && slots.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slots.map((slot) => (
                        <Card key={slot.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Plug className="h-5 w-5 text-primary" />
                              <span className="font-medium">Slot #{slot.slot_number}</span>
                            </div>
                            <Badge variant={
                              slot.status === 'available' ? 'default' :
                              slot.status === 'charging' ? 'secondary' :
                              slot.status === 'maintenance' ? 'destructive' : 'outline'
                            }>
                              {slot.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            <p>{slot.connector_type} • {slot.power_output_kw} kW</p>
                          </div>
                          <Select
                            value={slot.status}
                            onValueChange={(value) => handleUpdateSlotStatus(slot.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="charging">Charging</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Update Pricing</h2>
              
              {stations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Add a station first to manage pricing.</p>
              ) : (
                <div className="space-y-4">
                  {stations.map((station) => (
                    <Card key={station.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{station.name}</h3>
                          <p className="text-sm text-muted-foreground">{station.address}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24"
                            defaultValue={station.price_per_hour}
                            onBlur={(e) => {
                              if (e.target.value !== station.price_per_hour.toString()) {
                                handleUpdatePrice(station.id, e.target.value);
                              }
                            }}
                          />
                          <span className="text-sm text-muted-foreground">/hr</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StationOwnerDashboard;