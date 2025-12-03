import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CreditCard, Zap, MapPin, Star, Car, Battery, Timer, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  available_slots: number;
  total_slots: number;
  amenities: string[] | null;
}

const EnhancedBookingInterface = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  useEffect(() => {
    fetchStations();
    if (user) {
      fetchUserBookings();
    }
  }, [user]);

  const fetchStations = async () => {
    const { data, error } = await supabase
      .from('charging_stations')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching stations:', error);
      return;
    }
    
    setStations(data || []);
    if (data && data.length > 0) {
      setSelectedStation(data[0]);
    }
  };

  const fetchUserBookings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }
    
    setBookings(data || []);
  };

  const calculateTotal = () => {
    if (!selectedStation) return 0;
    return selectedStation.price_per_hour * duration;
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a booking.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStation || !selectedDate || !selectedTime || !selectedSlot || !paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all booking details.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    try {
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + duration);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          station_id: selectedStation.id,
          slot_number: selectedSlot,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          total_hours: duration,
          total_amount: calculateTotal(),
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          booking_id: booking.id,
          amount: calculateTotal(),
          payment_method: paymentMethod,
          payment_status: 'completed',
          transaction_id: `txn_${Date.now()}`
        });

      if (paymentError) throw paymentError;

      // Update station available slots
      const { error: updateError } = await supabase
        .from('charging_stations')
        .update({ 
          available_slots: selectedStation.available_slots - 1 
        })
        .eq('id', selectedStation.id);

      if (updateError) throw updateError;

      toast({
        title: "Booking Confirmed!",
        description: `Your charging slot has been reserved for ${format(selectedDate, 'PPP')} at ${selectedTime}.`,
      });

      // Reset form
      setSelectedSlot(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setPaymentMethod("");
      
      // Refresh data
      fetchStations();
      fetchUserBookings();

    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (!selectedStation) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-muted-foreground">Loading charging stations...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">
              Book Your Charging Slot
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Reserve your charging time and skip the wait
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Station Selection */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
            <h3 className="text-xl font-semibold mb-4">Select Station</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stations.map((station) => (
                <Card 
                  key={station.id}
                  className={`p-4 cursor-pointer transition-all duration-300 ${
                    selectedStation.id === station.id 
                      ? 'border-primary bg-primary/10' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedStation(station)}
                >
                  <h4 className="font-medium mb-1">{station.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{station.address}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-electric-green font-medium">
                      ₹{station.price_per_hour}/hr
                    </span>
                    <Badge variant={station.available_slots > 0 ? "default" : "destructive"}>
                      {station.available_slots}/{station.total_slots} available
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Station Details & Booking */}
          <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">{selectedStation.name}</h3>
                <p className="text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  {selectedStation.address}
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">DC Fast Charging</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-electric-amber text-electric-amber" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-electric-green mb-1">
                  ₹{selectedStation.price_per_hour}/hr
                </div>
                <div className="text-sm text-muted-foreground">per hour</div>
              </div>
            </div>

            {/* Amenities */}
            {selectedStation.amenities && selectedStation.amenities.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStation.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Charging Port Selection */}
            <div className="mb-6">
              <Label className="text-base font-medium mb-3 block">Select Charging Port</Label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: selectedStation.total_slots }, (_, i) => i + 1).map((port) => {
                  const isOccupied = port > selectedStation.available_slots;
                  return (
                    <Button
                      key={port}
                      variant={selectedSlot === port ? "default" : "outline"}
                      size="sm"
                      className="h-12"
                      onClick={() => !isOccupied && setSelectedSlot(port)}
                      disabled={isOccupied}
                    >
                      {isOccupied ? (
                        <Zap className="h-4 w-4 text-electric-green" />
                      ) : (
                        port
                      )}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Green ports are currently occupied
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Date & Time Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Select Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Select Time
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">
                    <Timer className="h-4 w-4 inline mr-2" />
                    Duration
                  </Label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment & Summary */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    Payment Method
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Summary */}
                {selectedSlot && selectedDate && selectedTime && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-medium mb-2">Booking Summary</h4>
                    <div className="text-sm space-y-1">
                      <p>Station: {selectedStation.name}</p>
                      <p>Port: {selectedSlot}</p>
                      <p>Date: {format(selectedDate, 'PPP')}</p>
                      <p>Time: {selectedTime}</p>
                      <p>Duration: {duration} hour{duration > 1 ? 's' : ''}</p>
                      <div className="border-t pt-2 mt-2">
                        <p className="font-medium text-electric-green text-lg">
                          Total: ₹{calculateTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-electric-blue hover:from-primary/80 hover:to-electric-blue/80"
                  disabled={!selectedSlot || !selectedDate || !selectedTime || !paymentMethod || isBooking}
                  onClick={handleBooking}
                >
                  {isBooking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Book & Pay ₹{calculateTotal().toFixed(2)}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment • Cancel anytime before arrival
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Bookings */}
        {user && bookings.length > 0 && (
          <Card className="mt-8 p-6 bg-card/50 backdrop-blur-sm border border-border/50">
            <h3 className="text-xl font-semibold mb-4">Your Recent Bookings</h3>
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium">Slot {booking.slot_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.start_time), 'PPP')} at {format(new Date(booking.start_time), 'HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm text-electric-green font-medium mt-1">
                      ₹{booking.total_amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};

export default EnhancedBookingInterface;