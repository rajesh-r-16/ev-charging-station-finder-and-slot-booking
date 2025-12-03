import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Zap, Battery, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'v2v_request' | 'v2g_transaction' | 'v2v_completed';
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time V2V transaction updates
    const channel = supabase
      .channel('v2v-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'v2v_transactions'
        },
        async (payload) => {
          const transaction = payload.new;
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && transaction.provider_user_id === user.id) {
            const newNotification: Notification = {
              id: transaction.id,
              type: 'v2v_request',
              message: `New V2V energy transfer request for ${transaction.energy_transferred_kwh} kWh`,
              timestamp: new Date().toISOString(),
              read: false,
              data: transaction
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            
            toast({
              title: "New V2V Request",
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch pending V2V requests where user is provider
      const { data: v2vRequests } = await supabase
        .from('v2v_transactions')
        .select('*, v2v_listings(*)')
        .eq('provider_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent V2G transactions
      const { data: v2gTransactions } = await supabase
        .from('v2g_grid_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      const notifs: Notification[] = [];

      v2vRequests?.forEach(req => {
        notifs.push({
          id: req.id,
          type: 'v2v_request',
          message: `V2V request for ${req.energy_transferred_kwh} kWh - ₹${req.total_cost.toFixed(2)}`,
          timestamp: req.created_at,
          read: false,
          data: req
        });
      });

      v2gTransactions?.forEach(txn => {
        notifs.push({
          id: txn.id,
          type: 'v2g_transaction',
          message: `V2G: Sold ${txn.energy_discharged_kwh} kWh, earned ₹${txn.earnings.toFixed(2)}`,
          timestamp: txn.timestamp,
          read: false,
          data: txn
        });
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'v2v_request':
        return <Zap className="h-4 w-4" />;
      case 'v2g_transaction':
        return <Battery className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No new notifications
          </p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-full">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notif.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                {!notif.read && (
                  <Badge variant="secondary" className="bg-primary/20">New</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
