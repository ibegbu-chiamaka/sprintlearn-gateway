import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 
  | "verification_approved"
  | "verification_rejected"
  | "course_enrollment"
  | "withdrawal_approved"
  | "withdrawal_rejected";

interface NotificationRequest {
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  data?: Record<string, unknown>;
}

function getEmailContent(
  type: NotificationType,
  recipientName: string,
  data: Record<string, unknown> = {}
): { subject: string; html: string } {
  const name = recipientName || "there";

  switch (type) {
    case "verification_approved":
      return {
        subject: "🎉 Congratulations! You're now a Verified Expert on SkillSprint",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">⚡ SkillSprint</h1>
            </div>
            <h2 style="color: #333;">Congratulations, ${name}! 🎉</h2>
            <p style="color: #555; line-height: 1.6;">
              Great news! Your application to become a <strong>Verified Expert</strong> on SkillSprint has been approved.
            </p>
            <p style="color: #555; line-height: 1.6;">
              You now have access to exclusive features:
            </p>
            <ul style="color: #555; line-height: 1.8;">
              <li>✅ Verified badge on your profile</li>
              <li>✅ Priority placement in search results</li>
              <li>✅ Access to advanced analytics</li>
              <li>✅ Higher visibility to students</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL") || "https://skillsprint.app"}/dashboard/instructor" 
                 style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} SkillSprint. All rights reserved.
            </p>
          </div>
        `,
      };

    case "verification_rejected":
      return {
        subject: "Update on Your SkillSprint Verification Request",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">⚡ SkillSprint</h1>
            </div>
            <h2 style="color: #333;">Hi ${name},</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for your interest in becoming a Verified Expert on SkillSprint.
            </p>
            <p style="color: #555; line-height: 1.6;">
              After reviewing your application, we're unable to approve your verification request at this time. This doesn't affect your ability to create and publish courses on our platform.
            </p>
            <p style="color: #555; line-height: 1.6;">
              You're welcome to reapply after updating your profile and documentation. If you have questions, please don't hesitate to reach out.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Keep creating great content!
            </p>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} SkillSprint. All rights reserved.
            </p>
          </div>
        `,
      };

    case "course_enrollment":
      return {
        subject: `🎓 Welcome to "${data.courseTitle || "your new course"}"!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">⚡ SkillSprint</h1>
            </div>
            <h2 style="color: #333;">Welcome aboard, ${name}! 🚀</h2>
            <p style="color: #555; line-height: 1.6;">
              You've successfully enrolled in <strong>"${data.courseTitle || "the course"}"</strong>${data.instructorName ? ` by ${data.instructorName}` : ""}.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Here's what you can expect:
            </p>
            <ul style="color: #555; line-height: 1.8;">
              <li>📚 Structured learning modules</li>
              <li>🎯 Interactive quizzes to test your knowledge</li>
              <li>📜 Certificate upon completion</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL") || "https://skillsprint.app"}/course/${data.courseId}" 
                 style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Start Learning
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} SkillSprint. All rights reserved.
            </p>
          </div>
        `,
      };

    case "withdrawal_approved":
      return {
        subject: "💰 Your Withdrawal Request Has Been Approved",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">⚡ SkillSprint</h1>
            </div>
            <h2 style="color: #333;">Good news, ${name}! 💰</h2>
            <p style="color: #555; line-height: 1.6;">
              Your withdrawal request has been approved and is being processed.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #166534; margin: 0; font-size: 24px; font-weight: bold;">
                $${Number(data.amount || 0).toFixed(2)}
              </p>
              <p style="color: #15803d; margin: 5px 0 0; font-size: 14px;">Amount Approved</p>
            </div>
            <p style="color: #555; line-height: 1.6;">
              The funds should arrive in your account within 3-5 business days, depending on your payment method.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Thank you for being a valued instructor on SkillSprint!
            </p>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} SkillSprint. All rights reserved.
            </p>
          </div>
        `,
      };

    case "withdrawal_rejected":
      return {
        subject: "Update on Your Withdrawal Request",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">⚡ SkillSprint</h1>
            </div>
            <h2 style="color: #333;">Hi ${name},</h2>
            <p style="color: #555; line-height: 1.6;">
              We were unable to process your withdrawal request for <strong>$${Number(data.amount || 0).toFixed(2)}</strong> at this time.
            </p>
            <p style="color: #555; line-height: 1.6;">
              This may be due to incomplete payment information or other verification requirements. Please review your payout settings and try again.
            </p>
            <p style="color: #555; line-height: 1.6;">
              If you believe this is an error, please contact our support team for assistance.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL") || "https://skillsprint.app"}/dashboard/instructor" 
                 style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} SkillSprint. All rights reserved.
            </p>
          </div>
        `,
      };

    default:
      return {
        subject: "Notification from SkillSprint",
        html: `<p>You have a new notification from SkillSprint.</p>`,
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for auth verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication (optional - allow both authenticated and service calls)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError) {
        console.log("Auth warning (proceeding anyway):", authError.message);
      }
    }

    const { type, recipientEmail, recipientName, data }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${recipientEmail}`);

    // Validate required fields
    if (!type || !recipientEmail) {
      throw new Error("Missing required fields: type and recipientEmail");
    }

    const { subject, html } = getEmailContent(type, recipientName || "", data || {});

    const emailResponse = await resend.emails.send({
      from: "SkillSprint <noreply@resend.dev>", // Replace with your verified domain in production
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending notification email:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
