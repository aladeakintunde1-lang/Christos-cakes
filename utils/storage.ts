
import { Order, GalleryImage, OwnerProfile } from '../types';
import { supabase } from './supabase';
import { 
  BANK_DETAILS, 
  PICKUP_ADDRESS, 
  SHOP_POSTCODE, 
  INSTAGRAM_URL,
  LOGO_URL 
} from '../constants';

const ORDERS_KEY = 'sweettrack_orders';
const GALLERY_KEY = 'sweettrack_gallery';
const SETTINGS_KEY = 'sweettrack_settings';
const PASTRIES_KEY = 'sweettrack_pastries';
export const OWNER_SETTINGS_KEY = 'sweettrack_owner_settings';

export const DEFAULT_OWNER_PROFILE: OwnerProfile = {
  adminEmail: 'aladeakintunde1@gmail.com',
  adminWhatsAppNumber: '+447393150048',
  businessName: 'Christos Cakes & Events',
  shopPostcode: SHOP_POSTCODE || 'TA21 9RH',
  pickupAddress: PICKUP_ADDRESS || '7 Singh street, Wellington, TA21 9RH',
  instagramUrl: INSTAGRAM_URL || 'https://www.instagram.com/Christoscakes_events/',
  bankName: BANK_DETAILS?.bankName || 'Monzo',
  sortCode: BANK_DETAILS?.sortCode || '04-00-03',
  accountNumber: BANK_DETAILS?.accountNumber || '90709406',
  accountName: BANK_DETAILS?.accountName || 'Christianah Alade',
  reference: BANK_DETAILS?.reference || 'your name only please'
};


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
    const { data: remoteOrders, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    if (remoteOrders) {
      const localOrders = getOrders();
      
      // Find orders that are local only (exist locally but not in remote Supabase yet)
      const localOnlyOrders = localOrders.filter(
        local => !remoteOrders.some(remote => remote.id === local.id)
      );

      // Attempt to background-sync local-only orders back to Supabase
      for (const localOrder of localOnlyOrders) {
        try {
          const { error: insertError } = await supabase.from('orders').insert([localOrder]);
          if (!insertError) {
            console.log(`Successfully back-synced order ${localOrder.id} to Supabase`);
          } else {
            // If it failed because of a schema mismatch with the 'distance' value, retry without distance
            if (insertError.message?.includes('column') || insertError.code === '42703') {
              const { distance, ...orderWithoutDistance } = localOrder;
              await supabase.from('orders').insert([orderWithoutDistance]);
            } else {
              console.warn(`Failed to back-sync order ${localOrder.id}:`, insertError.message);
            }
          }
        } catch (syncErr) {
          console.error(`Error syncing order ${localOrder.id} to Supabase:`, syncErr);
        }
      }

      // Merge remote orders with local-only orders so we do not lose any local submissions
      const mergedOrders = [...remoteOrders];
      localOnlyOrders.forEach(local => {
        if (!mergedOrders.some(m => m.id === local.id)) {
          mergedOrders.push(local);
        }
      });

      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(mergedOrders));
      } catch (lsError) {
        console.warn('LocalStorage full, orders synced in memory only', lsError);
      }
      return mergedOrders;
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
      if (settings.logoUrl) localStorage.setItem(SETTINGS_KEY, settings.logoUrl);
      const prev = getOwnerSettings();
      const updated: OwnerProfile = {
        adminEmail: settings.adminemail || settings.adminEmail || prev.adminEmail,
        adminWhatsAppNumber: settings.adminWhatsAppNumber || settings.adminwhatsappnumber || prev.adminWhatsAppNumber,
        businessName: settings.businessname || settings.businessName || prev.businessName,
        shopPostcode: settings.shoppostcode || settings.shopPostcode || prev.shopPostcode,
        pickupAddress: settings.pickupaddress || settings.pickupAddress || prev.pickupAddress,
        instagramUrl: settings.instagramurl || settings.instagramUrl || prev.instagramUrl,
        bankName: settings.bankname || settings.bankName || prev.bankName,
        sortCode: settings.sortcode || settings.sortCode || prev.sortCode,
        accountNumber: settings.accountnumber || settings.accountNumber || prev.accountNumber,
        accountName: settings.accountname || settings.accountName || prev.accountName,
        reference: settings.reference || prev.reference,
      };
      localStorage.setItem(OWNER_SETTINGS_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to sync settings:', error);
  }

  return getOrders();
};

export const getOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
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
    console.warn('Supabase saveOrder error (falling back to local storage):', error);
    // Return success: true so the client can still view their local invoice/receipt
    return { success: true, localOnly: true, error };
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

export const updateOrderFeedback = async (
  orderId: string,
  feedbackRating: number,
  feedbackComment: string
) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  const feedbackCreatedAt = new Date().toISOString();
  
  if (index !== -1) {
    orders[index].feedbackRating = feedbackRating;
    orders[index].feedbackComment = feedbackComment;
    orders[index].feedbackCreatedAt = feedbackCreatedAt;
    
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      console.warn('Failed to save feedback to localStorage:', error);
    }
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          feedbackRating,
          feedbackComment,
          feedbackCreatedAt
        })
        .eq('id', orderId);
      if (error) {
        console.warn('Supabase feedback update failed (safely falls back to local storage):', error.message);
      }
    } catch (error) {
      console.error('Supabase updateOrderFeedback error:', error);
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
  try {
    const data = localStorage.getItem(GALLERY_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read gallery from localStorage:', error);
    return [];
  }
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
export const getSettings = () => {
  return {
    logoUrl: getLogoUrl()
  };
};

export const getLogoUrl = (): string | null => {
  try {
    return localStorage.getItem(SETTINGS_KEY);
  } catch (e) {
    return null;
  }
};

export const saveLogoUrl = async (url: string) => {
  try {
    localStorage.setItem(SETTINGS_KEY, url);
  } catch (e) {
    console.warn('Failed to save logo to localStorage:', e);
  }
  
  try {
    // Upsert settings (assuming a single record with id 1)
    await supabase.from('settings').upsert({ id: 1, logoUrl: url });
  } catch (error) {
    console.error('Supabase saveLogoUrl error:', error);
  }
};

export const getOwnerSettings = (): OwnerProfile => {
  try {
    const raw = localStorage.getItem(OWNER_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_OWNER_PROFILE, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse owner settings from localStorage:', e);
  }
  return { ...DEFAULT_OWNER_PROFILE };
};

export const saveOwnerSettings = async (
  profileUpdate: Partial<OwnerProfile>
): Promise<{ success: boolean; error?: any }> => {
  const current = getOwnerSettings();
  const merged: OwnerProfile = { ...current, ...profileUpdate };
  
  try {
    localStorage.setItem(OWNER_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event('owner_settings_updated'));
  } catch (e) {
    console.warn('Failed to save owner settings locally:', e);
  }

  try {
    const updatePayload: Record<string, any> = {};
    if (profileUpdate.adminWhatsAppNumber !== undefined) updatePayload.adminWhatsAppNumber = profileUpdate.adminWhatsAppNumber;
    if (profileUpdate.adminEmail !== undefined) updatePayload.adminemail = profileUpdate.adminEmail;
    if (profileUpdate.businessName !== undefined) updatePayload.businessname = profileUpdate.businessName;
    if (profileUpdate.shopPostcode !== undefined) updatePayload.shoppostcode = profileUpdate.shopPostcode;
    if (profileUpdate.pickupAddress !== undefined) updatePayload.pickupaddress = profileUpdate.pickupAddress;
    if (profileUpdate.instagramUrl !== undefined) updatePayload.instagramurl = profileUpdate.instagramUrl;
    if (profileUpdate.bankName !== undefined) updatePayload.bankname = profileUpdate.bankName;
    if (profileUpdate.sortCode !== undefined) updatePayload.sortcode = profileUpdate.sortCode;
    if (profileUpdate.accountNumber !== undefined) updatePayload.accountnumber = profileUpdate.accountNumber;
    if (profileUpdate.accountName !== undefined) updatePayload.accountname = profileUpdate.accountName;
    if (profileUpdate.reference !== undefined) updatePayload.reference = profileUpdate.reference;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase.from('settings').update(updatePayload).eq('id', 1);
      if (error) {
        console.warn('Supabase settings direct update failed, trying upsert:', error.message);
        await supabase.from('settings').upsert({ id: 1, ...updatePayload });
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to save owner settings to Supabase:', error);
    return { success: false, error };
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
