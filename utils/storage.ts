
import { Order, GalleryImage, OwnerProfile, Invoice, InvoiceItem, InvoiceStatus } from '../types';
import { supabase } from './supabase';
import { syncAutomationUpdate } from '../services/automation';
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
  // Ensure unique order number and status are assigned
  if (!order.orderNumber) {
    order.orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  }
  if (!order.status) {
    order.status = 'New Order';
  }

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
    // Automatically synchronize new order to Make.com
    syncAutomationUpdate({
      event: 'order.created',
      type: 'NEW_ORDER',
      order
    }).catch(err => console.warn('Make.com auto-sync failed for new order:', err));

    return { success: true };
  } catch (error) {
    console.warn('Supabase saveOrder error (falling back to local storage):', error);
    // Still trigger automation sync even if offline/local-only fallback
    syncAutomationUpdate({
      event: 'order.created',
      type: 'NEW_ORDER',
      order,
      extra: { offlineMode: true }
    }).catch(err => console.warn('Make.com auto-sync failed for offline order:', err));

    return { success: true, localOnly: true, error };
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    const previousStatus = orders[index].status;
    orders[index].status = status;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (error) {
      console.error('Supabase updateOrderStatus error:', error);
    }

    // Automatically synchronize status update to Make.com
    syncAutomationUpdate({
      event: 'order.status_updated',
      type: 'STATUS_UPDATED',
      orderId,
      order: orders[index],
      previousStatus
    }).catch(err => console.warn('Make.com auto-sync failed for status update:', err));
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

    // Automatically synchronize quote/price update to Make.com
    syncAutomationUpdate({
      event: 'order.quote_updated',
      type: 'QUOTE_UPDATED',
      orderId,
      order: orders[index],
      extra: { totalPrice, deliveryFee }
    }).catch(err => console.warn('Make.com auto-sync failed for price update:', err));
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

    // Automatically synchronize client review/feedback to Make.com
    syncAutomationUpdate({
      event: 'feedback.submitted',
      type: 'NEW_FEEDBACK',
      orderId,
      order: orders[index],
      extra: { feedbackRating, feedbackComment, feedbackCreatedAt }
    }).catch(err => console.warn('Make.com auto-sync failed for feedback:', err));
  }
};

export const updateOrderDetails = async (orderId: string, updates: Partial<Order>) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    try {
      await supabase.from('orders').update(updates).eq('id', orderId);
    } catch (e) {
      console.error('Supabase updateOrderDetails error:', e);
    }

    // Automatically synchronize any arbitrary order update to Make.com
    syncAutomationUpdate({
      event: 'order.updated',
      type: 'ORDER_UPDATED',
      orderId,
      order: orders[index],
      extra: updates
    }).catch(err => console.warn('Make.com auto-sync failed for order details:', err));
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

// ==========================================
// INVOICING SUITE (CRUD & AUTOMATION)
// ==========================================
export const INVOICES_KEY = 'sweettrack_invoices';

export const getInvoices = (): Invoice[] => {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse invoices:', e);
    return [];
  }
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return getInvoices().find(inv => inv.id === id || inv.invoiceNumber === id);
};

export const getInvoiceByOrderId = (orderId: string): Invoice | undefined => {
  return getInvoices().find(inv => inv.orderId === orderId);
};

export const generateInvoiceNumber = (): string => {
  const currentYear = new Date().getFullYear();
  const invoices = getInvoices();
  const yearInvoices = invoices.filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith(`INV-${currentYear}`));
  const nextSeq = yearInvoices.length + 1;
  return `INV-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
};

export const createInvoiceFromOrder = (order: Order): Invoice => {
  const existing = getInvoiceByOrderId(order.id);
  if (existing) return existing;

  const orderNum = order.orderNumber || (order.id ? `ORD-${order.id.slice(0, 6).toUpperCase()}` : `ORD-${Math.floor(100000 + Math.random() * 900000)}`);
  const items: InvoiceItem[] = [];

  // Cake line item
  if (order.category === 'Cake' || order.category === 'Both') {
    const cakeDesc = [
      'Bespoke Luxury Cake',
      order.flavor ? `Flavor: ${order.flavor}` : '',
      order.size ? `Size: ${order.size}` : '',
      order.numberOfTiers ? `${order.numberOfTiers} Tier(s)` : '',
      order.messageOnCake ? `Calligraphy: "${order.messageOnCake}"` : ''
    ].filter(Boolean).join(' · ');

    const pastryTotal = (order.pastries || []).reduce((sum, p) => sum + (p.quantity * 0), 0);
    const cakePrice = (order.totalPrice || 0) - (order.deliveryFee || 0) - pastryTotal;
    const finalCakePrice = Math.max(0, cakePrice);

    items.push({
      id: 'item_cake_' + Date.now(),
      description: cakeDesc || 'Artisanal Bespoke Celebration Cake',
      quantity: 1,
      unitPrice: finalCakePrice,
      total: finalCakePrice
    });
  }

  // Pastry items
  if (order.pastries && order.pastries.length > 0) {
    order.pastries.forEach((p, idx) => {
      if (p.quantity > 0) {
        items.push({
          id: `item_pastry_${idx}_${Date.now()}`,
          description: `Handmade Luxury Pastries: ${p.name}`,
          quantity: p.quantity,
          unitPrice: 0,
          total: 0
        });
      }
    });
  }

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const deliveryCharge = order.deliveryFee || 0;
  const total = subtotal + deliveryCharge;

  return {
    id: 'inv_' + Math.random().toString(36).substring(2, 10),
    invoiceNumber: generateInvoiceNumber(),
    orderId: order.id,
    orderNumber: orderNum,
    customerName: order.customerName,
    customerEmail: order.email,
    customerPhone: order.phone,
    customerAddress: order.address ? `${order.address}, ${order.postcode || ''}`.trim() : (order.postcode || ''),
    status: 'Draft',
    items,
    subtotal,
    taxRate: 0,
    taxAmount: 0,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    deliveryCharge,
    otherFees: 0,
    otherFeesDescription: '',
    total,
    notes: 'Thank you for commissioning Christos Cakes Atelier. We are honored to craft this bespoke culinary masterpiece for your celebration.',
    paymentTerms: 'A 50% non-refundable deposit is required upon receipt to secure your baking date. The remaining balance is due 14 days prior to delivery/collection.',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: order.deliveryDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const saveInvoice = async (invoice: Invoice): Promise<{ success: boolean; invoice: Invoice; error?: any }> => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);

  const updatedInvoice: Invoice = {
    ...invoice,
    updatedAt: new Date().toISOString()
  };

  if (index !== -1) {
    invoices[index] = updatedInvoice;
  } else {
    invoices.unshift(updatedInvoice);
  }

  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new Event('invoices_updated'));
  } catch (e) {
    console.warn('Failed to save invoice to localStorage:', e);
  }

  // Sync to Supabase if table exists
  try {
    await supabase.from('invoices').upsert(updatedInvoice);
  } catch (err) {
    console.warn('Supabase invoice sync note:', err);
  }

  // Trigger automation synchronization based on status
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://christoscakes.co.uk';
  if (invoice.status === 'Issued') {
    syncAutomationUpdate({
      event: 'invoice.issued',
      type: 'INVOICE_ISSUED',
      orderId: invoice.orderId,
      extra: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: invoice.orderNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerPhone: invoice.customerPhone,
        total: invoice.total,
        subtotal: invoice.subtotal,
        deliveryCharge: invoice.deliveryCharge,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        dueDate: invoice.dueDate,
        issueDate: invoice.issueDate,
        status: invoice.status,
        invoiceUrl: `${origin}/invoice/${invoice.id}`,
        items: invoice.items
      },
      force: true
    }).catch(e => console.warn('Automation sync for invoice.issued failed:', e));
  } else if (invoice.status === 'Paid') {
    syncAutomationUpdate({
      event: 'invoice.paid',
      type: 'INVOICE_PAID',
      orderId: invoice.orderId,
      extra: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: invoice.orderNumber,
        customerName: invoice.customerName,
        total: invoice.total,
        status: invoice.status
      },
      force: true
    }).catch(e => console.warn('Automation sync for invoice.paid failed:', e));
  }

  return { success: true, invoice: updatedInvoice };
};

export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === invoiceId);
  if (index !== -1) {
    invoices[index].status = status;
    invoices[index].updatedAt = new Date().toISOString();
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new Event('invoices_updated'));
    try {
      await supabase.from('invoices').update({ status, updatedAt: invoices[index].updatedAt }).eq('id', invoiceId);
    } catch (e) {
      console.warn('Supabase updateInvoiceStatus note:', e);
    }
    await saveInvoice(invoices[index]);
  }
};

export const deleteInvoice = async (invoiceId: string) => {
  const invoices = getInvoices().filter(i => i.id !== invoiceId);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new Event('invoices_updated'));
  try {
    await supabase.from('invoices').delete().eq('id', invoiceId);
  } catch (e) {
    console.warn('Supabase deleteInvoice note:', e);
  }
};
