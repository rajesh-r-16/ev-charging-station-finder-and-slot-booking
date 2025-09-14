import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Clock, CreditCard, Activity, Car, Zap, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProfileSettings from '@/components/ProfileSettings';
import BookingHistory from '@/components/BookingHistory';
import PaymentHistory from '@/components/PaymentHistory';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalSpent: number;
  favoriteStation: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    totalSpent: 0,
    favoriteStation: 'No bookings yet'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch booking stats
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          station:charging_stations(name)
        `)
        .eq('user_id', user?.id);

      if (bookingsError) throw bookingsError;

      // Fetch payment stats
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('payment_status', 'completed');

      if (paymentsError) throw paymentsError;

      const totalBookings = bookings?.length || 0;
      const activeBookings = bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0;
      const totalSpent = payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      
      // Find most frequent station
      const stationCounts = bookings?.reduce((acc: any, booking: any) => {
        const stationName = booking.station?.name || 'Unknown';
        acc[stationName] = (acc[stationName] || 0) + 1;
        return acc;
      }, {});

      const favoriteStation = stationCounts && Object.keys(stationCounts).length > 0
        ? Object.keys(stationCounts).reduce((a, b) => stationCounts[a] > stationCounts[b] ? a : b)
        : 'No bookings yet';

      setStats({
        totalBookings,
        activeBookings,
        totalSpent,
        favoriteStation
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EVCharger Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">Lifetime bookings</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Lifetime spending</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Station</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">{stats.favoriteStation}</div>
              <p className="text-xs text-muted-foreground">Most visited</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.totalBookings === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity yet. Make your first booking!</p>
                      <Button className="mt-4" onClick={() => window.location.href = '/'}>
                        Find Charging Stations
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Welcome to EVCharger!</p>
                          <p className="text-sm text-muted-foreground">Your dashboard is ready to track your charging activities</p>
                        </div>
                        <Badge variant="outline">New</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <BookingHistory />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentHistory />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;