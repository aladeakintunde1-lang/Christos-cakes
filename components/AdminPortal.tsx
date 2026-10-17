
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LockKeyhole, 
  Clock, 
  CalendarClock, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  UploadCloud, 
  ExternalLink, 
  Info, 
  ClipboardList,
  MapPin,
  DollarSign,
  RefreshCw,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  Database,
  Key,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  CreditCard,
  Send,
  Globe,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Save,
  Zap,
  Activity,
  Check
} from 'lucide-react';
import { 
  syncWithSupabase,
  getOrders, 
  updateOrderStatus, 
  updateOrderPrice,
  deleteOrder, 
  getGalleryImages, 
  addGalleryImage, 
  deleteGalleryImage,
  getLogoUrl,
  saveLogoUrl,
  getOwnerSettings,
  saveOwnerSettings
} from '../utils/storage';
import {
  getMakeWebhookUrl,
  setMakeWebhookUrl,
  isMakeAutoSyncEnabled,
  setMakeAutoSyncEnabled,
  getLastSyncStatus,
  testMakeWebhook,
  syncAutomationUpdate,
  SyncResult
} from '../services/automation';
import makeBlueprint from '../make/christos_cakes_make_blueprint.json';
import { 
  getSupabaseUrl, 
  getSupabaseAnonKey, 
  reconfigureSupabase, 
  resetSupabaseToDefault,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  supabase
} from '../utils/supabase';
import { Order, OrderStatus, GalleryImage, ImageDisplayMode, OwnerProfile } from '../types';
import { ADMIN_PASSWORD, LOGO_URL } from '../constants';
import masterWorkflow from '../n8n/master_workflow.json';

const N8N_WEBHOOK_URL_ENV = import.meta.env.VITE_N8N_WEBHOOK_URL;


const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [viewMode, setViewMode] = useState<'Orders' | 'Gallery' | 'Insights' | 'Settings'>('Orders');
  const [instaImportUrl, setInstaImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [displayMode, setDisplayMode] = useState<ImageDisplayMode>('original');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(LOGO_URL);
  const [localWebhookUrl, setLocalWebhookUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('sweettrack_webhook_url') || '';
    } catch (e) {
      return '';
    }
  });
  const [localN8nUrl, setLocalN8nUrl] = useState<string>(() => {
    try { return localStorage.getItem('sweettrack_n8n_url') || ''; } catch { return ''; }
  });
  const [localN8nApiKey, setLocalN8nApiKey] = useState<string>(() => {
    try { return localStorage.getItem('sweettrack_n8n_api_key') || ''; } catch { return ''; }
  });
  const [isSyncingWorkflow, setIsSyncingWorkflow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Make.com Automation Suite State
  const [localMakeWebhookUrl, setLocalMakeWebhookUrl] = useState<string>(getMakeWebhookUrl());
  const [isMakeAutoSync, setIsMakeAutoSync] = useState<boolean>(isMakeAutoSyncEnabled());
  const [isTestingMake, setIsTestingMake] = useState<boolean>(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState<boolean>(false);
  const [makeFeedback, setMakeFeedback] = useState<{ type: 'success' | 'error' | null; message: string; latency?: number }>({ type: null, message: '' });
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(getLastSyncStatus());

  const handleTestMake = async () => {
    if (!localMakeWebhookUrl.trim()) {
      setMakeFeedback({ type: 'error', message: 'Please enter a valid Make.com Webhook URL before testing.' });
      return;
    }
    setIsTestingMake(true);
    setMakeFeedback({ type: null, message: '' });
    try {
      const res = await testMakeWebhook(localMakeWebhookUrl);
      setIsTestingMake(false);
      if (res.success) {
        setMakeFeedback({
          type: 'success',
          message: res.message,
          latency: res.latencyMs
        });
        setLastSyncResult(getLastSyncStatus());
      } else {
        setMakeFeedback({
          type: 'error',
          message: res.message,
          latency: res.latencyMs
        });
      }
    } catch (err: any) {
      setIsTestingMake(false);
      setMakeFeedback({
        type: 'error',
        message: `Test failed: ${err.message || 'Unknown network error'}`
      });
    }
  };

  const handleDownloadMakeBlueprint = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(makeBlueprint, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "christos_cakes_make_blueprint.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMakeFeedback({ type: 'success', message: '✓ Make.com scenario blueprint downloaded successfully! Ready to import.' });
      setTimeout(() => setMakeFeedback({ type: null, message: '' }), 5000);
    } catch (err) {
      setMakeFeedback({ type: 'error', message: 'Failed to download Make.com blueprint file.' });
    }
  };

  const handleCopyMakeBlueprint = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(makeBlueprint, null, 2));
      setMakeFeedback({ type: 'success', message: '✓ Make.com blueprint JSON copied to clipboard!' });
      setTimeout(() => setMakeFeedback({ type: null, message: '' }), 5000);
    } catch (err) {
      setMakeFeedback({ type: 'error', message: 'Failed to copy to clipboard.' });
    }
  };

  const handleBulkSyncToMake = async () => {
    if (!localMakeWebhookUrl.trim()) {
      setMakeFeedback({ type: 'error', message: 'Please enter your Make.com Webhook URL before initiating sync.' });
      return;
    }
    setIsBulkSyncing(true);
    setMakeFeedback({ type: null, message: '' });
    let count = 0;
    try {
      for (const ord of orders) {
        await syncAutomationUpdate({
          event: 'order.synchronized',
          type: 'ORDER_SYNC',
          order: ord,
          orderId: ord.id,
          force: true
        });
        count++;
      }
      setMakeFeedback({
        type: 'success',
        message: `✓ Successfully synchronized ${count} active orders to Make.com in real time!`
      });
      setLastSyncResult(getLastSyncStatus());
    } catch (err: any) {
      setMakeFeedback({
        type: 'error',
        message: `Bulk sync encountered an issue: ${err.message || 'Error communicating with Make.com'}`
      });
    } finally {
      setIsBulkSyncing(false);
    }
  };

  // Supabase Configuration & Profile State
  const [localSupabaseUrl, setLocalSupabaseUrl] = useState<string>(getSupabaseUrl());
  const [localSupabaseAnonKey, setLocalSupabaseAnonKey] = useState<string>(getSupabaseAnonKey());
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseFeedback, setSupabaseFeedback] = useState<{ type: 'success' | 'error' | null; message: string; latency?: number }>({ type: null, message: '' });

  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(getOwnerSettings());
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const [isSendingAuth, setIsSendingAuth] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [copiedSql, setCopiedSql] = useState(false);


  const handleCopyWorkflow = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(masterWorkflow, null, 2));
      setSyncFeedback({ type: 'success', message: '✓ Workflow JSON copied to clipboard!' });
      setTimeout(() => setSyncFeedback({ type: null, message: '' }), 5000);
    } catch (err) {
      setSyncFeedback({ type: 'error', message: 'Failed to copy to clipboard.' });
    }
  };

  const handleDownloadWorkflow = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(masterWorkflow, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "christos_cakes_n8n_workflow.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSyncFeedback({ type: 'success', message: '✓ Workflow JSON file downloaded!' });
      setTimeout(() => setSyncFeedback({ type: null, message: '' }), 5000);
    } catch (err) {
      setSyncFeedback({ type: 'error', message: 'Failed to download file.' });
    }
  };

  const handleAutoSync = async () => {
    if (!localN8nUrl || !localN8nApiKey) {
      setSyncFeedback({ type: 'error', message: 'Please enter both your n8n Instance URL and API Key.' });
      return;
    }

    setIsSyncingWorkflow(true);
    setSyncFeedback({ type: null, message: '' });

    const cleanedBaseUrl = localN8nUrl.trim().replace(/\/$/, '');
    
    try {
      // 1. Fetch existing workflows from n8n to check if ours is already there
      const getWorkflowsUrl = `${cleanedBaseUrl}/api/v1/workflows`;
      console.log('Querying n8n workflows from:', getWorkflowsUrl);
      
      const response = await fetch(getWorkflowsUrl, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': localN8nApiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to read workflows: ${response.status} ${response.statusText}`);
      }

      const resData = await response.json();
      const existingWorkflows = resData.data || [];
      
      // Find any workflow with our target name: "Christos Cakes - Full Notification Mode"
      const existingWf = existingWorkflows.find(
        (wf: any) => wf.name === masterWorkflow.name || wf.name?.includes("Christos Cakes")
      );

      if (existingWf) {
        // 2a. Update the existing workflow (PUT)
        const updateUrl = `${cleanedBaseUrl}/api/v1/workflows/${existingWf.id}`;
        console.log('Updating existing workflow:', updateUrl);
        
        const updatePayload = {
          ...masterWorkflow,
          id: existingWf.id,
          active: existingWf.active // Keep active status as is
        };

        const putResponse = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': localN8nApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });

        if (!putResponse.ok) {
          const bodyText = await putResponse.text();
          throw new Error(`Failed to update workflow: ${putResponse.status}. ${bodyText}`);
        }

        setSyncFeedback({ 
          type: 'success', 
          message: `✓ Success! Updated existing workflow "${existingWf.name}" (ID: ${existingWf.id}) on your n8n instance successfully.` 
        });
      } else {
        // 2b. Create a new workflow (POST)
        const createUrl = `${cleanedBaseUrl}/api/v1/workflows`;
        console.log('Creating new workflow:', createUrl);

        const postResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': localN8nApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(masterWorkflow)
        });

        if (!postResponse.ok) {
          const bodyText = await postResponse.text();
          throw new Error(`Failed to create workflow: ${postResponse.status}. ${bodyText}`);
        }

        const syncResult = await postResponse.json();
        setSyncFeedback({ 
          type: 'success', 
          message: `✓ Success! Created new workflow "${masterWorkflow.name}" (ID: ${syncResult.id}) on your n8n instance successfully!` 
        });
      }

    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || '';
      
      if (errorMsg.includes('Failed to fetch') || err.name === 'TypeError') {
        setSyncFeedback({ 
          type: 'error', 
          message: 'Direct API sync was blocked by your browser\'s security/CORS policy. This is common due to cross-domain security boundaries in modern browsers. But don\'t worry! We have copied the updated workflow to your clipboard, and you can also download the JSON file below to import it in 2 clicks.' 
        });
        // Call copy helper as a seamless fallback
        try {
          await navigator.clipboard.writeText(JSON.stringify(masterWorkflow, null, 2));
        } catch {}
      } else {
        setSyncFeedback({ 
          type: 'error', 
          message: `Sync failed: ${errorMsg}` 
        });
      }
    } finally {
      setIsSyncingWorkflow(false);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const activeWebhookUrl = N8N_WEBHOOK_URL_ENV || localWebhookUrl;

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      const savedLogo = getLogoUrl();
      if (savedLogo) setCustomLogoUrl(savedLogo);
    }
  }, [isAuthenticated]);

  // Real-time Order Notification for Admin
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sweettrack_orders') {
        refreshData();
        setLastAction('🚨 NEW ORDER RECEIVED');
        setTimeout(() => setLastAction(null), 5000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refreshData = async () => {
    await syncWithSupabase();
    setOrders(getOrders().sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()));
    setGalleryImages(getGalleryImages());
    setOwnerProfile(getOwnerSettings());
  };

  const handleSaveSupabaseConfig = async () => {
    try {
      reconfigureSupabase(localSupabaseUrl, localSupabaseAnonKey);
      setSupabaseFeedback({ type: 'success', message: '✓ Supabase credentials updated and active!' });
      await refreshData();
      await handleTestSupabaseConnection();
      setTimeout(() => setSupabaseFeedback(prev => prev.type === 'success' ? { type: null, message: '' } : prev), 4000);
    } catch (err: any) {
      setSupabaseFeedback({ type: 'error', message: err?.message || 'Failed to apply Supabase config.' });
    }
  };

  const handleResetSupabaseConfig = async () => {
    resetSupabaseToDefault();
    setLocalSupabaseUrl(DEFAULT_SUPABASE_URL);
    setLocalSupabaseAnonKey(DEFAULT_SUPABASE_ANON_KEY);
    setSupabaseFeedback({ type: 'success', message: '✓ Supabase credentials reset to project defaults.' });
    await refreshData();
    setTimeout(() => setSupabaseFeedback({ type: null, message: '' }), 4000);
  };

  const handleTestSupabaseConnection = async () => {
    setIsTestingSupabase(true);
    setSupabaseFeedback({ type: null, message: '' });
    const startTime = performance.now();
    try {
      const { error: sErr } = await supabase.from('settings').select('id, adminWhatsAppNumber').limit(1);
      if (sErr) throw sErr;

      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: galleryCount } = await supabase.from('gallery').select('*', { count: 'exact', head: true });
      const latency = Math.round(performance.now() - startTime);

      setSupabaseFeedback({
        type: 'success',
        latency,
        message: `✓ Connected to Supabase (${latency}ms) — Database live. Total Orders: ${ordersCount ?? 0}, Gallery Photos: ${galleryCount ?? 0}. Settings active.`
      });
    } catch (err: any) {
      setSupabaseFeedback({
        type: 'error',
        message: `Connection failed: ${err?.message || 'Check your Supabase URL & Anon Key'}`
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveOwnerProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    setProfileFeedback({ type: null, message: '' });
    try {
      const res = await saveOwnerSettings(ownerProfile);
      if (!res.success) throw res.error;
      setProfileFeedback({
        type: 'success',
        message: '✓ Your information has been successfully updated on your Supabase account!'
      });
      setLastAction('Supabase information updated');
      setTimeout(() => setLastAction(null), 3000);
      setTimeout(() => setProfileFeedback({ type: null, message: '' }), 6000);
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: `Failed to save to Supabase: ${err?.message || 'Check connection'}`
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!ownerProfile.adminEmail) {
      setAuthFeedback({ type: 'error', message: 'Please enter a valid Admin Email first.' });
      return;
    }
    setIsSendingAuth(true);
    setAuthFeedback({ type: null, message: '' });
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: ownerProfile.adminEmail });
      if (error) throw error;
      setAuthFeedback({
        type: 'success',
        message: `✓ Magic login link sent to ${ownerProfile.adminEmail}! Check your inbox.`
      });
      setTimeout(() => setAuthFeedback({ type: null, message: '' }), 6000);
    } catch (err: any) {
      setAuthFeedback({
        type: 'error',
        message: err?.message || 'Failed to dispatch magic link. Verify email auth provider is enabled in Supabase.'
      });
    } finally {
      setIsSendingAuth(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!ownerProfile.adminEmail) {
      setAuthFeedback({ type: 'error', message: 'Please enter a valid Admin Email first.' });
      return;
    }
    setIsSendingAuth(true);
    setAuthFeedback({ type: null, message: '' });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(ownerProfile.adminEmail);
      if (error) throw error;
      setAuthFeedback({
        type: 'success',
        message: `✓ Password reset link sent to ${ownerProfile.adminEmail} via Supabase Auth!`
      });
      setTimeout(() => setAuthFeedback({ type: null, message: '' }), 6000);
    } catch (err: any) {
      setAuthFeedback({
        type: 'error',
        message: err?.message || 'Failed to send password reset.'
      });
    } finally {
      setIsSendingAuth(false);
    }
  };


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password');
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    await refreshData();
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Permanently delete this order record?')) {
      await deleteOrder(orderId);
      await refreshData();
    }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newImg: GalleryImage = {
          id: 'img_' + Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          displayMode: displayMode,
          createdAt: new Date().toISOString()
        };
        await addGalleryImage(newImg);
        await refreshData();
        setLastAction('New image added to storefront!');
        setTimeout(() => setLastAction(null), 3000);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInstagramImport = async () => {
    if (!instaImportUrl) return;
    setIsImporting(true);
    
    try {
      let cleanUrl = instaImportUrl.trim().split('?')[0];
      if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
      if (!cleanUrl.endsWith('/')) cleanUrl += '/';
      
      const rawInstaMediaUrl = `${cleanUrl}media/?size=l`;
      const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawInstaMediaUrl.replace(/^https?:\/\//, ''))}&n=-1`;
      
      const newImg: GalleryImage = {
        id: 'insta_' + Math.random().toString(36).substr(2, 9),
        url: proxiedUrl,
        displayMode: displayMode,
        createdAt: new Date().toISOString()
      };
      
      addGalleryImage(newImg);
      refreshData();
      setInstaImportUrl('');
      setLastAction('Instagram photo imported!');
      setTimeout(() => setLastAction(null), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to import image from Instagram.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setCustomLogoUrl(url);
        saveLogoUrl(url);
        setLastAction('Brand logo updated!');
        setTimeout(() => setLastAction(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('PERMANENTLY DELETE THIS PHOTO?\n\nThis will remove it from your public gallery immediately.')) {
      deleteGalleryImage(id);
      setGalleryImages(prev => prev.filter(img => img.id !== id));
      setLastAction('Photo deleted');
      setTimeout(() => setLastAction(null), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="relative w-full max-w-md">
          {/* Visual "Stack" Layers */}
          <div className="absolute -inset-4 bg-white/20 rounded-[3rem] -z-10 blur-xl" />
          <div className="absolute inset-2 bg-pink-100/10 rounded-[2.5rem] -z-10 translate-y-4" />
          
          <div className="glass-card p-12 rounded-[2.5rem] shadow-[0_40px_100px_rgba(219,39,119,0.08)] border-white/80 text-center">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <LockKeyhole className="h-10 w-10 text-pink-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-light mb-3 text-pink-950 font-serif tracking-tight">Studio Access</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">Christos Cakes Management</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Access Key"
                  className="w-full p-5 bg-white/40 rounded-2xl border border-white/60 focus:border-pink-300 focus:bg-white outline-none transition-all text-center font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="w-full bg-pink-700 text-white p-5 rounded-2xl font-bold text-xs tracking-[0.3em] hover:bg-pink-800 transition-all shadow-[0_15px_40px_rgba(190,24,93,0.2)] active:scale-[0.98] uppercase">
                Enter Studio
              </button>
            </form>
            <p className="mt-8 text-[9px] text-pink-200 uppercase tracking-[0.4em] font-bold">Key: cake</p>
          </div>
        </div>
      </div>
    );
  }

  const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="relative max-w-6xl mx-auto pb-32">
      {/* Visual "Stack" Layers */}
      <div className="absolute -inset-4 bg-white/20 rounded-[4rem] -z-10 blur-xl" />
      <div className="absolute inset-2 bg-pink-100/10 rounded-[3.5rem] -z-10 translate-y-4" />
      
      <div className="glass-card rounded-[3.5rem] p-8 md:p-16 shadow-[0_40px_100px_rgba(219,39,119,0.08)] border-white/80">
        {/* GLOBAL NOTIFICATION */}
        {lastAction && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 rounded-full text-[10px] font-black tracking-widest shadow-2xl animate-bounce border uppercase ${lastAction.includes('NEW ORDER') ? 'bg-pink-600 text-white border-pink-400' : 'bg-slate-900 text-white border-white/20'}`}>
          {lastAction}
        </div>
      )}

      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-serif">Admin Management</h1>
          <p className="text-sm text-slate-500 font-medium">Control center for Christos Cakes</p>
        </div>
        <div className="flex bg-slate-200/60 p-1.5 rounded-3xl w-full xl:w-auto shadow-inner backdrop-blur-sm gap-1 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setViewMode('Orders')}
            className={`flex-1 xl:flex-none px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase ${viewMode === 'Orders' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setViewMode('Gallery')}
            className={`flex-1 xl:flex-none px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase ${viewMode === 'Gallery' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Gallery Studio
          </button>
          <button 
            onClick={() => setViewMode('Insights')}
            className={`flex-1 xl:flex-none px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase ${viewMode === 'Insights' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Insights
          </button>
          <button 
            onClick={() => setViewMode('Settings')}
            className={`flex-1 xl:flex-none px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase ${viewMode === 'Settings' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Settings
          </button>
        </div>
      </header>

      {viewMode === 'Insights' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase mb-2 tracking-widest">Total Revenue</h3>
            <p className="text-5xl font-bold text-slate-900 font-serif">£{(revenue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-pink-500" strokeWidth={3} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase mb-2 tracking-widest">Active Orders</h3>
            <p className="text-5xl font-bold text-slate-900 font-serif">{orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length}</p>
          </div>
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CalendarClock className="h-6 w-6 text-blue-500" strokeWidth={3} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase mb-2 tracking-widest">Collections</h3>
            <p className="text-5xl font-bold text-slate-900 font-serif">{orders.filter(o => o.fulfillmentType === 'Collection').length}</p>
          </div>
        </div>
      )}

      {viewMode === 'Gallery' && (
        <div className="animate-slideIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl sticky top-28">
                <h2 className="text-2xl font-bold text-slate-900 font-serif mb-2">Storefront Manager</h2>
                <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">Update the customer-facing gallery with new cake designs.</p>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Style</label>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-100">
                      <button 
                        onClick={() => setDisplayMode('original')} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase ${displayMode === 'original' ? 'bg-white text-pink-600 shadow-md' : 'text-slate-400'}`}
                      >
                        Portrait
                      </button>
                      <button 
                        onClick={() => setDisplayMode('square')} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase ${displayMode === 'square' ? 'bg-white text-pink-600 shadow-md' : 'text-slate-400'}`}
                      >
                        Square
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram Import</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Link..." 
                        className="flex-1 px-4 py-4 bg-slate-50 rounded-2xl text-xs border border-transparent focus:border-pink-100 focus:bg-white transition-all outline-none"
                        value={instaImportUrl} 
                        onChange={e => setInstaImportUrl(e.target.value)}
                      />
                      <button 
                        onClick={handleInstagramImport} 
                        disabled={isImporting || !instaImportUrl} 
                        className="bg-slate-900 text-white px-5 py-4 rounded-2xl font-black text-[10px] hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
                      >
                        {isImporting ? '...' : 'OK'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full bg-pink-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-pink-100 hover:bg-pink-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <Upload className="h-5 w-5" />
                      UPLOAD PHOTO
                    </button>
                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleAddImage} />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex justify-between items-end mb-6 px-2">
                <h2 className="text-xl font-bold text-slate-900 font-serif">Live Photos ({galleryImages.length})</h2>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tap red button to delete</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {galleryImages.map(img => (
                  <div key={img.id} className="flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group hover:border-pink-100 hover:shadow-xl transition-all relative">
                    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
                      <img 
                        src={img.url} 
                        className={`w-full h-full transition-all duration-700 group-hover:scale-105 ${img.displayMode === 'square' ? 'object-cover' : 'object-contain'}`} 
                        alt="Gallery Content" 
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                          {img.displayMode}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <button 
                        onClick={(e) => handleDeleteImage(e, img.id)}
                        className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-red-100"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={3} />
                        Delete Permanent
                      </button>
                    </div>
                  </div>
                ))}

                {galleryImages.length === 0 && (
                  <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center px-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <ImageIcon className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 font-serif">Gallery is Empty</h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed font-medium">Use the upload tool on the left to add your beautiful cake photos to the storefront.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'Settings' && (
        <div className="animate-slideIn max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2.5 rounded-2xl bg-pink-50 text-pink-600">
                  <Database className="h-6 w-6" />
                </span>
                <h2 className="text-3xl font-bold text-slate-900 font-serif">Supabase & Studio Settings</h2>
              </div>
              <p className="text-sm text-slate-400 font-medium max-w-xl">
                Manage your live Supabase database account, owner profile & WhatsApp notification info, brand identity, and automation workflows.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Connected
            </div>
          </div>

          {/* 1. OWNER PROFILE IN SUPABASE */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100/80 rounded-2xl flex items-center justify-center text-pink-600 shadow-inner">
                  <Building className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">Owner & Studio Profile in Supabase</h3>
                  <p className="text-xs text-slate-400 font-medium">Synchronized with your Supabase database table <code className="bg-slate-100 px-1.5 py-0.5 rounded text-pink-600 font-mono text-[10px]">settings</code></p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-black bg-pink-50 text-pink-600 px-3.5 py-1.5 rounded-full border border-pink-100">
                Primary Account Info
              </span>
            </div>

            <form onSubmit={handleSaveOwnerProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <Mail className="h-3.5 w-3.5 text-pink-500" />
                    Admin Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.adminEmail}
                    onChange={e => setOwnerProfile({ ...ownerProfile, adminEmail: e.target.value })}
                    placeholder="e.g. aladeakintunde1@gmail.com"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Used for admin notifications and access recovery.</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <Phone className="h-3.5 w-3.5 text-pink-500" />
                    Admin WhatsApp & Phone
                  </label>
                  <input 
                    type="tel"
                    required
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.adminWhatsAppNumber}
                    onChange={e => setOwnerProfile({ ...ownerProfile, adminWhatsAppNumber: e.target.value })}
                    placeholder="e.g. +447393150048"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Receives instant WhatsApp alerts when customers place orders.</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <Building className="h-3.5 w-3.5 text-pink-500" />
                    Business / Brand Name
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.businessName}
                    onChange={e => setOwnerProfile({ ...ownerProfile, businessName: e.target.value })}
                    placeholder="e.g. Christos Cakes & Events"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <Globe className="h-3.5 w-3.5 text-pink-500" />
                    Instagram Profile Link
                  </label>
                  <input 
                    type="url"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.instagramUrl}
                    onChange={e => setOwnerProfile({ ...ownerProfile, instagramUrl: e.target.value })}
                    placeholder="https://www.instagram.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <MapPin className="h-3.5 w-3.5 text-pink-500" />
                    Studio Pickup Address
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.pickupAddress}
                    onChange={e => setOwnerProfile({ ...ownerProfile, pickupAddress: e.target.value })}
                    placeholder="e.g. 7 Singh street, Wellington, TA21 9RH"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <MapPin className="h-3.5 w-3.5 text-pink-500" />
                    Studio Postcode (Distance Calculation Base)
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.shopPostcode}
                    onChange={e => setOwnerProfile({ ...ownerProfile, shopPostcode: e.target.value })}
                    placeholder="e.g. TA21 9RH"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-pink-500" />
                    Bank Name
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.bankName}
                    onChange={e => setOwnerProfile({ ...ownerProfile, bankName: e.target.value })}
                    placeholder="e.g. Monzo"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-pink-500" />
                    Account Name (Beneficiary)
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.accountName}
                    onChange={e => setOwnerProfile({ ...ownerProfile, accountName: e.target.value })}
                    placeholder="e.g. Christianah Alade"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-pink-500" />
                    Sort Code
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 font-mono transition-all"
                    value={ownerProfile.sortCode}
                    onChange={e => setOwnerProfile({ ...ownerProfile, sortCode: e.target.value })}
                    placeholder="e.g. 04-00-03"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-pink-500" />
                    Account Number
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 font-mono transition-all"
                    value={ownerProfile.accountNumber}
                    onChange={e => setOwnerProfile({ ...ownerProfile, accountNumber: e.target.value })}
                    placeholder="e.g. 90709406"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    <Info className="h-3.5 w-3.5 text-pink-500" />
                    Payment Reference Instructions
                  </label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-bold text-slate-800 transition-all"
                    value={ownerProfile.reference}
                    onChange={e => setOwnerProfile({ ...ownerProfile, reference: e.target.value })}
                    placeholder="e.g. your name only please"
                  />
                </div>
              </div>

              {profileFeedback.message && (
                <div className={`p-5 rounded-2xl border flex gap-3 text-xs font-semibold leading-relaxed animate-fadeIn ${profileFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                  {profileFeedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
                  <div>{profileFeedback.message}</div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all shadow-xl shadow-pink-100 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isSavingProfile ? 'animate-spin' : ''}`} />
                  {isSavingProfile ? 'Updating Information on Supabase...' : 'Save & Update Information on Supabase'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. SUPABASE ACCOUNT & CREDENTIALS MANAGER */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <Database className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">Supabase Project Connection & Keys</h3>
                  <p className="text-xs text-slate-400 font-medium">Configure or switch the Supabase project connected to this app</p>
                </div>
              </div>
              <a
                href={`https://supabase.com/dashboard/project/${localSupabaseUrl.replace('https://', '').split('.')[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-pink-600 bg-slate-50 hover:bg-pink-50 px-4 py-2 rounded-xl transition-all border border-slate-200"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                    Supabase Project URL
                  </label>
                  {localSupabaseUrl === DEFAULT_SUPABASE_URL ? (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Default Instance</span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Custom Project Active</span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={localSupabaseUrl}
                  onChange={e => setLocalSupabaseUrl(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full p-4 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-emerald-300 outline-none text-sm font-mono text-slate-800 transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-emerald-600" />
                    Supabase Anon Public API Key
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowAnonKey(!showAnonKey)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                  >
                    {showAnonKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showAnonKey ? 'Hide Key' : 'Reveal Key'}
                  </button>
                </div>
                <input 
                  type={showAnonKey ? 'text' : 'password'}
                  value={localSupabaseAnonKey}
                  onChange={e => setLocalSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-4 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-emerald-300 outline-none text-sm font-mono text-slate-800 transition-all"
                />
              </div>

              {supabaseFeedback.message && (
                <div className={`p-5 rounded-2xl border flex gap-3 text-xs font-semibold leading-relaxed animate-fadeIn ${supabaseFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                  {supabaseFeedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
                  <div>{supabaseFeedback.message}</div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Save & Apply Connection
                </button>
                <button
                  type="button"
                  onClick={handleTestSupabaseConnection}
                  disabled={isTestingSupabase}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  {isTestingSupabase ? 'Testing Ping...' : 'Test Connection'}
                </button>
                {(localSupabaseUrl !== DEFAULT_SUPABASE_URL || localSupabaseAnonKey !== DEFAULT_SUPABASE_ANON_KEY) && (
                  <button
                    type="button"
                    onClick={handleResetSupabaseConfig}
                    className="bg-white border border-slate-200 text-slate-600 hover:text-rose-600 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. SUPABASE AUTHENTICATION & ADMIN ROLES */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Supabase Auth & Admin User Access</h3>
                <p className="text-xs text-slate-400 font-medium">Manage authentication, login credentials, and database admin privileges</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Account</span>
                  <p className="text-base font-bold text-slate-800 font-mono">{ownerProfile.adminEmail || 'No email specified'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSendMagicLink}
                    disabled={isSendingAuth}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Magic Link
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingAuth}
                    className="bg-white border border-slate-200 text-slate-700 hover:text-pink-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Key className="h-3.5 w-3.5" />
                    Reset Password
                  </button>
                </div>
              </div>

              {authFeedback.message && (
                <div className={`p-5 rounded-2xl border flex gap-3 text-xs font-semibold leading-relaxed animate-fadeIn ${authFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                  {authFeedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
                  <div>{authFeedback.message}</div>
                </div>
              )}

              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SQL Snippet for Supabase admin_users</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`INSERT INTO admin_users (id, role) VALUES ('YOUR_AUTH_USER_ID', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin';`);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="text-[10px] font-bold text-pink-600 hover:text-pink-800 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedSql ? '✓ Copied SQL!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="bg-slate-900 text-pink-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`INSERT INTO admin_users (id, role) 
VALUES ('YOUR_AUTH_USER_ID', 'admin') 
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
                </pre>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Run this once in the Supabase SQL Editor if you create a user in Supabase Authentication and want full admin privileges assigned.
                </p>
              </div>
            </div>
          </div>

          {/* 4. BRAND ASSETS & LOGO */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 font-serif mb-2">Brand Assets & Order Logo</h3>
            <p className="text-xs text-slate-400 mb-8 font-medium">The official logo displayed on storefront and customer invoices.</p>
            
            <div className="flex flex-col items-center p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Current Order Logo</p>
              <div className="w-48 h-48 bg-white rounded-[2rem] shadow-inner border border-slate-200 flex items-center justify-center overflow-hidden mb-8 p-4">
                <img src={customLogoUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
              </div>
              
              <div className="flex gap-4 w-full max-w-md">
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" strokeWidth={2.5} />
                  Upload New Logo
                </button>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={logoInputRef} 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
                {customLogoUrl !== LOGO_URL && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem('sweettrack_settings');
                      setCustomLogoUrl(LOGO_URL);
                      setLastAction('Logo reset to default');
                      setTimeout(() => setLastAction(null), 3000);
                    }}
                    className="px-6 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all border border-slate-200 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. MAKE.COM AUTOMATION SUITE & REAL-TIME SYNCHRONIZATION */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
                  <Zap className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-slate-900 font-serif">Make.com Automation</h3>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                      Primary Workflow
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Synchronize any order creation, status update, bespoke quote, and client review instantly
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  localMakeWebhookUrl 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${localMakeWebhookUrl ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {localMakeWebhookUrl ? 'Connected & Ready' : 'Webhook Required'}
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Webhook URL Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Make.com Custom Webhook URL
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">From your Make.com Scenario Webhook module</span>
                </div>
                <div className="relative">
                  <input 
                    type="url" 
                    placeholder="https://hook.eu1.make.com/your-custom-webhook-hash"
                    className="w-full p-4 pr-12 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-purple-400 outline-none text-sm font-mono text-slate-800 transition-all"
                    value={localMakeWebhookUrl}
                    onChange={e => {
                      const val = e.target.value;
                      setLocalMakeWebhookUrl(val);
                      setMakeWebhookUrl(val);
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Globe className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                  Every order event (<code className="bg-slate-100 px-1 py-0.5 rounded text-pink-700">order.created</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-700">order.status_updated</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-700">order.quote_updated</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-700">feedback.submitted</code>) will be dispatched here in real time.
                </p>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Synchronize on Any Update</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-lg">
                    Automatically triggers Make.com when status changes (Baking, Ready, Delivered), when price/quote is updated, or when feedback is submitted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isMakeAutoSync;
                    setIsMakeAutoSync(next);
                    setMakeAutoSyncEnabled(next);
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isMakeAutoSync ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isMakeAutoSync ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Feedback Alert */}
              {makeFeedback.message && (
                <div className={`p-5 rounded-2xl border flex gap-4 text-xs font-medium leading-relaxed ${
                  makeFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {makeFeedback.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">{makeFeedback.message}</div>
                    {makeFeedback.latency !== undefined && (
                      <div className="text-[10px] opacity-80 mt-1">Roundtrip Latency: {makeFeedback.latency} ms</div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={handleTestMake}
                  disabled={isTestingMake || !localMakeWebhookUrl}
                  className="bg-purple-600 text-white py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Zap className={`h-4 w-4 ${isTestingMake ? 'animate-spin' : ''}`} />
                  {isTestingMake ? 'Testing...' : 'Test Webhook'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMakeBlueprint}
                  className="bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Blueprint
                </button>

                <button
                  type="button"
                  onClick={handleCopyMakeBlueprint}
                  className="bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:text-purple-700 py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  Copy Blueprint
                </button>

                <button
                  type="button"
                  onClick={handleBulkSyncToMake}
                  disabled={isBulkSyncing || !localMakeWebhookUrl || orders.length === 0}
                  className="bg-slate-900 text-white py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isBulkSyncing ? 'animate-spin' : ''}`} />
                  {isBulkSyncing ? 'Syncing...' : `Sync Orders (${orders.length})`}
                </button>
              </div>

              {/* Last Sync Status Tracker */}
              {lastSyncResult && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${lastSyncResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Last Synchronized Event</span>
                      <span className="text-xs font-bold text-slate-800">
                        {lastSyncResult.event || 'Automation Trigger'} {lastSyncResult.orderId ? `(#${lastSyncResult.orderId})` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    {new Date(lastSyncResult.timestamp).toLocaleTimeString()} · {lastSyncResult.message}
                  </div>
                </div>
              )}

              {/* 3-Step Setup Guide */}
              <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/60">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-purple-600" />
                  How to Set Up Your Make.com Scenario in 2 Minutes
                </h4>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                  <li>
                    Click <strong className="text-purple-700">Download Blueprint</strong> above to get the scenario file (<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">christos_cakes_make_blueprint.json</code>).
                  </li>
                  <li>
                    In <strong>Make.com</strong>, click <strong>Create a new scenario</strong>, click the <strong>...</strong> menu at the bottom bar, and choose <strong>Import Blueprint</strong>.
                  </li>
                  <li>
                    Click the <strong>Custom Webhook</strong> module, click <strong>Add</strong> to generate your URL, paste it above, and click <strong>Test Webhook</strong>. Every order creation and update is now live!
                  </li>
                </ol>
              </div>

              {/* Collapsible Legacy n8n Configuration */}
              <details className="border-t border-slate-200/60 pt-6 group">
                <summary className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] cursor-pointer hover:text-slate-600 flex items-center justify-between">
                  <span>Legacy n8n Workflow Options (Optional)</span>
                  <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                
                <div className="space-y-6 mt-6 pt-4 border-t border-dashed border-slate-200">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">n8n Instance URL</label>
                    <input 
                      type="text" 
                      placeholder="https://your-n8n-instance.com"
                      className="w-full p-4 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-medium"
                      value={localN8nUrl}
                      onChange={e => {
                        setLocalN8nUrl(e.target.value);
                        localStorage.setItem('sweettrack_n8n_url', e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">n8n API Key</label>
                    <input 
                      type="password" 
                      placeholder="Enter your X-N8N-API-KEY"
                      className="w-full p-4 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none text-sm font-medium"
                      value={localN8nApiKey}
                      onChange={e => {
                        setLocalN8nApiKey(e.target.value);
                        localStorage.setItem('sweettrack_n8n_api_key', e.target.value);
                      }}
                    />
                  </div>

                  {syncFeedback.message && (
                    <div className={`p-4 rounded-xl border flex gap-3 text-xs font-medium leading-relaxed ${syncFeedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                      {syncFeedback.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                      <div>{syncFeedback.message}</div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAutoSync}
                      disabled={isSyncingWorkflow}
                      className="flex-1 bg-slate-800 text-white py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncingWorkflow ? 'animate-spin' : ''}`} />
                      {isSyncingWorkflow ? 'Syncing n8n...' : 'Sync to n8n'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyWorkflow}
                      className="bg-white border border-slate-200 text-slate-600 hover:text-pink-600 py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy n8n JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadWorkflow}
                      className="bg-white border border-slate-200 text-slate-600 hover:text-pink-600 py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download n8n JSON
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}


      {viewMode === 'Orders' && (
        <div className="space-y-8 animate-slideIn">
           {orders.map(order => (
            <div key={order.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className={`h-3 w-full ${order.fulfillmentType === 'Delivery' ? 'bg-pink-600' : 'bg-stone-800'}`} />
              <div className="p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-10">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <span className={`text-[10px] font-mono font-bold uppercase px-4 py-2 rounded-full tracking-widest ${order.fulfillmentType === 'Delivery' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-stone-50 text-stone-700 border border-stone-200'}`}>
                        {order.fulfillmentType}
                      </span>
                      <span className="text-[10px] font-black uppercase px-4 py-2 rounded-full bg-slate-50 text-slate-500 border border-slate-100 tracking-widest">
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-4xl font-bold text-slate-900 leading-tight mb-2 font-serif">{order.customerName}</h3>
                    <p className="text-lg text-slate-500 font-medium mb-1">{order.deliveryDate} @ {order.deliveryTimeSlot}</p>
                    <p className="text-xs text-pink-600 font-black tracking-widest uppercase">{order.phone}</p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    {order.totalPrice ? (
                      <p className="font-bold text-4xl text-slate-900 font-serif mb-2">£{(order.totalPrice || 0).toFixed(2)}</p>
                    ) : (
                      <p className="font-black text-xs text-pink-600 uppercase tracking-widest mb-4 bg-pink-50 px-4 py-2 rounded-full">Price Pending</p>
                    )}
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => navigate(`/order/${order.id}`)}
                          className="text-[10px] font-black text-pink-600 hover:text-pink-800 uppercase tracking-[0.3em] transition-all"
                        >
                          View Order
                        </button>
                        <button 
                          onClick={() => handleCancelOrder(order.id)} 
                          className="text-[10px] font-black text-red-300 hover:text-red-600 uppercase tracking-[0.3em] transition-all"
                        >
                          Delete Order
                        </button>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white transition-colors flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Specifications</p>
                    {(order.category === 'Cake' || order.category === 'Both') && (
                      <div className="space-y-4 mb-6 pb-6 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                        <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-2">Bespoke Cake</p>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Size</span>
                          <p className="text-lg font-bold text-slate-800">{order.size}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Flavors & Fillings</span>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.flavor || 'Not specified'}</p>
                        </div>
                        <p className="text-sm text-slate-500 italic mt-4 leading-relaxed bg-white/50 p-4 rounded-xl">"{order.messageOnCake || 'No special message requested'}"</p>
                        
                        {order.inspirationLink && (
                          <div className="mt-4 pt-4 border-t border-slate-200/50">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Inspiration Link</p>
                            <a 
                              href={order.inspirationLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-pink-600 hover:underline flex items-center gap-2 truncate"
                            >
                              <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
                              View Instagram Design
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(order.category === 'Pastries' || order.category === 'Both') && (
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-2">Luxury Pastries</p>
                        {order.pastries?.map(p => (
                          <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-700">{p.name}</span>
                            <span className="text-xs font-black text-pink-600">x{p.quantity}</span>
                          </div>
                        ))}
                        {order.category === 'Pastries' && (!order.pastries || order.pastries.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No pastries selected</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Logistics</p>
                    <p className="text-xl font-bold text-slate-800">{order.postcode || 'Customer Collection'}</p>
                    <p className="text-sm text-slate-500 truncate mt-4">{order.address || '7 Singh Street, Wellington Studio'}</p>
                    {order.distance !== undefined && order.distance !== null && (
                      <div className="mt-4 pt-4 border-t border-slate-200/50">
                        <span className="text-[9px] font-black text-pink-600 uppercase tracking-widest block mb-1">Estimated Mileage</span>
                        <p className="text-lg font-black text-slate-900">{(order.distance || 0).toFixed(1)} miles</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-pink-50/30 p-8 rounded-[2rem] border border-pink-100 hover:bg-white transition-colors">
                    <p className="text-[10px] font-black text-pink-400 uppercase mb-4 tracking-widest">Price Management</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Base Price (£)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-pink-300"
                          defaultValue={order.totalPrice ? (order.totalPrice - (order.deliveryFee || 0)) : 0}
                          onBlur={async (e) => {
                            const base = parseFloat(e.target.value) || 0;
                            const fee = order.deliveryFee || 0;
                            await updateOrderPrice(order.id, base + fee, fee);
                            await refreshData();
                            setLastAction('Price updated');
                            setTimeout(() => setLastAction(null), 2000);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Delivery Fee (£)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-pink-300"
                          defaultValue={order.deliveryFee || 0}
                          onBlur={async (e) => {
                            const fee = parseFloat(e.target.value) || 0;
                            const base = (order.totalPrice || 0) - (order.deliveryFee || 0);
                            await updateOrderPrice(order.id, base + fee, fee);
                            await refreshData();
                            setLastAction('Delivery fee updated');
                            setTimeout(() => setLastAction(null), 2000);
                          }}
                        />
                      </div>
                      
                      <button 
                        disabled={!order.totalPrice || order.totalPrice <= 0}
                        onClick={async () => {
                          const activeUrl = getMakeWebhookUrl() || activeWebhookUrl;
                          if (activeUrl) {
                            try {
                              const res = await syncAutomationUpdate({
                                event: 'order.sent_to_client',
                                type: 'SEND_ORDER',
                                order,
                                orderId: order.id,
                                force: true
                              });
                              if (res.success) {
                                setLastAction('✓ Dispatched to Make.com & client');
                              } else {
                                setLastAction(`Dispatched: ${res.message}`);
                              }
                              setTimeout(() => setLastAction(null), 3500);
                            } catch (err) {
                              console.error(err);
                              alert('Failed to trigger automation. Check your Webhook URL.');
                            }
                          } else {
                            setViewMode('Settings');
                            alert('Automation Webhook not configured. Please set your Make.com Webhook in Settings.');
                          }
                        }}
                        className="w-full bg-pink-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:bg-slate-300 cursor-pointer"
                      >
                        Send Order to Client
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customer Feedback Card */}
                {order.feedbackRating && (
                  <div className="bg-pink-50/40 border border-pink-100/50 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row gap-6 items-start animate-fadeIn justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s}>
                              <svg className={`h-4 w-4 ${s <= (order.feedbackRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-pink-700 bg-pink-100/60 px-2.5 py-0.5 rounded-md uppercase">
                          Atelier Reflection
                        </span>
                      </div>
                      
                      {order.feedbackComment ? (
                        <p className="text-sm font-light text-slate-700 italic font-serif leading-relaxed">
                          "{order.feedbackComment}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Rated {order.feedbackRating} stars with no written feedback.</p>
                      )}
                    </div>
                    
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap self-end md:self-center">
                      {order.feedbackCreatedAt ? new Date(order.feedbackCreatedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {(['Pending', 'Baking', 'Ready', 'Completed'] as OrderStatus[]).map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleStatusChange(order.id, s)}
                      className={`flex-1 min-w-[140px] text-[10px] font-black py-5 rounded-[1.5rem] transition-all tracking-[0.2em] shadow-sm ${order.status === s ? 'bg-slate-900 text-white scale-[1.03] shadow-2xl' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600'}`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 px-6">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ClipboardList className="h-12 w-12 text-slate-200" strokeWidth={1} />
               </div>
               <p className="text-slate-800 font-bold text-2xl font-serif">No Active Orders</p>
               <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto font-medium">When customers place orders via the storefront, they will appear here in real-time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
};

export default AdminPortal;
