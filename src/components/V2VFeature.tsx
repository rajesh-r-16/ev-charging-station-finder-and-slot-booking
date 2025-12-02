import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Battery, Zap } from 'lucide-react';
import EnhancedV2VMarketplace from './EnhancedV2VMarketplace';

const V2VFeature = () => {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicle-to-Vehicle (V2V) Charging
              </CardTitle>
              <CardDescription className="mt-2">
                Share or request power from other EV owners in your area
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
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Battery className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Share Power</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Help other EV owners by sharing your vehicle's battery power
              </p>
            </div>

            <div className="p-4 bg-secondary/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
                <h3 className="font-semibold">Request Help</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Find nearby EV owners willing to share emergency charge
              </p>
            </div>

            <div className="p-4 bg-green-500/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold">Earn Rewards</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get paid for helping other EV owners in need
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Feature Benefits
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Emergency charging assistance when you need it most
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Build a community of helpful EV owners
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Earn money by helping others charge their vehicles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Real-time location tracking for nearby available vehicles
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* V2V Marketplace */}
      <EnhancedV2VMarketplace />
    </div>
  );
};

export default V2VFeature;
