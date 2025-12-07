import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  user_id: string;
  origin_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, user_id, origin_url }: VerificationEmailRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    
    // Use the frontend origin URL for verification link
    const baseUrl = origin_url || "https://evcharger.lovable.app";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Update profile with verification token
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ verification_token: verificationToken })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating verification token:", updateError);
      throw updateError;
    }

    // Send verification email using Resend
    const emailResponse = await resend.emails.send({
      from: "EVCharger <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Email - EVCharger",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚡ EVCharger</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin-top: 0; font-size: 24px;">Verify Your Email Address</h2>
                <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                  Thank you for signing up with EVCharger! To complete your registration and access all features, please verify your email address.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #666666; line-height: 1.6; font-size: 14px;">
                  Or copy and paste this link in your browser:
                </p>
                <p style="color: #667eea; line-height: 1.6; font-size: 14px; word-break: break-all;">
                  ${verificationUrl}
                </p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.6;">
                    If you didn't create an account with EVCharger, you can safely ignore this email.
                  </p>
                </div>
              </div>
              
              <div style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © 2025 EVCharger. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent successfully",
        emailId: emailResponse.data?.id 
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
    console.error("Error in send-verification-email function:", error);
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
