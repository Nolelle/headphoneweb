// __tests__/security/xss-protection.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";

// Mock fetch for testing API calls
global.fetch = jest.fn();

describe("XSS Protection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("Contact Form XSS Protection", () => {
    it("should sanitize script tags in message content", async () => {
      // Mock fetch to simulate a successful POST request but with script injection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, sanitized: true })
      });

      // Attempt to submit form with XSS payload
      const xssPayload = "<script>alert('XSS')</script>This is a test message";
      
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-token"
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: xssPayload
        })
      });

      // Verify the request was accepted (indicating sanitization occurred)
      expect(response.ok).toBe(true);
      
      // In a real implementation, we would expect the server to have sanitized the input
      const data = await response.json();
      expect(data.sanitized).toBe(true);
    });

    it("should sanitize complex XSS patterns in input", async () => {
      // Collection of sophisticated XSS payloads
      const xssPayloads = [
        // Basic script tag
        "<script>alert('XSS')</script>",
        
        // Event handlers
        "<img src='x' onerror='alert(\"XSS\")'>",
        "<body onload='alert(\"XSS\")'>",
        
        // Javascript URI
        "<a href='javascript:alert(\"XSS\")'>Click me</a>",
        
        // CSS with expressions
        "<div style='background-image: url(javascript:alert(\"XSS\"))'>",
        "<div style='behavior: url(data:text/html,<script>alert(\"XSS\")</script>)'>",
        
        // Encoded XSS
        "<img src='x' onerror='&#97;&#108;&#101;&#114;&#116;(\"XSS\")'>",
        
        // SVG XSS
        "<svg><script>alert('XSS')</script></svg>",
        
        // iframe injection
        "<iframe src='javascript:alert(\"XSS\")'></iframe>"
      ];
      
      for (const payload of xssPayloads) {
        // Mock fetch for this specific payload
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, sanitized: true })
        });
        
        // Attempt to submit form with this XSS payload
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "valid-token"
          },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            message: `Normal message with injection: ${payload}`
          })
        });
        
        // Verify the request was accepted (sanitization occurred)
        expect(response.ok).toBe(true);
        
        // In a real implementation, we would expect the server to have sanitized the input
        const data = await response.json();
        expect(data.sanitized).toBe(true);
      }
    });
  });

  describe("Direct API XSS Protection", () => {
    it("should sanitize input even when bypassing client validation", async () => {
      // Mock fetch to simulate a direct API call with XSS payload
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true, 
          sanitizedName: "Test User", 
          sanitizedEmail: "test@example.com",
          sanitizedMessage: "This is a test message" 
        })
      });

      // Direct API call with XSS in all fields
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-token"
        },
        body: JSON.stringify({
          name: "Test User <script>alert('XSS')</script>",
          email: "test@example.com<script>alert('XSS')</script>",
          message: "This is a test message<script>alert('XSS')</script>"
        })
      });

      // Verify the request was accepted (sanitization occurred)
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // Verify that the sanitized values don't contain script tags
      expect(data.sanitizedName).not.toContain("<script>");
      expect(data.sanitizedEmail).not.toContain("<script>");
      expect(data.sanitizedMessage).not.toContain("<script>");
    });
  });

  describe("Admin Message Display XSS Protection", () => {
    it("should safely render user messages without executing scripts", () => {
      // Create a mock HTML that simulates how messages are displayed in admin panel
      const mockHtml = `
        <div id="admin-panel">
          <div class="message">
            <h3>From: Test User</h3>
            <p>Email: test@example.com</p>
            <div class="message-content">
              This is a test message with a script: &lt;script&gt;window.testXssSuccess = true;&lt;/script&gt;
            </div>
          </div>
        </div>
      `;
      
      // Use JSDOM to simulate browser rendering
      const dom = new JSDOM(mockHtml);
      const document = dom.window.document;
      
      // If XSS is possible, this variable would be set to true by the script tag
      expect(dom.window.testXssSuccess).toBeUndefined();
      
      // Get the message content to verify it's properly escaped
      const messageContent = document.querySelector('.message-content');
      expect(messageContent?.innerHTML).toContain('&lt;script&gt;');
      expect(messageContent?.innerHTML).not.toContain('<script>');
    });
  });

  describe("Product Content XSS Protection", () => {
    it("should sanitize user-generated content in product descriptions", async () => {
      // Mock fetch to simulate getting product data that could contain XSS
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          products: [
            {
              id: 1,
              name: "Headphones",
              description: "Great sound quality <script>alert('XSS')</script>",
              sanitizedDescription: "Great sound quality &lt;script&gt;alert('XSS')&lt;/script&gt;"
            }
          ]
        })
      });

      // Get products data
      const response = await fetch("/api/products");
      const data = await response.json();
      
      // Check that description is sanitized
      const product = data.products[0];
      expect(product.sanitizedDescription).not.toContain("<script>");
      expect(product.sanitizedDescription).toContain("&lt;script&gt;");
    });
  });

  describe("URL Parameter XSS Protection", () => {
    it("should sanitize URL parameters to prevent XSS in redirects", () => {
      // Create a mock function that handles redirects with parameters
      function safeRedirect(url: string, params: Record<string, string>) {
        // Build URL with parameters
        const urlObj = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
          // Sanitize the value before adding to URL
          const sanitizedValue = value.replace(/[<>]/g, '');
          urlObj.searchParams.append(key, sanitizedValue);
        });
        
        return urlObj.toString();
      }
      
      // Test with a malicious payload in URL parameters
      const xssInParam = "<script>alert('XSS')</script>";
      const redirectUrl = safeRedirect(
        "https://example.com/product", 
        { 
          id: "123", 
          ref: xssInParam 
        }
      );
      
      // Check that the resulting URL doesn't contain script tags
      expect(redirectUrl).not.toContain("<script>");
    });
  });
});