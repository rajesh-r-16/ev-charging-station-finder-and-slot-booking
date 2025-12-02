import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Clock, CreditCard, Activity, Car, Zap, DollarSign, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProfileSettings from '@/components/ProfileSettings';
import BookingHistory from '@/components/BookingHistory';
import PaymentHistory from '@/components/PaymentHistory';
import V2VFeature from '@/components/V2VFeature';
import V2GFeature from '@/components/V2GFeature';
import RoutePlanner from '@/components/RoutePlanner';
import CarbonTracker from '@/components/CarbonTracker';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import NotificationCenter from '@/components/NotificationCenter';
import VehicleProfileForm from '@/components/VehicleProfileForm';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalSpent: number;
  favoriteStation: string;
}

interface UserProfile {
  email_verified: boolean;
  verification_token: string;
  verified_at: string;
  full_name: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    totalSpent: 0,
    favoriteStation: 'No bookings yet'
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile with verification status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email_verified, verification_token, verified_at, full_name')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile not found, user might need to sign up again');
      } else if (profileData) {
        setProfile(profileData);
      }
      
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="mr-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </Button>
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
        {/* Verification Status */}
        {profile && !profile.email_verified && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/20 rounded-full">
                  <User className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-warning">Account Verification Required</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please verify your email address to access all features.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                  Unverified
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.email_verified && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-600">Account Verified</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account is verified and ready to use.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                  Verified ✓
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="text-2xl font-bold text-green-600">₹{stats.totalSpent.toFixed(2)}</div>
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
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 lg:w-auto lg:grid-cols-10">
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Verification
            </TabsTrigger>
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
            <TabsTrigger value="route" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Route
            </TabsTrigger>
            <TabsTrigger value="carbon" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Carbon
            </TabsTrigger>
            <TabsTrigger value="v2v" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              V2V
            </TabsTrigger>
            <TabsTrigger value="v2g" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              V2G
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Verification</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      {profile?.email_verified ? (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                          Verified ✓
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                          Pending
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Profile Completion</p>
                          <p className="text-sm text-muted-foreground">Basic profile information</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                        Complete ✓
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Verification Benefits</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Access to all charging stations
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Priority booking support
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Payment history and receipts
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Account security features
                      </li>
                    </ul>

                    {!profile?.email_verified && (
                      <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm text-warning mb-2">
                          <strong>Action Required:</strong> Please check your email and click the verification link.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          If you haven't received the email, check your spam folder or contact support.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <NotificationCenter />
            
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

          <TabsContent value="route">
            <RoutePlanner />
          </TabsContent>

          <TabsContent value="carbon">
            <CarbonTracker />
          </TabsContent>

          <TabsContent value="v2v">
            <V2VFeature />
          </TabsContent>

          <TabsContent value="v2g">
            <V2GFeature />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <VehicleProfileForm />
              <ProfileSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;