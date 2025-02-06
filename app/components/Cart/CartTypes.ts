export interface CartItem {
  cart_item_id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  stock_quantity: number;
  image_url: string;
}

export interface CartResponse {
  success: boolean;
  items?: CartItem[];
  error?: string;
}
