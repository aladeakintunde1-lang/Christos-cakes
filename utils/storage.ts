
import { Order, GalleryImage } from '../types';
import { supabase } from './supabase';

const ORDERS_KEY = 'sweettrack_orders';
const GALLERY_KEY = 'sweettrack_gallery';
const SETTINGS_KEY = 'sweettrack_settings';

// Helper to sync local storage with Supabase
export const syncWithSupabase = async () => {
  try {
    // Sync Orders
    const { data: orders } = await supabase.from('orders').select('*');
    if (orders) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Sync Gallery
    const { data: gallery } = await supabase.from('gallery').select('*');
    if (gallery) localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));

    // Sync Settings
    const { data: settings } = await supabase.from('settings').select('*').single();
    if (settings?.logoUrl) localStorage.setItem(SETTINGS_KEY, settings.logoUrl);
  } catch (error) {
    console.error('Failed to sync with Supabase:', error);
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
  
  try {
    await supabase.from('orders').insert([order]);
  } catch (error) {
    console.error('Supabase saveOrder error:', error);
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
