import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PhoneOTPRequest {
  phone: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, user_id }: PhoneOTPRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in profiles table (in production, use a separate table with expiry)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        verification_token: `PHONE_OTP:${otp}`,
        phone: phone 
      })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error storing OTP:", updateError);
      throw updateError;
    }

    // In production, integrate with an SMS service like Twilio
    // For demo purposes, we'll log the OTP
    console.log(`OTP for ${phone}: ${otp}`);
    console.log("In production, this would be sent via SMS service");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully (check console in demo mode)",
        // Only for demo - remove in production
        demo_otp: otp 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-phone-otp function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
