
export type OrderStatus = 'New Order' | 'Pending' | 'Baking' | 'Ready' | 'Completed' | 'Cancelled';

export type FulfillmentType = 'Collection' | 'Delivery';

export type OrderCategory = 'Cake' | 'Pastries' | 'Both';

export interface Order {
  id: string;
  orderNumber?: string;
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
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackCreatedAt?: string;
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

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // e.g. 0 or 20 for 20%
  taxAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  deliveryCharge: number;
  otherFees: number;
  otherFeesDescription?: string;
  total: number;
  notes?: string;
  paymentTerms?: string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
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

export interface OwnerProfile {
  adminEmail: string;
  adminWhatsAppNumber: string;
  businessName: string;
  shopPostcode: string;
  pickupAddress: string;
  instagramUrl: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  accountName: string;
  reference: string;
}

export interface Settings {
  id?: number;
  logoUrl?: string;
  adminWhatsAppNumber?: string;
  adminEmail?: string;
  businessName?: string;
  shopPostcode?: string;
  pickupAddress?: string;
  instagramUrl?: string;
  bankName?: string;
  sortCode?: string;
  accountNumber?: string;
  accountName?: string;
  reference?: string;
}

