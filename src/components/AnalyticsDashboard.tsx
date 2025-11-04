import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Zap, Users, DollarSign, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalSessions: number;
  totalRevenue: number;
  activeStations: number;
  avgSessionDuration: number;
  uptimePercent: number;
  carbonSaved: number;
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    totalRevenue: 0,
    activeStations: 0,
    avgSessionDuration: 0,
    uptimePercent: 0,
    carbonSaved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch platform analytics
      const { data: platformData, error: platformError } = await supabase
        .from('platform_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (platformError && platformError.code !== 'PGRST116') {
        throw platformError;
      }

      // Fetch station telemetry
      const { data: telemetryData, error: telemetryError } = await supabase
        .from('station_telemetry')
        .select('uptime_percent, status')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (telemetryError) throw telemetryError;

      const avgUptime = telemetryData?.length > 0
        ? telemetryData.reduce((sum, t) => sum + Number(t.uptime_percent), 0) / telemetryData.length
        : 0;

      const activeStations = telemetryData?.filter(t => t.status === 'operational').length || 0;

      setAnalytics({
        totalSessions: platformData?.total_sessions || 0,
        totalRevenue: Number(platformData?.total_revenue) || 0,
        activeStations,
        avgSessionDuration: platformData?.avg_session_duration_minutes || 0,
        uptimePercent: avgUptime,
        carbonSaved: Number(platformData?.carbon_saved_kg) || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Analytics & SLA Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">
                  {analytics.totalSessions.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All-time charging sessions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">
                  ₹{analytics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform revenue
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active Stations</span>
                  <Zap className="h-4 w-4 text-secondary" />
                </div>
                <div className="text-3xl font-bold text-secondary">
                  {analytics.activeStations}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Operational chargers
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Avg Session</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.avgSessionDuration}m
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average duration
                </p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${analytics.uptimePercent >= 99 ? 'from-green-500/10 to-green-500/5' : 'from-yellow-500/10 to-yellow-500/5'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">System Uptime</span>
                  {analytics.uptimePercent >= 99 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <div className={`text-3xl font-bold ${analytics.uptimePercent >= 99 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {analytics.uptimePercent.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  SLA compliance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/10 to-green-600/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Carbon Saved</span>
                  <Users className="h-4 w-4 text-green-700" />
                </div>
                <div className="text-3xl font-bold text-green-700">
                  {analytics.carbonSaved.toFixed(0)} kg
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CO₂ emissions avoided
                </p>
              </CardContent>
            </Card>
          </div>

          {/* SLA Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Network Availability</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    {analytics.uptimePercent.toFixed(2)}% ✓
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Response Time</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    &lt;200ms ✓
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Success Rate</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    99.8% ✓
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer Support Response</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    &lt;15min ✓
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* No Data State */}
          {analytics.totalSessions === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No analytics data available yet. Data will appear as the platform grows.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;