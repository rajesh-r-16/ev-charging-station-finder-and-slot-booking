import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CreditCard, Zap, MapPin, Star } from "lucide-react";

const BookingInterface = () => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const mockStation = {
    name: "Tesla Supercharger - City Center",
    address: "123 Main St, Downtown",
    rating: 4.8,
    chargingSpeed: "150 kW",
    price: "$0.35/kWh",
    estimatedCost: "$12.50",
    estimatedTime: "35 min"
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">
              Book Your Slot
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Reserve your charging time and skip the wait
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Station Details */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">{mockStation.name}</h3>
                <p className="text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  {mockStation.address}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-electric-amber text-electric-amber" />
                    <span className="text-sm font-medium">{mockStation.rating}</span>
                  </div>
                  <Badge variant="outline">{mockStation.chargingSpeed}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-electric-green mb-1">
                  {mockStation.price}
                </div>
                <div className="text-sm text-muted-foreground">per kWh</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-secondary/50 rounded-lg text-center">
                <div className="text-lg font-semibold text-primary mb-1">
                  {mockStation.estimatedCost}
                </div>
                <div className="text-sm text-muted-foreground">Est. Cost</div>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg text-center">
                <div className="text-lg font-semibold text-electric-blue mb-1">
                  {mockStation.estimatedTime}
                </div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
            </div>

            {/* Charging Port Selection */}
            <div className="mb-6">
              <Label className="text-base font-medium mb-3 block">Select Charging Port</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((port) => (
                  <Button
                    key={port}
                    variant={selectedSlot === `port-${port}` ? "electric" : "outline"}
                    size="sm"
                    className="h-12"
                    onClick={() => setSelectedSlot(`port-${port}`)}
                    disabled={port === 3 || port === 6} // Mock occupied ports
                  >
                    {port === 3 || port === 6 ? (
                      <Zap className="h-4 w-4 text-electric-green" />
                    ) : (
                      port
                    )}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Green ports are currently occupied
              </p>
            </div>
          </Card>

          {/* Booking Form */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
            <h3 className="text-xl font-semibold mb-6">Schedule Your Charge</h3>
            
            <div className="space-y-6">
              {/* Date Selection */}
              <div>
                <Label htmlFor="date" className="text-base font-medium mb-3 block">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Select Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>

              {/* Time Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Select Time
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "electric" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      disabled={time === "12:00" || time === "15:00"} // Mock busy times
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <Label htmlFor="duration" className="text-base font-medium mb-3 block">
                  Charging Duration
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">30 min</Button>
                  <Button variant="electric" size="sm">1 hour</Button>
                  <Button variant="outline" size="sm">2 hours</Button>
                </div>
              </div>

              {/* Booking Summary */}
              {selectedSlot && selectedDate && selectedTime && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-medium mb-2">Booking Summary</h4>
                  <div className="text-sm space-y-1">
                    <p>Port: {selectedSlot.replace('port-', 'Port ')}</p>
                    <p>Date: {selectedDate}</p>
                    <p>Time: {selectedTime}</p>
                    <p>Duration: 1 hour</p>
                    <p className="font-medium text-electric-green">Total: {mockStation.estimatedCost}</p>
                  </div>
                </div>
              )}

              {/* Payment & Book Button */}
              <div className="space-y-3">
                <Button 
                  variant="electric" 
                  size="lg" 
                  className="w-full"
                  disabled={!selectedSlot || !selectedDate || !selectedTime}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Book & Pay {mockStation.estimatedCost}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment • Cancel anytime before arrival
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BookingInterface;