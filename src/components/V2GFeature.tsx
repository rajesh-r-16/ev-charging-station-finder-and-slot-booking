import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Battery, Grid3x3, DollarSign, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import V2GEnrollment from './V2GEnrollment';

interface V2GStats {
  totalEnergySold: number;
  totalEarnings: number;
  enrollmentStatus: string;
}

const V2GFeature = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<V2GStats>({
    totalEnergySold: 0,
    totalEarnings: 0,
    enrollmentStatus: 'not_enrolled'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchV2GStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchV2GStats = async () => {
    try {
      setLoading(true);
      
      // Check enrollment status
      const { data: enrollment } = await supabase
        .from('v2g_enrollments')
        .select('*, total_earnings, total_energy_sold_kwh')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      // Fetch grid transactions
      const { data: transactions } = await supabase
        .from('v2g_grid_transactions')
        .select('*')
        .eq('user_id', user?.id);

      const totalEnergySold = transactions?.reduce((sum, t) => sum + Number(t.energy_discharged_kwh), 0) || 0;
      const totalEarnings = transactions?.reduce((sum, t) => sum + Number(t.earnings), 0) || 0;

      setStats({
        totalEnergySold: enrollment?.total_energy_sold_kwh || totalEnergySold,
        totalEarnings: enrollment?.total_earnings || totalEarnings,
        enrollmentStatus: enrollment ? 'active' : 'not_enrolled'
      });
    } catch (error) {
      console.error('Error fetching V2G stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-primary" />
                Vehicle-to-Grid (V2G) Integration
              </CardTitle>
              <CardDescription className="mt-2">
                Sell excess battery power back to the grid and earn money
              </CardDescription>
            </div>
            <Badge 
              variant="default" 
              className={stats.enrollmentStatus === 'active' ? 'bg-green-600' : 'bg-muted'}
            >
              {stats.enrollmentStatus === 'active' ? 'Enrolled' : 'Not Enrolled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold">Earn Income</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Turn your EV battery into a passive income source
              </p>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Battery className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Smart Scheduling</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically sell power during peak demand hours
              </p>
            </div>

            <div className="p-4 bg-secondary/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </div>
                <h3 className="font-semibold">Grid Support</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Help stabilize the electrical grid while earning rewards
              </p>
            </div>
          </div>

          {/* V2G Stats Dashboard */}
          <div>
            <h3 className="font-semibold mb-4">V2G Performance Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={stats.totalEnergySold > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-dashed'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Energy Sold (kWh)</span>
                    <Zap className={`h-4 w-4 ${stats.totalEnergySold > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className={`text-2xl font-bold ${stats.totalEnergySold > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {loading ? '...' : stats.totalEnergySold.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total energy discharged</p>
                </CardContent>
              </Card>

              <Card className={stats.totalEarnings > 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/50 border-dashed'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <DollarSign className={`h-4 w-4 ${stats.totalEarnings > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div className={`text-2xl font-bold ${stats.totalEarnings > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    ₹{loading ? '...' : stats.totalEarnings.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-lg border border-green-500/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
              <BarChart3 className="h-4 w-4" />
              Feature Benefits
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Generate passive income from your parked EV
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Support renewable energy grid integration
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Maximize earnings during peak electricity prices
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Automated smart scheduling with battery protection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Real-time analytics and earnings tracking
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* V2G Enrollment */}
      <V2GEnrollment />
    </div>
  );
};

export default V2GFeature;
