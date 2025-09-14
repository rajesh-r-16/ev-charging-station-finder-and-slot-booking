import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Clock, MapPin, Car, Calendar, DollarSign, X } from 'lucide-react';

interface Booking {
  id: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  status: string;
  total_hours: number;
  total_amount: number;
  created_at: string;
  station: {
    name: string;
    address: string;
  };
}

const BookingHistory = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          station:charging_stations(name, address)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load booking history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'active':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Calendar className="h-3 w-3" />;
      case 'active':
        return <Car className="h-3 w-3" />;
      case 'completed':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Booking History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bookings found</p>
            <p className="text-sm">Your booking history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(booking.status)} className="flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Slot #{booking.slot_number}
                      </span>
                    </div>
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelBooking(booking.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{booking.station.name}</p>
                          <p className="text-muted-foreground">{booking.station.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(booking.start_time), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.total_hours}h duration</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${booking.total_amount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingHistory;