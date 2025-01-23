import pool from "@/db/helpers/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const headphonesResult = await pool.query(
      `SELECT product_id, name, price, image_url, stock_quantity 
       FROM headphones 
       WHERE stock_quantity > 0`
    );

    return NextResponse.json(headphonesResult.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// For checking stock before checkout
export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    // Check stock for each item
    const stockChecks = await Promise.all(
      items.map(async (item: { id: number; quantity: number }) => {
        const result = await pool.query(
          "SELECT stock_quantity FROM headphones WHERE product_id = $1",
          [item.id]
        );

        if (result.rows.length === 0) {
          return {
            id: item.id,
            available: false,
            message: "Product not found"
          };
        }

        const { stock_quantity } = result.rows[0];
        return {
          id: item.id,
          available: stock_quantity >= item.quantity,
          requested: item.quantity,
          inStock: stock_quantity
        };
      })
    );

    const unavailableItems = stockChecks.filter((item) => !item.available);

    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          error: "Some items are out of stock",
          unavailableItems
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, stockChecks });
  } catch (error) {
    console.error("Error checking stock:", error);
    return NextResponse.json(
      { error: "Failed to check stock" },
      { status: 500 }
    );
  }
}
