// app/api/admin/messages/[id]/respond/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import pool from "@/db/helpers/db";
import { Resend } from "resend";

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Development configuration
const TEST_EMAIL = "eyu1@ualberta.ca"; // Your verified email
const isDevelopment = process.env.NODE_ENV === "development";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract the message ID from params (Next.js 15 makes params a Promise)
  const { id: messageId } = await params;

  try {
    const { response } = await request.json();
    console.log(`Handling response to message ${messageId}:`, response);

    // Start a database transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find the message to respond to
      const messageQuery = `
        SELECT * FROM contact_message 
        WHERE message_id = $1
      `;

      const messageResult = await client.query(messageQuery, [messageId]);

      if (messageResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      const message = messageResult.rows[0];

      // 2. Add the response to the database
      const responseQuery = `
        UPDATE contact_message
        SET 
          admin_response = $1, 
          status = 'RESPONDED', 
          responded_at = NOW(),
          updated_at = NOW()
        WHERE message_id = $2
        RETURNING *
      `;

      const result = await client.query(responseQuery, [response, messageId]);
      console.log("Database updated with response:", result.rows[0]);

      // Commit the transaction and release the client BEFORE sending email
      await client.query("COMMIT");
      client.release();

      // Store the result for response
      const updatedMessage = result.rows[0];

      // 3. Send an email with the response - AFTER database transaction is complete
      let emailSent = false;

      // Only attempt to send email if we have a valid email address
      if (message.email) {
        try {
          const targetEmail = isDevelopment ? TEST_EMAIL : message.email;

          // Send email but don't wait for it to complete
          resend.emails
            .send({
              from: "Bone+ <admin@boneplus.ca>",
              to: targetEmail,
              subject: "Response to your inquiry",
              text: `Dear ${
                message.name || "Customer"
              },\n\nThank you for contacting us. Here's our response to your inquiry:\n\n${response}\n\nOriginal message:\n${
                message.message
              }\n\nBest regards,\nBone+ Team`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Response to Your Inquiry</h2>
                <p>Dear ${message.name || "Customer"},</p>
                <p>Thank you for contacting us. Here's our response to your inquiry:</p>
                <div style="padding: 15px; background-color: #f7f7f7; border-left: 4px solid #0070f3; margin: 20px 0;">
                  <p style="white-space: pre-wrap;">${response}</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; font-size: 0.9em;">Your original message:</p>
                  <p style="color: #666; font-style: italic; font-size: 0.9em; white-space: pre-wrap;">${
                    message.message
                  }</p>
                </div>
                <div style="margin-top: 30px; color: #666; font-size: 0.8em;">
                  <p>Best regards,<br>Bone+ Team</p>
                </div>
              </div>
            `
            })
            .then((data) => {
              console.log("Email sent:", data);
            })
            .catch((emailError) => {
              console.error("Error sending email:", emailError);
            });

          emailSent = true;
        } catch (emailError) {
          console.error("Error setting up email:", emailError);
          // We won't fail the request if email sending fails
        }
      }

      // Return success response with email tracking ID - no need to wait for email to complete
      return NextResponse.json({
        success: true,
        message: updatedMessage,
        emailSent
      });
    } catch (err) {
      // Rollback transaction on error
      await client.query("ROLLBACK");
      console.error("Error responding to message:", err);
      client.release();
      return NextResponse.json(
        {
          error: "Failed to process the response",
          details: err instanceof Error ? err.message : String(err)
        },
        { status: 500 }
      );
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
