
import { Order, GalleryImage } from '../types';
import { supabase } from './supabase';

const ORDERS_KEY = 'sweettrack_orders';
const GALLERY_KEY = 'sweettrack_gallery';
const SETTINGS_KEY = 'sweettrack_settings';
const PASTRIES_KEY = 'sweettrack_pastries';

// Helper to sync local storage with Supabase
export const syncWithSupabase = async () => {
  // Sync Pastries
  try {
    const { data: pastries, error } = await supabase.from('pastries').select('*').order('order', { ascending: true });
    if (error) throw error;
    if (pastries && pastries.length > 0) {
      localStorage.setItem(PASTRIES_KEY, JSON.stringify(pastries));
    }
  } catch (error) {
    console.error('Failed to sync pastries:', error);
  }

  // Sync Orders
  try {
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    if (orders) {
      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      } catch (lsError) {
        console.warn('LocalStorage full, orders synced in memory only', lsError);
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
    if (settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
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
      
      // Handle missing column or other schema issues (e.g. 'distance' column missing)
      if (error.message?.includes('column') || error.code === '42703') {
        console.warn('Schema mismatch detected. Retrying without distance field...');
        const { distance, ...orderWithoutDistance } = order;
        const { error: retryError } = await supabase.from('orders').insert([orderWithoutDistance]);
        if (!retryError) return { success: true, note: 'Saved without distance info due to schema mismatch' };
      }

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
export const getSettings = (): Settings | null => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return null;
  try {
    // Check if it's the old string-only format or new JSON format
    if (data.startsWith('{')) {
      return JSON.parse(data);
    } else {
      // Migrate old format
      return { logoUrl: data };
    }
  } catch (e) {
    return { logoUrl: data };
  }
};

export const saveSettings = async (settings: Partial<Settings>) => {
  const current = getSettings() || { logoUrl: '' };
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  
  try {
    // Upsert settings (assuming a single record with id 1)
    await supabase.from('settings').upsert({ id: 1, ...updated });
  } catch (error) {
    console.error('Supabase saveSettings error:', error);
  }
};

// Pastry Methods
export const getStoredPastries = () => {
  const data = localStorage.getItem(PASTRIES_KEY);
  return data ? JSON.parse(data) : null;
};

export const seedPastries = async (pastries: any[]) => {
  try {
    // Check if pastries already exist
    const { data: existing } = await supabase.from('pastries').select('id');
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('pastries').insert(
        pastries.map((p, index) => ({ ...p, order: index }))
      );
      if (error) throw error;
      console.log('Pastries seeded to Supabase');
    }
  } catch (error) {
    console.error('Failed to seed pastries:', error);
  }
};
