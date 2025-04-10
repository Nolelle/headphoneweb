import { CartItem, CartResponse } from './../../../app/components/Cart/CartTypes';

describe("Cart Types", () => {
  it("should create a CartItem object correctly", () => {
    const cartItem: CartItem = {
      cart_item_id: 1,
      product_id: 101,
      name: "Bone+ Headphone",
      price: 199.99,
      quantity: 2,
      stock_quantity: 10,
      image_url: "/h_1.png",
    };

    expect(cartItem).toHaveProperty("cart_item_id", 1);
    expect(cartItem).toHaveProperty("product_id", 101);
    expect(cartItem).toHaveProperty("name", "Bone+ Headphone");
    expect(cartItem).toHaveProperty("price", 199.99);
    expect(cartItem).toHaveProperty("quantity", 2);
    expect(cartItem).toHaveProperty("stock_quantity", 10);
    expect(cartItem).toHaveProperty("image_url", "/h_1.png");
  });

  it("should create a successful CartResponse object correctly", () => {
    const cartResponse: CartResponse = {
      success: true,
      items: [
        {
          cart_item_id: 1,
          product_id: 101,
          name: "Bone+ Headphone",
          price: 199.99,
          quantity: 2,
          stock_quantity: 10,
          image_url: "/h_1.png",
        },
      ],
    };

    expect(cartResponse).toHaveProperty("success", true);
    expect(cartResponse.items).toBeInstanceOf(Array);
    expect(cartResponse.items?.[0]).toHaveProperty("name", "Bone+ Headphone");
  });

  it("should create an error CartResponse object correctly", () => {
    const cartResponse: CartResponse = {
      success: false,
      error: "Failed to retrieve cart items",
    };

    expect(cartResponse).toHaveProperty("success", false);
    expect(cartResponse).toHaveProperty("error", "Failed to retrieve cart items");
  });
});
