
import { Zone } from './types';

export const ZONES: Zone[] = [
  { name: 'Local', postcodes: ['TA21', 'TA1', 'TA2', 'TA3'], fee: 5.00, locale: 'Wellington & Taunton' },
  { name: 'Somerset', postcodes: ['TA', 'BA', 'BS', 'EX'], fee: 15.00, locale: 'Somerset, Bristol & Exeter' },
  { name: 'Rest of UK', postcodes: [], fee: 45.00, locale: 'Nationwide (Mainland UK)' },
];

export const FLAVORS = [
  'Classic Vanilla & Raspberry',
  'Rich Belgian Chocolate',
  'Red Velvet & Cream Cheese',
  'Lemon Drizzle with Curd',
  'Salted Caramel & Lotus Biscoff',
  'Pistachio & Rose Water'
];

export const SIZES = [
  { label: 'Small (6")', price: 55 },
  { label: 'Medium (8")', price: 65 },
  { label: 'Large (10")', price: 85 },
  { label: 'Extra Large (12")', price: 110 },
];

export const PICKUP_ADDRESS = '7 Singh street, Wellington, TA21 9RH';

export const ADMIN_PASSWORD = 'cake'; // Simple demo password

export const INSTAGRAM_URL = 'https://www.instagram.com/Christoscakes_events/';
