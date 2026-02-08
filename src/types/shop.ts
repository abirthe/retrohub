export type ProductCategory = 'giftcard' | 'topup' | 'subscription';
export type DeliveryType = 'instant_code' | 'api_h2h' | 'automation';
export type Region = 'GLOBAL' | 'US' | 'EU' | 'ASIA' | 'LATAM';
export type OrderStatus = 'pending' | 'validated' | 'processing' | 'completed' | 'failed';

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  region: Region;
  deliveryType: DeliveryType;
  costPrice: number;
  salePrice: number;
  image: string;
  platform: string;
  description: string;
  inStock: number;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  customerInput: Record<string, string>;
  finalOutput?: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
}

export interface InventoryKey {
  id: string;
  productId: string;
  pinCode: string;
  serialNumber: string;
  status: 'available' | 'sold' | 'expired';
  createdAt: string;
}
