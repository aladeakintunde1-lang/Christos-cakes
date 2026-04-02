
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
  LogOut,
  User
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
  getSettings,
  saveSettings,
  wipeDummyData
} from '../utils/storage';
import { supabase } from '../utils/supabase';
import { Order, OrderStatus, GalleryImage, ImageDisplayMode } from '../types';
import { LOGO_URL } from '../constants';

const N8N_WEBHOOK_URL_ENV = import.meta.env.VITE_N8N_WEBHOOK_URL;

const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [viewMode, setViewMode] = useState<'Orders' | 'Gallery' | 'Insights' | 'Settings'>('Orders');
  const [instaImportUrl, setInstaImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [displayMode, setDisplayMode] = useState<ImageDisplayMode>('original');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(LOGO_URL);
  const [adminWhatsAppNumber, setAdminWhatsAppNumber] = useState<string>('');
  const [localWebhookUrl, setLocalWebhookUrl] = useState<string>(localStorage.getItem('sweettrack_webhook_url') || '');
  const [isWiping, setIsWiping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const activeWebhookUrl = N8N_WEBHOOK_URL_ENV || localWebhookUrl;

  useEffect(() => {
    const checkAuth = async () => {
      // Safety timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      const settings = getSettings();
      if (settings?.logoUrl) setCustomLogoUrl(settings.logoUrl);
      if (settings?.adminWhatsAppNumber) setAdminWhatsAppNumber(settings.adminWhatsAppNumber);
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
    try {
      await syncWithSupabase();
      const rawOrders = getOrders();
      if (Array.isArray(rawOrders)) {
        setOrders([...rawOrders].sort((a, b) => {
          const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
          const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
          return dateA - dateB;
        }));
      }
      
      const rawGallery = getGalleryImages();
      if (Array.isArray(rawGallery)) {
        setGalleryImages(rawGallery);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });
    if (error) {
      alert(error.message);
    } else {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
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
        saveSettings({ logoUrl: url });
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

  const handleWipeData = async () => {
    const confirmation = prompt('Type CONFIRM to permanently wipe all demo data from your studio:');
    if (confirmation === 'CONFIRM') {
      setIsWiping(true);
      const result = await wipeDummyData();
      setIsWiping(false);
      if (result.success) {
        setLastAction('Demo data wiped successfully');
        setTimeout(() => setLastAction(null), 3000);
        refreshData();
      } else {
        alert('Failed to wipe demo data. Check console for details.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

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
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input 
                    type="email" 
                    placeholder="admin@christoscakes.co.uk"
                    className="w-full p-5 pl-14 bg-white/40 rounded-2xl border border-white/60 focus:border-pink-300 focus:bg-white outline-none transition-all text-sm font-medium"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full p-5 pl-14 bg-white/40 rounded-2xl border border-white/60 focus:border-pink-300 focus:bg-white outline-none transition-all text-sm font-medium"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-pink-700 text-white p-5 rounded-2xl font-bold text-xs tracking-[0.3em] hover:bg-pink-800 transition-all shadow-[0_15px_40px_rgba(190,24,93,0.2)] active:scale-[0.98] uppercase mt-4"
              >
                Enter Studio
              </button>
            </form>
            <p className="mt-8 text-[9px] text-pink-200 uppercase tracking-[0.4em] font-bold">Secure Admin Portal</p>
          </div>
        </div>
      </div>
    );
  }

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice || 0, 0);

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
        <div className="flex justify-between items-center w-full xl:w-auto">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 font-serif">Admin Management</h1>
            <p className="text-sm text-slate-500 font-medium">Control center for Christos Cakes</p>
          </div>
          <button 
            onClick={handleLogout}
            className="xl:hidden p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 w-full xl:w-auto">
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
          <button 
            onClick={handleLogout}
            className="hidden xl:flex items-center gap-2 px-6 py-3.5 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut className="h-4 w-4" />
            Logout
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
            <p className="text-5xl font-bold text-slate-900 font-serif">£{revenue.toFixed(2)}</p>
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
        <div className="animate-slideIn max-w-2xl mx-auto">
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 font-serif mb-2">Brand Identity</h2>
            <p className="text-sm text-slate-400 mb-10 font-medium">Manage your brand assets used across the application and orders.</p>
            
            <div className="space-y-10">
              <div className="flex flex-col items-center p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Current Order Logo</p>
                <div className="w-48 h-48 bg-white rounded-[2rem] shadow-inner border border-slate-200 flex items-center justify-center overflow-hidden mb-8 p-4">
                  <img src={customLogoUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                </div>
                
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
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
                      className="px-6 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all border border-slate-200"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">Automation (n8n)</h3>
                </div>
                
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Admin WhatsApp Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +447123456789"
                        className="w-full p-5 bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                        value={adminWhatsAppNumber}
                        onChange={e => setAdminWhatsAppNumber(e.target.value)}
                        onBlur={() => {
                          saveSettings({ adminWhatsAppNumber });
                          setLastAction('WhatsApp number saved');
                          setTimeout(() => setLastAction(null), 3000);
                        }}
                      />
                      <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Used for daily order notifications at 8:00 AM</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Webhook URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="https://your-n8n-instance.com/webhook/..."
                        className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                        value={localWebhookUrl}
                        onChange={e => {
                          setLocalWebhookUrl(e.target.value);
                          localStorage.setItem('sweettrack_webhook_url', e.target.value);
                        }}
                      />
                    </div>
                    {N8N_WEBHOOK_URL_ENV && (
                      <p className="mt-3 text-[9px] text-green-600 font-bold uppercase tracking-widest">✓ Environment Variable Configured</p>
                    )}
                    {!activeWebhookUrl && (
                      <p className="mt-3 text-[9px] text-rose-500 font-bold uppercase tracking-widest animate-pulse">⚠ Webhook URL Missing</p>
                    )}
                  </div>
                  
                  <div className="p-6 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This URL connects your studio to n8n for automated order notifications and client emails. 
                      You can find the workflow template in <code className="bg-slate-100 px-1 rounded text-pink-600">n8n/workflow.json</code> in the project root.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-bold text-rose-900 font-serif">Data Management</h3>
                </div>
                <p className="text-xs text-rose-700/70 mb-8 leading-relaxed">
                  Permanently remove all sample data (orders, gallery photos, pastries) to prepare your studio for real customers. This action cannot be undone.
                </p>
                <button 
                  onClick={handleWipeData}
                  disabled={isWiping}
                  className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isWiping ? 'WIPING DATA...' : 'WIPE DEMO DATA'}
                </button>
              </div>

              <div className="p-8 bg-pink-50 rounded-3xl border border-pink-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <Info className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-pink-900 mb-1">Logo Specifications</h4>
                    <p className="text-[11px] text-pink-700/70 leading-relaxed">For the best results on your luxury orders, use a high-resolution PNG or JPG with a transparent or white background. Square or circular logos work best.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'Orders' && (
        <div className="space-y-8 animate-slideIn">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className={`h-3 w-full ${order.fulfillmentType === 'Delivery' ? 'bg-pink-600' : 'bg-indigo-600'}`} />
              <div className="p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-10">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full tracking-widest ${order.fulfillmentType === 'Delivery' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
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
                      <p className="font-bold text-4xl text-slate-900 font-serif mb-2">£{order.totalPrice.toFixed(2)}</p>
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
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Size</span>
                        <p className="text-lg font-bold text-slate-800">{order.size}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Flavors & Fillings</span>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.flavor || 'Not specified'}</p>
                      </div>
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
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Logistics</p>
                    <p className="text-xl font-bold text-slate-800">{order.postcode || 'Customer Collection'}</p>
                    <p className="text-sm text-slate-500 truncate mt-4">{order.address || '7 Singh Street, Wellington Studio'}</p>
                    {order.distance !== undefined && (
                      <div className="mt-4 pt-4 border-t border-slate-200/50">
                        <span className="text-[9px] font-black text-pink-600 uppercase tracking-widest block mb-1">Estimated Mileage</span>
                        <p className="text-lg font-black text-slate-900">{order.distance.toFixed(1)} miles</p>
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
                          if (activeWebhookUrl) {
                            try {
                              // Remove large image data before sending to webhook
                              const { inspirationImage, ...orderData } = order;
                              
                              await fetch(activeWebhookUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  ...orderData, 
                                  type: 'SEND_ORDER', 
                                  appUrl: window.location.origin 
                                })
                              });
                              setLastAction('Order email triggered');
                              setTimeout(() => setLastAction(null), 3000);
                            } catch (err) {
                              console.error(err);
                              alert('Failed to trigger email. Check your Webhook URL.');
                            }
                          } else {
                            setViewMode('Settings');
                            alert('Automation Webhook not configured. Please set it in Settings.');
                          }
                        }}
                        className="w-full bg-pink-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:bg-slate-300"
                      >
                        Send Order to Client
                      </button>
                    </div>
                  </div>
                </div>

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
