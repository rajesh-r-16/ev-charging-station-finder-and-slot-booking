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
    
    // Store OTP with expiry (15 minutes)
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        verification_token: `PHONE_OTP:${otp}:${otpExpiry}`,
        phone: phone 
      })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error storing OTP:", updateError);
      throw updateError;
    }

    // Check if Twilio credentials are configured
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (twilioSid && twilioToken && twilioPhone) {
      // Send SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append("To", phone);
      formData.append("From", twilioPhone);
      formData.append("Body", `Your EVCharger verification code is: ${otp}. This code expires in 15 minutes.`);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        },
        body: formData.toString(),
      });

      const twilioResult = await twilioResponse.json();

      if (!twilioResponse.ok) {
        console.error("Twilio error:", twilioResult);
        throw new Error(twilioResult.message || "Failed to send SMS");
      }

      console.log("SMS sent successfully via Twilio:", twilioResult.sid);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP sent to your phone number"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      // Demo mode - no Twilio credentials
      console.log(`Demo mode - OTP for ${phone}: ${otp}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP sent (demo mode). SMS delivery is not configured; contact an administrator."
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
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
