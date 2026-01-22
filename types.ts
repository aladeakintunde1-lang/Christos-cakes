
export type OrderStatus = 'Pending' | 'Baking' | 'Ready' | 'Completed' | 'Cancelled';

export type FulfillmentType = 'Collection' | 'Delivery';

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  fulfillmentType: FulfillmentType;
  postcode?: string;
  address?: string;
  deliveryFee: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  flavor: string;
  size: string;
  messageOnCake: string;
  inspirationImage?: string; // Base64
  inspirationLink?: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Zone {
  name: string;
  postcodes: string[];
  fee: number;
  locale: string;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}
