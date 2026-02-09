import { supabase } from "@/integrations/supabase/client";

type NotificationType = 
  | "verification_approved"
  | "verification_rejected"
  | "course_enrollment"
  | "withdrawal_approved"
  | "withdrawal_rejected";

interface SendNotificationParams {
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  data?: Record<string, unknown>;
}

export async function sendNotificationEmail({
  type,
  recipientEmail,
  recipientName,
  data,
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: response, error } = await supabase.functions.invoke(
      "send-notification-email",
      {
        body: { type, recipientEmail, recipientName, data },
      }
    );

    if (error) {
      console.error("Failed to send notification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error invoking email function:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Helper functions for common notification types
export const notifyVerificationApproved = (email: string, name?: string) =>
  sendNotificationEmail({
    type: "verification_approved",
    recipientEmail: email,
    recipientName: name,
  });

export const notifyVerificationRejected = (email: string, name?: string) =>
  sendNotificationEmail({
    type: "verification_rejected",
    recipientEmail: email,
    recipientName: name,
  });

export const notifyCourseEnrollment = (
  email: string,
  name: string | undefined,
  courseId: string,
  courseTitle: string,
  instructorName?: string
) =>
  sendNotificationEmail({
    type: "course_enrollment",
    recipientEmail: email,
    recipientName: name,
    data: { courseId, courseTitle, instructorName },
  });

export const notifyWithdrawalApproved = (
  email: string,
  name: string | undefined,
  amount: number
) =>
  sendNotificationEmail({
    type: "withdrawal_approved",
    recipientEmail: email,
    recipientName: name,
    data: { amount },
  });

export const notifyWithdrawalRejected = (
  email: string,
  name: string | undefined,
  amount: number
) =>
  sendNotificationEmail({
    type: "withdrawal_rejected",
    recipientEmail: email,
    recipientName: name,
    data: { amount },
  });
