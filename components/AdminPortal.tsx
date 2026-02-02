
import React, { useState, useEffect, useRef } from 'react';
import { 
  getOrders, 
  updateOrderStatus, 
  deleteOrder, 
  getGalleryImages, 
  addGalleryImage, 
  deleteGalleryImage 
} from '../utils/storage';
import { Order, OrderStatus, GalleryImage, ImageDisplayMode } from '../types';
import { ADMIN_PASSWORD } from '../constants';

const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [viewMode, setViewMode] = useState<'Orders' | 'Gallery' | 'Insights'>('Orders');
  const [instaImportUrl, setInstaImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [displayMode, setDisplayMode] = useState<ImageDisplayMode>('original');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
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

  const refreshData = () => {
    setOrders(getOrders().sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()));
    setGalleryImages(getGalleryImages());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password');
    }
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    refreshData();
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Permanently delete this order record?')) {
      deleteOrder(orderId);
      refreshData();
    }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImg: GalleryImage = {
          id: 'img_' + Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          displayMode: displayMode,
          createdAt: new Date().toISOString()
        };
        addGalleryImage(newImg);
        refreshData();
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
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-slate-800 font-serif">Admin Portal</h2>
          <p className="text-slate-400 text-sm mb-8">Secure access to Christos Cakes management</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Access Key"
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-200 focus:bg-white outline-none transition-all text-center font-bold tracking-widest"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]">
              LOG IN
            </button>
          </form>
          <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-black">Default: cake</p>
        </div>
      </div>
    );
  }

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="animate-fadeIn pb-24 max-w-6xl mx-auto px-4">
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
        </div>
      </header>

      {viewMode === 'Insights' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-green-600 font-black text-xl">£</span>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase mb-2 tracking-widest">Total Revenue</h3>
            <p className="text-5xl font-bold text-slate-900 font-serif">£{revenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase mb-2 tracking-widest">Active Orders</h3>
            <p className="text-5xl font-bold text-slate-900 font-serif">{orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length}</p>
          </div>
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Permanent
                      </button>
                    </div>
                  </div>
                ))}

                {galleryImages.length === 0 && (
                  <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center px-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
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
                    <p className="font-bold text-4xl text-slate-900 font-serif mb-2">£{order.totalPrice.toFixed(2)}</p>
                    <button 
                      onClick={() => handleCancelOrder(order.id)} 
                      className="text-[10px] font-black text-red-300 hover:text-red-600 uppercase tracking-[0.3em] transition-all"
                    >
                      Delete Order
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white transition-colors flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Specifications</p>
                    <p className="text-xl font-bold text-slate-800">{order.size} {order.flavor}</p>
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
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Instagram Design
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Logistics</p>
                    <p className="text-xl font-bold text-slate-800">{order.postcode || 'Customer Collection'}</p>
                    <p className="text-sm text-slate-500 truncate mt-4">{order.address || '7 Singh Street, Wellington Studio'}</p>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
               </div>
               <p className="text-slate-800 font-bold text-2xl font-serif">No Active Orders</p>
               <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto font-medium">When customers place orders via the storefront, they will appear here in real-time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
