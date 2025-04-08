import { CartItem, CartResponse } from "@/app/components/Cart/CartTypes";

describe("CartTypes", () => {
  describe("CartItem interface", () => {
    it("should validate a properly structured cart item", () => {
      const validCartItem: CartItem = {
        cart_item_id: 1,
        product_id: 2,
        name: "Test Headphone",
        price: 299.99,
        quantity: 2,
        stock_quantity: 10,
        image_url: "/images/headphone.jpg"
      };

      // Type validation through property access
      expect(validCartItem.cart_item_id).toBe(1);
      expect(validCartItem.product_id).toBe(2);
      expect(validCartItem.name).toBe("Test Headphone");
      expect(validCartItem.price).toBe(299.99);
      expect(validCartItem.quantity).toBe(2);
      expect(validCartItem.stock_quantity).toBe(10);
      expect(validCartItem.image_url).toBe("/images/headphone.jpg");
    });
  });

  describe("CartResponse interface", () => {
    it("should validate a success response with items", () => {
      const successResponse: CartResponse = {
        success: true,
        items: [
          {
            cart_item_id: 1,
            product_id: 2,
            name: "Test Headphone",
            price: 299.99,
            quantity: 2,
            stock_quantity: 10,
            image_url: "/images/headphone.jpg"
          }
        ]
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.items).toBeDefined();
      expect(successResponse.items?.length).toBe(1);
      expect(successResponse.error).toBeUndefined();
    });

    it("should validate an error response", () => {
      const errorResponse: CartResponse = {
        success: false,
        error: "Failed to retrieve cart items"
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe("Failed to retrieve cart items");
      expect(errorResponse.items).toBeUndefined();
    });

    it("should validate a success response with empty items array", () => {
      const emptyCartResponse: CartResponse = {
        success: true,
        items: []
      };

      expect(emptyCartResponse.success).toBe(true);
      expect(emptyCartResponse.items).toBeDefined();
      expect(emptyCartResponse.items?.length).toBe(0);
      expect(emptyCartResponse.error).toBeUndefined();
    });
  });
});
