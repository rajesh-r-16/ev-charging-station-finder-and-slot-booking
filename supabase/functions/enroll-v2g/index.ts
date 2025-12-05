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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client for user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      vehicleProfileId,
      availableCapacity,
      maxDischargeRate,
      minBatteryReserve,
      participationHours
    } = await req.json();

    console.log('Enrolling in V2G:', { userId: user.id, vehicleProfileId });

    // Verify vehicle profile belongs to user
    const { data: vehicleProfile, error: profileError } = await supabaseAdmin
      .from('vehicle_profiles')
      .select('*')
      .eq('id', vehicleProfileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !vehicleProfile) {
      throw new Error('Vehicle profile not found or does not belong to you');
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from('v2g_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('vehicle_profile_id', vehicleProfileId)
      .eq('status', 'active')
      .single();

    if (existingEnrollment) {
      throw new Error('Already enrolled in V2G with this vehicle');
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('v2g_enrollments')
      .insert({
        user_id: user.id,
        vehicle_profile_id: vehicleProfileId,
        available_capacity_kwh: availableCapacity,
        max_discharge_rate_kw: maxDischargeRate || 10,
        min_battery_reserve_percent: minBatteryReserve || 20,
        participation_hours: participationHours,
        status: 'active'
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      throw enrollmentError;
    }

    console.log('V2G enrollment created:', enrollment.id);

    return new Response(JSON.stringify({ 
      enrollment,
      message: 'Successfully enrolled in V2G program!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enroll-v2g:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
