
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
    if (orders) {
      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      } catch (lsError) {
        console.warn('LocalStorage full, orders synced in memory only', lsError);
        // We still have the orders in the 'orders' variable, but we can't persist them all to LS
      }
      return orders;
    }
  } catch (error) {
    console.error('Failed to sync orders:', error);
  }

  // Sync Gallery
  try {
    const { data: gallery, error } = await supabase.from('gallery').select('*');
    if (error) throw error;
    if (gallery) {
      try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
      } catch (e) {
        console.warn('Gallery LS full', e);
      }
    }
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

  return getOrders();
};

export const getOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read orders from localStorage:', error);
    return [];
  }
};

export const saveOrder = async (order: Order) => {
  // Try to save locally first
  const orders = getOrders();
  orders.push(order);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.warn('Failed to save order to localStorage (likely full):', error);
  }
  
  // Save to Supabase
  try {
    const { error } = await supabase.from('orders').insert([order]);
    if (error) {
      console.error('Supabase insert error:', error);
      
      // If it's a size issue or similar, try saving without the large image
      if (order.inspirationImage) {
        console.warn('Retrying save without inspiration image...');
        const { inspirationImage, ...orderWithoutImage } = order;
        const { error: retryError } = await supabase.from('orders').insert([orderWithoutImage]);
        if (retryError) {
          console.error('Supabase retry insert error:', retryError);
          throw retryError;
        }
        return { success: true, note: 'Saved without image due to size' };
      }
      
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Supabase saveOrder error:', error);
    return { success: false, error };
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
