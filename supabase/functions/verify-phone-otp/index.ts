import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  otp: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { otp, user_id }: VerifyOTPRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get stored OTP from profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("verification_token, phone")
      .eq("user_id", user_id)
      .single();

    if (fetchError || !profile) {
      throw new Error("Profile not found");
    }

    const storedToken = profile.verification_token;
    
    // Check if it's a phone OTP
    if (!storedToken || !storedToken.startsWith("PHONE_OTP:")) {
      throw new Error("No phone verification in progress");
    }

    // Parse stored OTP and expiry
    const parts = storedToken.split(":");
    const storedOTP = parts[1];
    const expiry = parts[2] ? new Date(parts[2]) : null;

    // Check if OTP has expired
    if (expiry && new Date() > expiry) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OTP has expired. Please request a new one." 
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Verify OTP
    if (storedOTP !== otp) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid OTP" 
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Mark phone as verified and clear the OTP
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        verification_token: null,
        verified_at: new Date().toISOString()
      })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating verification status:", updateError);
      throw updateError;
    }

    console.log(`Phone verified for user ${user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Phone verified successfully" 
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
    console.error("Error in verify-phone-otp function:", error);
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
