// app/api/admin/messages/[id]/respond/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";
import { Resend } from "resend";

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Development configuration
const TEST_EMAIL = "eyu1@ualberta.ca"; // Your verified email
const isDevelopment = process.env.NODE_ENV === "development";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { response } = await request.json();
    const messageId = params.id;

    // Start a database transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get the message details including customer info
      const messageResult = await client.query(
        `SELECT email, name, message FROM contact_message WHERE message_id = $1`,
        [messageId]
      );

      if (messageResult.rows.length === 0) {
        throw new Error("Message not found");
      }

      const { email, name, message } = messageResult.rows[0];

      // Create base HTML email content
      const baseHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${name},</h2>
          
          <p style="color: #666; margin-bottom: 20px;">
            Thank you for contacting Bone+ Support. Here is our response to your inquiry:
          </p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Your Original Message:</h3>
            <p style="color: #666;">${message}</p>
          </div>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Our Response:</h3>
            <p style="color: #666;">${response}</p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            If you have any further questions, please don't hesitate to contact us again.
          </p>
          
          <p style="color: #666;">
            Best regards,<br>
            The Bone+ Support Team
          </p>
        </div>
      `;

      // Add development mode notice if in development
      const htmlContent = isDevelopment
        ? `
          ${baseHtmlContent}
          <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border: 1px solid #ddd;">
            <p style="color: #666; margin: 0;">
              <strong>Development Mode Notice:</strong><br>
              Original recipient would have been: ${email}<br>
              This email is being sent to your test email (${TEST_EMAIL}) because we're in development mode.
            </p>
          </div>
        `
        : baseHtmlContent;

      // Log email details in development
      if (isDevelopment) {
        console.log("Development Mode: Sending email to test address");
        console.log("Original recipient:", email);
        console.log("Test recipient:", TEST_EMAIL);
      }

      // Send the email using Resend
      const emailResult = await resend.emails.send({
        from: "Bone+ Support <onboarding@resend.dev>",
        to: isDevelopment ? TEST_EMAIL : email,
        subject: "Response to Your Inquiry - Bone+",
        html: htmlContent
      });

      // Log the email result in development
      if (isDevelopment) {
        console.log("Resend API response:", emailResult);
      }

      if (emailResult.error) {
        throw new Error(`Failed to send email: ${emailResult.error.message}`);
      }

      // Update the message status in the database
      const result = await client.query(
        `UPDATE contact_message 
         SET admin_response = $1,
             responded_at = CURRENT_TIMESTAMP,
             status = 'RESPONDED'
         WHERE message_id = $2
         RETURNING *`,
        [response, messageId]
      );

      await client.query("COMMIT");

      // Return success response with email tracking ID
      return NextResponse.json({
        ...result.rows[0],
        emailId: emailResult.data?.id,
        developmentMode: isDevelopment
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error responding to message:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send response",
        details: isDevelopment ? error : undefined
      },
      { status: 500 }
    );
  }
}
