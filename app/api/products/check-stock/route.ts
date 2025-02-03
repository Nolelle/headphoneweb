import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function POST(request: Request) {
  try {
    const { id, quantity } = await request.json();

    // Validate input
    if (!id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    // Check stock quantity
    const result = await pool.query(
      `SELECT name, stock_quantity 
       FROM headphones 
       WHERE product_id = $1`,
      [id]
    );

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

    return NextResponse.json({
      success: true,
      available: product.stock_quantity
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    return NextResponse.json(
      { error: "Failed to check stock" },
      { status: 500 }
    );
  }
}
