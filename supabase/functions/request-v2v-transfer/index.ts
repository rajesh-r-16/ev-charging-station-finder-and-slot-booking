import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { listingId, energyRequested } = await req.json();

    console.log('V2V transfer request:', { listingId, energyRequested, userId: user.id });

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('v2v_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found');
    }

    if (listing.provider_user_id === user.id) {
      throw new Error('Cannot request transfer from your own listing');
    }

    if (energyRequested < listing.min_transfer_kwh || energyRequested > listing.max_transfer_kwh) {
      throw new Error(`Energy must be between ${listing.min_transfer_kwh} and ${listing.max_transfer_kwh} kWh`);
    }

    const totalCost = energyRequested * listing.price_per_kwh;

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('v2v_transactions')
      .insert({
        listing_id: listingId,
        provider_user_id: listing.provider_user_id,
        receiver_user_id: user.id,
        energy_transferred_kwh: energyRequested,
        total_cost: totalCost,
        status: 'pending'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw transactionError;
    }

    console.log('V2V transaction created:', transaction.id);

    // Create notification for provider (using a simple approach)
    // In a real app, you'd use a proper notification system
    console.log('Notification: User', listing.provider_user_id, 'has a new V2V request from', user.id);

    return new Response(JSON.stringify({ transaction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in request-v2v-transfer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
