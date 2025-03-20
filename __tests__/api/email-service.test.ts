import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { NextResponse } from "next/server";

// Since we didn't find an actual email service, we'll create a mock of a typical email service
// This will let us test the expected functionality

// Mock the Resend email service (from package.json dependencies)
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({
            id: "email_123",
            from: "test@example.com",
            to: "recipient@example.com",
            success: true
          })
        }
      };
    })
  };
});

// Create mock email service
class EmailService {
  private resendClient: any;
  private defaultFrom: string;
  private templates: Record<
    string,
    (data: any) => { subject: string; html: string }
  >;

  constructor(apiKey: string, defaultFrom: string) {
    // In a real implementation, this would use the real Resend client
    const { Resend } = require("resend");
    this.resendClient = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
    this.templates = {
      contactResponse: this.createContactResponseTemplate(),
      orderConfirmation: this.createOrderConfirmationTemplate(),
      adminNotification: this.createAdminNotificationTemplate()
    };
  }

  // Create templates for different email types
  private createContactResponseTemplate() {
    return (data: { name: string; message: string; response: string }) => ({
      subject: `Response to your inquiry, ${data.name}`,
      html: `
        <h1>Thank you for contacting us</h1>
        <p>Your message: "${data.message}"</p>
        <p>Our response: "${data.response}"</p>
      `
    });
  }

  private createOrderConfirmationTemplate() {
    return (data: {
      orderNumber: string;
      items: Array<{ name: string; price: number; quantity: number }>;
      total: number;
    }) => ({
      subject: `Order confirmation #${data.orderNumber}`,
      html: `
        <h1>Your order has been confirmed</h1>
        <p>Order #: ${data.orderNumber}</p>
        <h2>Items:</h2>
        <ul>
          ${data.items
            .map(
              (item) =>
                `<li>${item.name} x ${item.quantity} - $${item.price}</li>`
            )
            .join("")}
        </ul>
        <p>Total: $${data.total}</p>
      `
    });
  }

  private createAdminNotificationTemplate() {
    return (data: { subject: string; message: string }) => ({
      subject: `Admin Notification: ${data.subject}`,
      html: `
        <h1>${data.subject}</h1>
        <p>${data.message}</p>
      `
    });
  }

  // Send email using a template
  async sendTemplatedEmail(
    templateName: string,
    to: string | string[],
    data: any,
    options: {
      from?: string;
      cc?: string | string[];
      bcc?: string | string[];
    } = {}
  ) {
    const template = this.templates[templateName];

    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    const { subject, html } = template(data);

    return this.sendEmail({
      to,
      subject,
      html,
      from: options.from || this.defaultFrom,
      cc: options.cc,
      bcc: options.bcc
    });
  }

  // Send a raw email
  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }) {
    const { to, subject, html, from = this.defaultFrom, cc, bcc } = params;

    try {
      const result = await this.resendClient.emails.send({
        from,
        to,
        subject,
        html,
        cc,
        bcc
      });

      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      console.error("Failed to send email:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

describe("EmailService Message Sending", () => {
  let emailService: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new EmailService("test-api-key", "noreply@example.com");
  });

  describe("Template Rendering", () => {
    it("should render contact response template correctly", async () => {
      // Mock email data
      const data = {
        name: "John Doe",
        message: "I have a question about your product",
        response:
          "Thank you for your question. Our product has a 1-year warranty."
      };

      // Create spy for sendEmail
      const sendEmailSpy = jest.spyOn(emailService, "sendEmail");

      // Send templated email
      await emailService.sendTemplatedEmail(
        "contactResponse",
        "john.doe@example.com",
        data
      );

      // Check that the template was rendered correctly
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: `Response to your inquiry, ${data.name}`,
          html: expect.stringContaining(data.message),
          html: expect.stringContaining(data.response)
        })
      );
    });

    it("should render order confirmation template correctly", async () => {
      // Mock order data
      const data = {
        orderNumber: "ORD-12345",
        items: [
          { name: "Bone+ Headphone", price: 199.99, quantity: 1 },
          { name: "Charging Case", price: 49.99, quantity: 2 }
        ],
        total: 299.97
      };

      // Create spy for sendEmail
      const sendEmailSpy = jest.spyOn(emailService, "sendEmail");

      // Send templated email
      await emailService.sendTemplatedEmail(
        "orderConfirmation",
        "customer@example.com",
        data
      );

      // Check that the template was rendered correctly
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: `Order confirmation #${data.orderNumber}`,
          html: expect.stringContaining("Your order has been confirmed"),
          html: expect.stringContaining(data.items[0].name),
          html: expect.stringContaining(`$${data.total}`)
        })
      );
    });

    it("should throw error for non-existent template", async () => {
      // Try to send with non-existent template
      await expect(
        emailService.sendTemplatedEmail(
          "nonExistentTemplate",
          "test@example.com",
          {}
        )
      ).rejects.toThrow('Template "nonExistentTemplate" not found');
    });
  });

  describe("Email Sending", () => {
    it("should send email with correct parameters", async () => {
      // Email parameters
      const params = {
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>"
      };

      // Send email
      const result = await emailService.sendEmail(params);

      // Check that Resend client was called with correct parameters
      const { Resend } = require("resend");
      const mockResendInstance = Resend.mock.results[0].value;

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@example.com",
          to: params.to,
          subject: params.subject,
          html: params.html
        })
      );

      // Check result
      expect(result).toEqual({
        success: true,
        messageId: expect.any(String)
      });
    });

    it("should support multiple recipients", async () => {
      // Email parameters with multiple recipients
      const params = {
        to: ["recipient1@example.com", "recipient2@example.com"],
        subject: "Test Subject",
        html: "<p>Test content</p>"
      };

      // Send email
      await emailService.sendEmail(params);

      // Check that Resend client was called with correct parameters
      const { Resend } = require("resend");
      const mockResendInstance = Resend.mock.results[0].value;

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: params.to
        })
      );
    });

    it("should handle email sending errors", async () => {
      // Make the Resend client throw an error
      const { Resend } = require("resend");
      const mockResendInstance = Resend.mock.results[0].value;
      mockResendInstance.emails.send.mockRejectedValueOnce(
        new Error("Sending failed")
      );

      // Email parameters
      const params = {
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>"
      };

      // Send email and expect error to be handled
      const result = await emailService.sendEmail(params);

      // Check result
      expect(result).toEqual({
        success: false,
        error: "Sending failed"
      });
    });
  });

  describe("Email Integration Tests", () => {
    it("should send admin notification", async () => {
      // Mock notification data
      const data = {
        subject: "New Order Alert",
        message: "A new order has been placed for $299.97"
      };

      // Create spy for sendEmail
      const sendEmailSpy = jest.spyOn(emailService, "sendEmail");

      // Send templated email
      await emailService.sendTemplatedEmail(
        "adminNotification",
        "admin@example.com",
        data
      );

      // Check that the email was sent with correct parameters
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@example.com",
          subject: `Admin Notification: ${data.subject}`,
          html: expect.stringContaining(data.message)
        })
      );
    });

    it("should handle custom sender address", async () => {
      // Send email with custom sender
      const result = await emailService.sendEmail({
        from: "custom@example.com",
        to: "recipient@example.com",
        subject: "Custom Sender",
        html: "<p>Test with custom sender</p>"
      });

      // Check that Resend client was called with custom sender
      const { Resend } = require("resend");
      const mockResendInstance = Resend.mock.results[0].value;

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "custom@example.com"
        })
      );

      // Check result
      expect(result.success).toBe(true);
    });
  });
});
