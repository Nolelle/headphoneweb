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
        SELECT * FROM messages 
        WHERE id = $1 AND deleted_at IS NULL
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
        UPDATE messages
        SET 
          admin_response = $1, 
          status = 'responded', 
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(responseQuery, [response, messageId]);
      console.log("Database updated with response:", result.rows[0]);

      // 3. Send an email with the response
      let emailSent = false;
      let emailData = null;

      try {
        // Render the email content with both the original message and the response
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Response to Your Message</h2>
            <p>Thank you for contacting us about your inquiry. Here's a copy of your original message and our response:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Your Message:</h3>
              <p>${message.content}</p>
            </div>
            
            <div style="background-color: #e8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Our Response:</h3>
              <p>${response}</p>
            </div>
            
            <p>If you have any further questions, please don't hesitate to contact us again.</p>
            <p>Best regards,<br>The SoundWave Team</p>
          </div>
        `;

        const emailTo = isDevelopment ? TEST_EMAIL : message.email;

        // Send the email
        const emailResponse = await resend.emails.send({
          from: "SoundWave Customer Support <onboarding@resend.dev>",
          to: emailTo,
          subject: "Response to Your Inquiry - SoundWave",
          html: htmlContent
        });

        // Check if the email was sent successfully
        if (emailResponse.error) {
          console.error("Failed to send email:", emailResponse.error);
        } else {
          emailSent = true;
          emailData = emailResponse.data;
          console.log("Email sent successfully:", emailData);
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      // Commit the transaction
      await client.query("COMMIT");
      console.log("Database transaction committed successfully");

      // Return success response with email tracking ID
      return NextResponse.json({
        ...result.rows[0],
        emailId: emailData?.id,
        developmentMode: isDevelopment,
        success: emailSent
      });
    } catch (err) {
      // Rollback transaction on error
      await client.query("ROLLBACK");
      console.error("Error responding to message:", err);
      return NextResponse.json(
        {
          error: "Failed to process the response",
          details: err instanceof Error ? err.message : String(err)
        },
        { status: 500 }
      );
    } finally {
      // Release the client back to the pool
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
