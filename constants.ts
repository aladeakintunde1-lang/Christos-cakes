
import { Zone } from './types';

export const ZONES: Zone[] = [
  { name: 'Local', postcodes: ['TA21', 'TA1', 'TA2', 'TA3'], fee: 5.00, locale: 'Wellington & Taunton' },
  { name: 'Somerset', postcodes: ['TA', 'BA', 'BS', 'EX'], fee: 15.00, locale: 'Somerset, Bristol & Exeter' },
  { name: 'Rest of UK', postcodes: [], fee: 45.00, locale: 'Nationwide (Mainland UK)' },
];

export const SIZES = [
  { label: 'Small (6")' },
  { label: 'Standard (7")' },
  { label: 'Medium (8")' },
  { label: 'Large (10")' },
  { label: 'Extra Large (12")' },
];

export const SHOP_POSTCODE = 'TA21 9RH';

export const PICKUP_ADDRESS = '7 Singh street, Wellington, TA21 9RH';

export const INSTAGRAM_URL = 'https://www.instagram.com/Christoscakes_events/';

export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'cake'; // Fallback for local dev only

// Replace this URL with the actual URL of your uploaded logo
export const LOGO_URL = 'https://picsum.photos/seed/christos-cakes-logo/400/400'; 

export const PASTRIES = [
  { id: 'puffpuff', name: 'Puffpuff (Pack of 50)', description: 'Traditional sweet fried dough balls - £25 per pack', price: 25 },
  { id: 'meatpie-large', name: 'Meat Pie (Large) - Pack of 20', description: 'Savory pastry filled with seasoned minced meat - £50 per pack', price: 50 },
  { id: 'meatpie-small', name: 'Meat Pie (Small) - Pack of 30', description: 'Savory pastry filled with seasoned minced meat - £50 per pack', price: 50 },
  { id: 'sausageroll', name: 'Sausage Roll - Pack of 30', description: 'Flaky pastry wrapped around seasoned sausage meat - £50 per pack', price: 50 },
  { id: 'fishroll', name: 'Fish Roll', description: 'Crispy pastry filled with spiced fish', price: 0 },
  { id: 'smallchops', name: 'Small Chops', description: 'Assorted finger foods', price: 0 },
  { id: 'platter', name: 'Platter', description: 'A luxury assortment of our finest pastries', price: 0 },
];

export const BANK_DETAILS = {
  bankName: 'Monzo',
  sortCode: '04-00-03',
  accountNumber: '90709406',
  accountName: 'Christianah Alade',
  reference: 'your name only please'
};