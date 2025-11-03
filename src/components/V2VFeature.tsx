import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Battery, MapPin, Clock, Zap } from 'lucide-react';

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
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Coming Soon
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
                Get credits for helping other EV owners in need
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="font-semibold mb-4">How V2V Charging Works</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Request or Offer</p>
                  <p className="text-sm text-muted-foreground">
                    Post a request for emergency charge or offer your available battery power
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Connect Nearby</p>
                  <p className="text-sm text-muted-foreground">
                    Find and connect with EV owners within your proximity using our map
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Share Power</p>
                  <p className="text-sm text-muted-foreground">
                    Use V2V charging cable to transfer power between vehicles safely
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Complete & Earn</p>
                  <p className="text-sm text-muted-foreground">
                    Transaction completes automatically with credits or payment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Requests (Placeholder) */}
          <div>
            <h3 className="font-semibold mb-4">Nearby V2V Requests</h3>
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="py-8 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No active V2V requests in your area
                </p>
                <Button disabled variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Create V2V Request
                </Button>
              </CardContent>
            </Card>
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
                Earn credits by helping others charge their vehicles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Real-time location tracking for nearby available vehicles
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default V2VFeature;
