import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function POST(request: Request) {
  // Log the entire request for debugging
  console.log(
    "Incoming request headers:",
    Object.fromEntries(request.headers.entries())
  );

  try {
    // More robust JSON parsing with error handling
    let body;
    try {
      body = await request.json();
      console.log("Parsed request body:", body);
    } catch (parseError) {
      // Log raw request body if JSON parsing fails
      const rawBody = await request.text();
      console.error("JSON Parsing Error:", {
        rawBody,
        parseError
      });

      return NextResponse.json(
        {
          error: "Invalid JSON",
          rawBody: rawBody
        },
        { status: 400 }
      );
    }

    const { id, quantity } = body;

    // Input validation with more detailed logging
    if (!id) {
      console.warn("Missing product ID", { body });
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!quantity || quantity < 1) {
      console.warn("Invalid quantity", { quantity });
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    // Check stock quantity with extended logging
    const result = await pool.query(
      `SELECT name, stock_quantity 
       FROM headphones 
       WHERE product_id = $1`,
      [id]
    );

    console.log("Database query result:", {
      rowCount: result.rows.length,
      productDetails: result.rows[0]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = result.rows[0];

    if (product.stock_quantity < quantity) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          available: product.stock_quantity,
          requested: quantity,
          name: product.name
        },
        { status: 400 }
      );
    }

    // Successful response with explicit headers
    return NextResponse.json(
      {
        success: true,
        available: product.stock_quantity
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    // Comprehensive error logging
    console.error("Detailed stock check error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace"
    });

    return NextResponse.json(
      {
        error: "Failed to check stock",
        details: error instanceof Error ? error.message : null
      },
      { status: 500 }
    );
  }
}
