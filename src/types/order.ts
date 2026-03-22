export interface CheckoutItem {
  productId: string;
  quantity: number;
  backingId: string;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  customerEmail: string;
  isWholesale: boolean;
}
