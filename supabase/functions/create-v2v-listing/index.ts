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

    const { 
      availableEnergy, 
      location, 
      pricePerKwh, 
      availableFrom, 
      availableUntil,
      maxTransfer,
      minTransfer 
    } = await req.json();

    console.log('Creating V2V listing for user:', user.id);

    // Check if user has a vehicle profile
    const { data: vehicleProfile } = await supabase
      .from('vehicle_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!vehicleProfile) {
      throw new Error('Vehicle profile required. Please complete your profile first.');
    }

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from('v2v_listings')
      .insert({
        provider_user_id: user.id,
        available_energy_kwh: availableEnergy,
        location: location,
        price_per_kwh: pricePerKwh,
        available_from: availableFrom,
        available_until: availableUntil,
        max_transfer_kwh: maxTransfer,
        min_transfer_kwh: minTransfer || 5,
        status: 'active'
      })
      .select()
      .single();

    if (listingError) {
      console.error('Error creating listing:', listingError);
      throw listingError;
    }

    console.log('V2V listing created:', listing.id);

    return new Response(JSON.stringify({ listing }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-v2v-listing:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
