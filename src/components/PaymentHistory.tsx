import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Calendar, DollarSign, Receipt, TrendingUp } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  payment_date: string;
  booking: {
    station: {
      name: string;
    };
    slot_number: number;
  };
}

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            slot_number,
            station:charging_stations(name)
          )
        `)
        .eq('user_id', user?.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      const paymentsData = data || [];
      setPayments(paymentsData);
      
      const total = paymentsData
        .filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      setTotalSpent(total);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    return <CreditCard className="h-4 w-4" />;
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
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">₹{totalSpent.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{payments.length}</div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {payments.filter(p => p.payment_status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">Successful Payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments found</p>
              <p className="text-sm">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getPaymentMethodIcon(payment.payment_method)}
                        </div>
                        <div>
                          <p className="font-medium">{payment.booking?.station?.name || 'Unknown Station'}</p>
                          <p className="text-sm text-muted-foreground">
                            Slot #{payment.booking?.slot_number} • {payment.payment_method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{payment.amount}</div>
                        <Badge variant={getStatusColor(payment.payment_status)}>
                          {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(payment.payment_date), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      {payment.transaction_id && (
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          <span className="font-mono text-xs">
                            ID: {payment.transaction_id.slice(-8)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;