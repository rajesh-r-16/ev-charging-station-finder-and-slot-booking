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
    const { startLocation, endLocation, currentSoc, targetSoc, optimizationModes } = await req.json();
    
    console.log('Calculating routes with AI:', { startLocation, endLocation, currentSoc, targetSoc, optimizationModes });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch nearby charging stations and V2V listings
    const { data: stations } = await supabase
      .from('charging_stations')
      .select('*')
      .limit(20);

    const { data: v2vListings } = await supabase
      .from('v2v_listings')
      .select('*')
      .eq('status', 'active')
      .limit(10);

    // Build AI prompt for route planning
    const prompt = `You are an EV route planning AI. Calculate optimal routes between these locations:
Start: ${startLocation}
End: ${endLocation}
Current Battery: ${currentSoc}%
Target Battery: ${targetSoc}%

Available charging stations: ${JSON.stringify(stations)}
Available V2V listings: ${JSON.stringify(v2vListings)}

Generate routes optimized for: ${optimizationModes.join(', ')}

For each optimization mode, provide:
1. Route name
2. Total distance (km)
3. Total duration (minutes)
4. Total cost ($)
5. Carbon footprint (kg CO2)
6. List of charging stops with location, duration, and cost
7. Whether V2V/V2G options are used

Return as JSON array with these exact fields: mode, distance, duration, cost, carbonFootprint, chargingStops (array with name, duration, cost, type).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an EV route planning assistant. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    // Parse AI response
    let routes;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      routes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error("Error parsing AI response:", e, content);
      routes = [];
    }

    console.log('Routes calculated:', routes.length);

    return new Response(JSON.stringify({ routes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-route:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
