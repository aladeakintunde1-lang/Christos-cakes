
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
  { label: 'Small (6")' },
  { label: 'Medium (8")' },
  { label: 'Large (10")' },
  { label: 'Extra Large (12")' },
];

export const SHOP_POSTCODE = 'TA21 9RH';

export const PICKUP_ADDRESS = '7 Singh street, Wellington, TA21 9RH';

export const ADMIN_PASSWORD = 'cake'; // Simple demo password

export const INSTAGRAM_URL = 'https://www.instagram.com/Christoscakes_events/';

// Replace this URL with the actual URL of your uploaded logo
export const LOGO_URL = 'https://picsum.photos/seed/christos-cakes-logo/400/400'; 
