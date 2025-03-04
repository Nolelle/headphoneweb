// Simple stock verification module with a test-friendly interface
class StockVerifier {
  // Simulate a database of products with stock levels
  private products = new Map<number, number>([
    [1, 10], // Product ID 1 has 10 in stock
    [2, 5],  // Product ID 2 has 5 in stock
    [3, 0],  // Product ID 3 is out of stock
  ]);

  // Check if a product has sufficient stock
  async checkStock(productId: number, requestedQuantity: number): Promise<StockCheckResult> {
    // Simulate a database query
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const availableStock = this.products.get(productId);
    
    if (availableStock === undefined) {
      return {
        success: false,
        status: 'not_found',
        message: 'Product not found',
        availableStock: 0
      };
    }
    
    if (availableStock === 0) {
      return {
        success: false,
        status: 'out_of_stock',
        message: 'Out of stock',
        availableStock: 0
      };
    }
    
    if (availableStock < requestedQuantity) {
      return {
        success: false,
        status: 'insufficient_stock',
        message: 'Insufficient stock',
        availableStock
      };
    }
    
    return {
      success: true,
      status: 'in_stock',
      message: 'Stock available',
      availableStock
    };
  }
  
  // Simulate updating stock levels
  async reduceStock(productId: number, quantity: number): Promise<boolean> {
    // Simulate a database query
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const currentStock = this.products.get(productId);
    
    if (currentStock === undefined || currentStock < quantity) {
      return false;
    }
    
    this.products.set(productId, currentStock - quantity);
    return true;
  }
}

interface StockCheckResult {
  success: boolean;
  status: 'in_stock' | 'insufficient_stock' | 'out_of_stock' | 'not_found';
  message: string;
  availableStock: number;
}

describe('Product Stock Verification', () => {
  let stockVerifier: StockVerifier;
  
  beforeEach(() => {
    stockVerifier = new StockVerifier();
  });
  
  it('should verify available stock', async () => {
    const result = await stockVerifier.checkStock(1, 5);
    
    expect(result.success).toBe(true);
    expect(result.status).toBe('in_stock');
    expect(result.availableStock).toBe(10);
  });
  
  it('should detect insufficient stock', async () => {
    const result = await stockVerifier.checkStock(2, 10);
    
    expect(result.success).toBe(false);
    expect(result.status).toBe('insufficient_stock');
    expect(result.availableStock).toBe(5);
  });
  
  it('should handle out of stock products', async () => {
    const result = await stockVerifier.checkStock(3, 1);
    
    expect(result.success).toBe(false);
    expect(result.status).toBe('out_of_stock');
    expect(result.availableStock).toBe(0);
  });
  
  it('should handle non-existent products', async () => {
    const result = await stockVerifier.checkStock(999, 1);
    
    expect(result.success).toBe(false);
    expect(result.status).toBe('not_found');
  });
  
  it('should update stock when reducing quantity', async () => {
    // First verify current stock
    const initialCheck = await stockVerifier.checkStock(1, 5);
    expect(initialCheck.availableStock).toBe(10);
    
    // Reduce stock
    const reduceResult = await stockVerifier.reduceStock(1, 3);
    expect(reduceResult).toBe(true);
    
    // Verify updated stock
    const finalCheck = await stockVerifier.checkStock(1, 5);
    expect(finalCheck.availableStock).toBe(7);
  });
  
  it('should prevent stock from going negative', async () => {
    // Try to reduce stock by more than available
    const reduceResult = await stockVerifier.reduceStock(2, 10);
    expect(reduceResult).toBe(false);
    
    // Verify stock was not changed
    const check = await stockVerifier.checkStock(2, 1);
    expect(check.availableStock).toBe(5);
  });
});