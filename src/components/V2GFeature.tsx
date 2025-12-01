import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Battery, Grid3x3, DollarSign, BarChart3 } from 'lucide-react';

const V2GFeature = () => {
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
            <Badge variant="default" className="bg-green-600">
              Active
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

          {/* How It Works */}
          <div>
            <h3 className="font-semibold mb-4">How V2G Integration Works</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Connect to Grid</p>
                  <p className="text-sm text-muted-foreground">
                    Register your EV with the grid operator and install V2G compatible charger
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Set Preferences</p>
                  <p className="text-sm text-muted-foreground">
                    Define minimum battery level, available hours, and pricing preferences
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Automatic Trading</p>
                  <p className="text-sm text-muted-foreground">
                    System automatically sells power during peak hours for maximum profit
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Track Earnings</p>
                  <p className="text-sm text-muted-foreground">
                    Monitor your earnings and energy contribution in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Dashboard (Placeholder) */}
          <div>
            <h3 className="font-semibold mb-4">V2G Performance Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Energy Sold (kWh)</span>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">0.0</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">₹0.00</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Settings (Placeholder) */}
          <div>
            <h3 className="font-semibold mb-4">V2G Settings</h3>
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="py-8 text-center">
                <Battery className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Configure your V2G preferences when feature is available
                </p>
                <Button disabled variant="outline">
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Configure V2G Settings
                </Button>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default V2GFeature;
