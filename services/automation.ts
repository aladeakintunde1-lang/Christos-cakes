import { Order } from '../types';

export const MAKE_WEBHOOK_KEY = 'sweettrack_make_webhook_url';
export const MAKE_AUTO_SYNC_KEY = 'sweettrack_make_auto_sync';
export const MAKE_LAST_SYNC_KEY = 'sweettrack_make_last_sync';

export interface SyncResult {
  success: boolean;
  status?: number;
  message: string;
  timestamp: string;
  event?: string;
  orderId?: string;
}

/**
 * Gets the configured Make.com Webhook URL from environment or localStorage
 */
export const getMakeWebhookUrl = (): string => {
  try {
    const saved = localStorage.getItem(MAKE_WEBHOOK_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}

  // Check VITE_MAKE_WEBHOOK_URL
  const envMakeUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAKE_WEBHOOK_URL) ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_MAKE_WEBHOOK_URL : undefined);
  if (envMakeUrl && typeof envMakeUrl === 'string' && envMakeUrl.trim()) {
    return envMakeUrl.trim();
  }

  // Fallbacks for existing general automation or n8n webhook URL
  const envAutoUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AUTOMATION_WEBHOOK_URL) ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_AUTOMATION_WEBHOOK_URL : undefined);
  if (envAutoUrl && typeof envAutoUrl === 'string' && envAutoUrl.trim()) {
    return envAutoUrl.trim();
  }

  try {
    const legacySaved = localStorage.getItem('sweettrack_webhook_url');
    if (legacySaved && legacySaved.trim()) return legacySaved.trim();
  } catch {}

  const envN8nUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_N8N_WEBHOOK_URL) ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_N8N_WEBHOOK_URL : undefined);
  if (envN8nUrl && typeof envN8nUrl === 'string' && envN8nUrl.trim()) {
    return envN8nUrl.trim();
  }

  return '';
};

/**
 * Sets the Make.com Webhook URL in localStorage
 */
export const setMakeWebhookUrl = (url: string) => {
  try {
    localStorage.setItem(MAKE_WEBHOOK_KEY, url.trim());
    // Also sync to legacy key for backwards compatibility
    localStorage.setItem('sweettrack_webhook_url', url.trim());
  } catch (e) {
    console.warn('Failed to save Make webhook URL to localStorage:', e);
  }
};

export const MAKE_API_KEY_KEY = 'sweettrack_make_api_key';

/**
 * Gets the configured Make.com API Key or Authorization Token
 */
export const getMakeApiKey = (): string => {
  try {
    const saved = localStorage.getItem(MAKE_API_KEY_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}

  const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAKE_API_KEY) ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_MAKE_API_KEY : undefined);
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
};

/**
 * Sets the Make.com API Key in localStorage
 */
export const setMakeApiKey = (key: string) => {
  try {
    localStorage.setItem(MAKE_API_KEY_KEY, key.trim());
  } catch (e) {
    console.warn('Failed to save Make API key:', e);
  }
};

/**
 * Checks whether automatic synchronization is enabled for every order update
 */
export const isMakeAutoSyncEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(MAKE_AUTO_SYNC_KEY);
    if (val === null) return true; // Enabled by default
    return val === 'true';
  } catch {
    return true;
  }
};

/**
 * Toggles auto sync on any update
 */
export const setMakeAutoSyncEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(MAKE_AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to save auto sync state:', e);
  }
};

/**
 * Retrieves the last recorded sync result
 */
export const getLastSyncStatus = (): SyncResult | null => {
  try {
    const val = localStorage.getItem(MAKE_LAST_SYNC_KEY);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export const saveLastSyncStatus = (result: SyncResult) => {
  try {
    localStorage.setItem(MAKE_LAST_SYNC_KEY, JSON.stringify(result));
  } catch {}
};

/**
 * Formats order into a clean payload for Make.com, stripping large base64 strings
 */
export const formatOrderForMakePayload = (order: Partial<Order>, event: string, type: string, extra?: Record<string, any>) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://christoscakes.co.uk';
  const orderUrl = order.id ? `${origin}/order/${order.id}` : origin;

  // Format pastries summary string for easy reading in Make.com emails & messages
  let pastriesSummary = '';
  if (order.pastries && order.pastries.length > 0) {
    pastriesSummary = order.pastries
      .filter(p => p.quantity > 0)
      .map(p => `${p.quantity}x ${p.name}`)
      .join(', ');
  }

  // Remove large base64 image data to prevent HTTP 413 Payload Too Large errors in webhooks
  const { inspirationImage, ...sanitizedOrder } = order as any;
  const orderNum = order.orderNumber || (order.id ? `ORD-${order.id.slice(0, 6).toUpperCase()}` : `ORD-${Math.floor(100000 + Math.random() * 900000)}`);
  const currentStatus = order.status || 'New Order';

  return {
    ...sanitizedOrder,
    event,
    type,
    id: order.id,
    orderNumber: orderNum,
    customerName: order.customerName || 'Valued Client',
    email: order.email || '',
    phone: order.phone || '',
    status: currentStatus,
    totalPrice: order.totalPrice || 0,
    deliveryFee: order.deliveryFee || 0,
    fulfillmentType: order.fulfillmentType || 'Collection',
    deliveryDate: order.deliveryDate || '',
    deliveryTimeSlot: order.deliveryTimeSlot || '',
    category: order.category || 'Cake',
    flavor: order.flavor || '',
    size: order.size || '',
    numberOfTiers: order.numberOfTiers || 1,
    tierArrangement: order.tierArrangement || '',
    messageOnCake: order.messageOnCake || '',
    pastriesSummary,
    hasInspirationImage: Boolean(inspirationImage),
    inspirationLink: order.inspirationLink || '',
    address: order.address || '',
    postcode: order.postcode || '',
    feedbackRating: order.feedbackRating,
    feedbackComment: order.feedbackComment,
    orderUrl,
    appUrl: origin,
    ownerNotification: {
      recipient: 'aladeakintunde1@gmail.com',
      subject: `🚨 Action Required: New Order #${orderNum} from ${order.customerName || 'Client'}`,
      requiresProcessing: true,
      text: `A new luxury order #${orderNum} has been placed and requires processing in the atelier. Customer: ${order.customerName} (${order.phone}, ${order.email}). Event Date: ${order.deliveryDate || 'TBD'} (${order.deliveryTimeSlot || 'Standard'}). Total: £${(order.totalPrice || 0).toFixed(2)}.`
    },
    customerNotification: {
      recipient: order.email || '',
      subject: `Christos Cakes Order Confirmation #${orderNum}`,
      orderNumber: orderNum,
      orderStatus: currentStatus,
      summary: `Thank you, ${order.customerName}! Your bespoke commission #${orderNum} has been received. Our atelier is now reviewing your specifications.`,
      trackingUrl: orderUrl,
      totalAmount: `£${(order.totalPrice || 0).toFixed(2)}`
    },
    timestamp: new Date().toISOString(),
    source: 'Christos Cakes Luxury Bakery',
    ...extra
  };
};

/**
 * Dispatches an event to the Make.com webhook
 */
export const syncAutomationUpdate = async (params: {
  event: string;
  type: string;
  order?: Partial<Order>;
  orderId?: string;
  previousStatus?: string;
  extra?: Record<string, any>;
  force?: boolean;
}): Promise<SyncResult> => {
  const { event, type, order = {}, orderId, previousStatus, extra = {}, force = false } = params;

  if (!force && !isMakeAutoSyncEnabled()) {
    return {
      success: true,
      message: 'Auto-sync is disabled in settings.',
      timestamp: new Date().toISOString(),
      event
    };
  }

  const webhookUrl = getMakeWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'No Make.com Webhook URL configured.',
      timestamp: new Date().toISOString(),
      event
    };
  }

  const effectiveOrder: Partial<Order> = {
    ...order,
    id: order.id || orderId || 'UNKNOWN'
  };

  const payload = formatOrderForMakePayload(effectiveOrder, event, type, {
    previousStatus,
    ...extra
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const apiKey = getMakeApiKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result: SyncResult = {
      success: response.ok,
      status: response.status,
      message: response.ok 
        ? `✓ Synchronized ${event} to Make.com` 
        : response.status === 401
          ? (!webhookUrl.toLowerCase().includes('hook.')
            ? `HTTP 401: Invalid URL format. A Make webhook URL must start with "https://hook." (not your browser address bar). Click the Custom Webhook module in Make to copy the true URL.`
            : `HTTP 401: Scenario is turned OFF in Make.com. Toggle the switch to ON in the bottom-left of Make, or enter your API key if required.`)
          : `HTTP ${response.status} from Make.com`,
      timestamp: new Date().toISOString(),
      event,
      orderId: effectiveOrder.id
    };

    saveLastSyncStatus(result);
    return result;
  } catch (err: any) {
    console.warn(`[Make.com Sync] Error syncing ${event}:`, err);
    const result: SyncResult = {
      success: false,
      message: err.name === 'AbortError' ? 'Make.com request timed out after 12s.' : (err.message || 'Network error syncing with Make.com'),
      timestamp: new Date().toISOString(),
      event,
      orderId: effectiveOrder.id
    };
    saveLastSyncStatus(result);
    return result;
  }
};

/**
 * Test connectivity with Make.com webhook URL
 */
export const testMakeWebhook = async (testUrl?: string): Promise<{ success: boolean; status?: number; latencyMs: number; message: string }> => {
  const targetUrl = (testUrl || getMakeWebhookUrl()).trim();
  if (!targetUrl) {
    return { success: false, latencyMs: 0, message: 'Please enter a valid Make.com Webhook URL first.' };
  }

  const startTime = Date.now();
  const testPayload = {
    event: 'test.ping',
    type: 'TEST_PING',
    id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
    orderNumber: 'ORD-TEST-001',
    customerName: 'Test Client (Make.com Verification)',
    email: 'client@example.com',
    phone: '+44 7000 000000',
    status: 'New Order',
    totalPrice: 150.00,
    deliveryFee: 15.00,
    fulfillmentType: 'Delivery',
    deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    deliveryTimeSlot: 'Morning (9am - 12pm)',
    category: 'Both',
    flavor: 'Vanilla Bean & Wild Raspberry',
    size: '8 inch Luxury Tier',
    pastriesSummary: '6x Artisan Macarons',
    orderUrl: (typeof window !== 'undefined' ? window.location.origin : '') + '/order/TEST-001',
    timestamp: new Date().toISOString(),
    source: 'Christos Cakes Luxury Bakery'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apiKey = getMakeApiKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      saveLastSyncStatus({
        success: true,
        status: response.status,
        message: `✓ Connected! Response in ${latencyMs}ms`,
        timestamp: new Date().toISOString(),
        event: 'test.ping'
      });
      return {
        success: true,
        status: response.status,
        latencyMs,
        message: `✓ Success! Make.com responded with status ${response.status} in ${latencyMs}ms.`
      };
    } else {
      let specificHint = `Check that your scenario is turned ON or scheduled.`;
      const isNotHookSubdomain = !targetUrl.toLowerCase().includes('hook.');
      
      if (response.status === 401) {
        if (isNotHookSubdomain) {
          specificHint = `Notice: Your URL does not contain "hook." (e.g. hook.eu1.make.com). In Make.com, open your scenario's "Custom Webhook" module and click "Copy address to clipboard". Do not copy the URL from your browser address bar.`;
        } else {
          specificHint = `Turn your scenario switch to "ON" in the bottom-left of Make.com (or click "Run once" on the canvas). If your webhook requires an API token, enter it in the API Key field below.`;
        }
      }

      return {
        success: false,
        status: response.status,
        latencyMs,
        message: `Make.com returned HTTP ${response.status} ${response.statusText || 'Unauthorized'}. ${specificHint}`
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: err.name === 'AbortError'
        ? 'Connection timed out after 10 seconds. Verify the Make.com webhook URL.'
        : `Connection test error: ${err.message || 'Unable to reach Make.com webhook'}`
    };
  }
};
