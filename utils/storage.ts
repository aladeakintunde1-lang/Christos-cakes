
import { Order, GalleryImage } from '../types';
import { supabase } from './supabase';

const ORDERS_KEY = 'sweettrack_orders';
const GALLERY_KEY = 'sweettrack_gallery';
const SETTINGS_KEY = 'sweettrack_settings';

// Helper to sync local storage with Supabase
export const syncWithSupabase = async () => {
  // Sync Orders
  try {
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    if (orders) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to sync orders:', error);
  }

  // Sync Gallery
  try {
    const { data: gallery, error } = await supabase.from('gallery').select('*');
    if (error) throw error;
    if (gallery) localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  } catch (error) {
    console.error('Failed to sync gallery:', error);
  }

  // Sync Settings
  try {
    const { data: settings, error } = await supabase.from('settings').select('*').maybeSingle();
    if (error) throw error;
    if (settings?.logoUrl) localStorage.setItem(SETTINGS_KEY, settings.logoUrl);
  } catch (error) {
    console.error('Failed to sync settings:', error);
  }
};

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOrder = async (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  
  // Explicitly map fields to match Supabase schema and ensure no undefined values for NOT NULL columns
  const supabaseOrder = {
    id: order.id,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    fulfillmentType: order.fulfillmentType,
    postcode: order.postcode || null,
    address: order.address || null,
    deliveryFee: order.deliveryFee || 0,
    deliveryDate: order.deliveryDate,
    deliveryTimeSlot: order.deliveryTimeSlot,
    flavor: order.flavor,
    size: order.size,
    messageOnCake: order.messageOnCake || null,
    inspirationImage: order.inspirationImage || null,
    inspirationLink: order.inspirationLink || null,
    totalPrice: order.totalPrice || 0,
    status: order.status,
    distance: order.distance || null,
    createdAt: order.createdAt
  };

  try {
    const { error } = await supabase.from('orders').insert([supabaseOrder]);
    if (error) {
      console.error('Supabase insert error details:', error);
      throw error;
    }
  } catch (error) {
    console.error('Supabase saveOrder error:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (error) {
      console.error('Supabase updateOrderStatus error:', error);
    }
  }
};

export const updateOrderPrice = async (orderId: string, totalPrice: number, deliveryFee: number) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].totalPrice = totalPrice;
    orders[index].deliveryFee = deliveryFee;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    try {
      await supabase.from('orders').update({ totalPrice, deliveryFee }).eq('id', orderId);
    } catch (error) {
      console.error('Supabase updateOrderPrice error:', error);
    }
  }
};

export const deleteOrder = async (orderId: string) => {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
  
  try {
    await supabase.from('orders').delete().eq('id', orderId);
  } catch (error) {
    console.error('Supabase deleteOrder error:', error);
  }
};

export const subscribeToOrders = (callback: () => void) => {
  return supabase
    .channel('public:orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      syncWithSupabase().then(callback);
    })
    .subscribe();
};

// Gallery Methods
export const getGalleryImages = (): GalleryImage[] => {
  const data = localStorage.getItem(GALLERY_KEY);
  return data ? JSON.parse(data) : [];
};

export const addGalleryImage = async (image: GalleryImage) => {
  const images = getGalleryImages();
  images.unshift(image); // Add to beginning
  localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
  
  try {
    await supabase.from('gallery').insert([image]);
  } catch (error) {
    console.error('Supabase addGalleryImage error:', error);
  }
};

export const deleteGalleryImage = async (id: string) => {
  const images = getGalleryImages();
  const filtered = images.filter(img => img.id !== id);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(filtered));
  
  try {
    await supabase.from('gallery').delete().eq('id', id);
  } catch (error) {
    console.error('Supabase deleteGalleryImage error:', error);
  }
};

// Settings Methods
export const getLogoUrl = (): string | null => {
  return localStorage.getItem(SETTINGS_KEY);
};

export const saveLogoUrl = async (url: string) => {
  localStorage.setItem(SETTINGS_KEY, url);
  
  try {
    // Upsert settings (assuming a single record with id 1)
    await supabase.from('settings').upsert({ id: 1, logoUrl: url });
  } catch (error) {
    console.error('Supabase saveLogoUrl error:', error);
  }
};
