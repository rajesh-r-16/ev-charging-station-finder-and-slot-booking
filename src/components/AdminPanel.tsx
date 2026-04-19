import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings, 
  Users, 
  MapPin, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Zap,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  totalStations: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  utilizationRate: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStations: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    utilizationRate: 0
  });
  const [stations, setStations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  // Form states for adding/editing stations
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
    const verifyAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('user_id', user.id)
        .eq('approved', true)
        .eq('role', 'admin')
        .maybeSingle();
      if (error || !data) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      fetchDashboardData();
    };
    verifyAdmin();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stations
      const { data: stationsData, error: stationsError } = await supabase
        .from('charging_stations')
        .select('*')
        .order('created_at', { ascending: false });

      if (stationsError) throw stationsError;

      // Fetch bookings with station and user info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          charging_stations (name),
          profiles (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch users (profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch payments for revenue calculation
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'completed');

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const activeBookings = bookingsData?.filter(booking => booking.status === 'confirmed').length || 0;
      const totalSlots = stationsData?.reduce((sum, station) => sum + station.total_slots, 0) || 1;
      const occupiedSlots = stationsData?.reduce((sum, station) => sum + (station.total_slots - station.available_slots), 0) || 0;
      const utilizationRate = (occupiedSlots / totalSlots) * 100;

      setStats({
        totalUsers: usersData?.length || 0,
        totalStations: stationsData?.length || 0,
        totalBookings: bookingsData?.length || 0,
        totalRevenue,
        activeBookings,
        utilizationRate
      });

      setStations(stationsData || []);
      setBookings(bookingsData || []);
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    }
  };

  const handleAddStation = async () => {
    try {
      const { error } = await supabase
        .from('charging_stations')
        .insert({
          name: stationForm.name,
          address: stationForm.address,
          latitude: parseFloat(stationForm.latitude),
          longitude: parseFloat(stationForm.longitude),
          price_per_hour: parseFloat(stationForm.price_per_hour),
          total_slots: parseInt(stationForm.total_slots),
          available_slots: parseInt(stationForm.total_slots),
          amenities: stationForm.amenities
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Charging station added successfully.",
      });

      setIsAddingStation(false);
      resetStationForm();
      fetchDashboardData();

    } catch (error: any) {
      console.error('Error adding station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add station.",
        variant: "destructive",
      });
    }
  };

  const handleEditStation = async () => {
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
        .eq('id', editingStation.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Charging station updated successfully.",
      });

      setEditingStation(null);
      resetStationForm();
      fetchDashboardData();

    } catch (error: any) {
      console.error('Error updating station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update station.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (!confirm('Are you sure you want to delete this station?')) return;

    try {
      const { error } = await supabase
        .from('charging_stations')
        .delete()
        .eq('id', stationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Charging station deleted successfully.",
      });

      fetchDashboardData();

    } catch (error: any) {
      console.error('Error deleting station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete station.",
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

  const populateEditForm = (station: any) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Admin <span className="bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Manage charging stations, bookings, and users</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-electric-blue/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-electric-green/10 to-charging-amber/10 border border-electric-green/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                <p className="text-2xl font-bold text-electric-green">{stats.activeBookings}</p>
              </div>
              <Zap className="h-8 w-8 text-electric-green" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-electric-blue/10 to-primary/10 border border-electric-blue/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stations</p>
                <p className="text-2xl font-bold text-electric-blue">{stats.totalStations}</p>
              </div>
              <MapPin className="h-8 w-8 text-electric-blue" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-charging-amber/10 to-electric-green/10 border border-charging-amber/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold text-charging-amber">{stats.utilizationRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-charging-amber" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="stations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stations">
              <MapPin className="h-4 w-4 mr-2" />
              Stations
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Stations Management */}
          <TabsContent value="stations">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Charging Stations</h2>
                <Dialog open={isAddingStation} onOpenChange={setIsAddingStation}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Station
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Charging Station</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Station Name</Label>
                        <Input
                          id="name"
                          value={stationForm.name}
                          onChange={(e) => setStationForm({...stationForm, name: e.target.value})}
                          placeholder="Enter station name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={stationForm.address}
                          onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
                          placeholder="Enter address"
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
                          placeholder="0.000000"
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
                          placeholder="0.000000"
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
                          placeholder="0.35"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slots">Total Slots</Label>
                        <Input
                          id="slots"
                          type="number"
                          value={stationForm.total_slots}
                          onChange={(e) => setStationForm({...stationForm, total_slots: e.target.value})}
                          placeholder="4"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setIsAddingStation(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStation}>
                        Add Station
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {stations.map((station) => (
                  <Card key={station.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{station.name}</h3>
                        <p className="text-sm text-muted-foreground">{station.address}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
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
                          onClick={() => handleDeleteStation(station.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Bookings Management */}
          <TabsContent value="bookings">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Recent Bookings</h2>
              <div className="space-y-4">
                {bookings.slice(0, 10).map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {booking.charging_stations?.name || 'Unknown Station'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Slot {booking.slot_number} • {booking.profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.start_time)} - {formatDate(booking.end_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            booking.status === 'confirmed' ? 'default' : 
                            booking.status === 'completed' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {booking.status}
                        </Badge>
                        <p className="text-sm font-medium text-electric-green mt-1">
                          {formatCurrency(booking.total_amount)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Registered Users</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.full_name || 'No name provided'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {formatDate(user.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        {user.vehicle_number && (
                          <Badge variant="outline">
                            {user.vehicle_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Revenue Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-medium">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average per Booking</span>
                    <span className="font-medium">
                      {formatCurrency(stats.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Bookings</span>
                    <span className="font-medium">{stats.activeBookings}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Station Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Stations</span>
                    <span className="font-medium">{stats.totalStations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization Rate</span>
                    <span className="font-medium">{stats.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-medium">{stats.totalUsers}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Station Dialog */}
        <Dialog open={!!editingStation} onOpenChange={() => setEditingStation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Charging Station</DialogTitle>
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
              <Button variant="outline" onClick={() => setEditingStation(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditStation}>
                Update Station
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;