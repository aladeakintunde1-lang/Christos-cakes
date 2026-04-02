
export type OrderStatus = 'Pending' | 'Baking' | 'Ready' | 'Completed' | 'Cancelled';

export type FulfillmentType = 'Collection' | 'Delivery';

export type OrderCategory = 'Cake' | 'Pastries' | 'Both';

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  fulfillmentType: FulfillmentType;
  category: OrderCategory;
  pastries?: { id: string, name: string, quantity: number }[];
  postcode?: string;
  address?: string;
  deliveryFee?: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  flavor?: string;
  size?: string;
  messageOnCake?: string;
  numberOfTiers?: number;
  tierArrangement?: string;
  inspirationImage?: string; // Base64
  inspirationLink?: string;
  totalPrice?: number;
  distance?: number;
  status: OrderStatus;
  createdAt: string;
}

export type ImageDisplayMode = 'original' | 'square';

export interface GalleryImage {
  id: string;
  url: string; // Base64 or external URL
  displayMode: ImageDisplayMode;
  createdAt: string;
}

export interface Zone {
  name: string;
  postcodes: string[];
  fee: number;
  locale: string;
}

export interface OrderInvoice {
  orderId: string;
  orderNumber: string;
  issueDate: string;
  dueDate: string;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export interface Settings {
  logoUrl: string;
  adminWhatsAppNumber?: string;
}
