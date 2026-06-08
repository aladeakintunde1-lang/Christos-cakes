
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll } from 'motion/react';
import { Instagram, Plus, Search, Loader2, Sparkles, ChevronRight, Clock, MapPin } from 'lucide-react';
import { getGalleryImages, getOrders, syncWithSupabase } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { GalleryImage, Order } from '../types';
import { INSTAGRAM_URL } from '../constants';

const DEFAULT_IMAGES: Partial<GalleryImage>[] = [
  { id: 'd1', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd2', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd3', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=800&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd4', url: 'https://images.unsplash.com/photo-1557925923-33b27f891f88?q=80&w=800&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd5', url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=800&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd6', url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=800&auto=format&fit=crop', displayMode: 'original' },
];

const DecorativeBlob = ({ className }: { className?: string }) => (
  <div className={`absolute -z-10 blur-[120px] animate-pulse-soft ${className}`} />
);

const FloatingElement = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <motion.div
    initial={{ y: 0, rotate: 0 }}
    animate={{ y: [-20, 20, -20], rotate: [0, 5, 0] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}
    className={`absolute -z-10 pointer-events-none ${className}`}
  >
    <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200/20 to-rose-100/20 blur-2xl" />
  </motion.div>
);

const CustomerPortal: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<Partial<GalleryImage>[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const loadAndSync = async () => {
      const stored = getGalleryImages();
      if (stored.length > 0) {
        setImages(stored);
      } else {
        setImages(DEFAULT_IMAGES);
      }

      // Initial load of local orders
      const initialOrders = getOrders();
      setLocalOrders(initialOrders);

      // Trigger sync with Supabase and update state with latest
      try {
        const synced = await syncWithSupabase();
        if (synced) {
          setLocalOrders(synced);
          
          // Load customer reflections
          const withFeedback = synced
            .filter((o) => o.feedbackRating && o.feedbackRating >= 4 && o.feedbackComment)
            .sort((a, b) => new Date(b.feedbackCreatedAt || '').getTime() - new Date(a.feedbackCreatedAt || '').getTime())
            .slice(0, 3);
          setFeedbacks(withFeedback);
        }
      } catch (err) {
        console.error('Error in portal load and sync:', err);
      }
    };
    
    loadAndSync();
  }, []);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchOrderId.trim().toLowerCase();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');

    // Remove ORD- or key prefix for flexible searching
    const cleanId = query.replace(/^ord-/i, '');

    // 1. Try local match (full or prefix/partial)
    const localMatch = localOrders.find(
      o => o.id.toLowerCase() === cleanId || o.id.toLowerCase().startsWith(cleanId) || o.id.toLowerCase().slice(0, 8) === cleanId
    );

    if (localMatch) {
      navigate(`/order/${localMatch.id}`);
      setIsSearching(false);
      return;
    }

    // 2. Try Supabase lookup
    try {
      // First, try a direct exact match on ID
      let { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('id', cleanId)
        .maybeSingle();

      if (!data) {
        // If not found, fetch all IDs to do a robust prefix match (since IDs are UUIDs and customers use a truncated version)
        const { data: allIds } = await supabase.from('orders').select('id');
        if (allIds) {
          const matched = allIds.find(
            o => o.id.toLowerCase().startsWith(cleanId) || o.id.toLowerCase().includes(cleanId)
          );
          if (matched) {
            data = matched;
          }
        }
      }

      if (data) {
        navigate(`/order/${data.id}`);
      } else {
        setSearchError('We could not find a commission with that ID. Please verify the ID or contact us.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setSearchError('A Connection error occurred. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative animate-fadeIn pt-12 pb-24">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-300 via-pink-600 to-pink-300 origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Decorative Background Elements */}
      <DecorativeBlob className="top-0 -left-20 w-[40rem] h-[40rem] bg-pink-200/20 rounded-full" />
      <DecorativeBlob className="top-1/4 -right-40 w-[50rem] h-[50rem] bg-rose-100/20 rounded-full" />
      <DecorativeBlob className="bottom-0 left-1/4 w-[60rem] h-[60rem] bg-pink-50/30 rounded-full" />

      {/* Floating Decorative Shapes */}
      <FloatingElement className="top-40 left-10 w-24 h-24" delay={0} />
      <FloatingElement className="top-[40%] right-20 w-32 h-32" delay={2} />
      <FloatingElement className="bottom-60 left-[15%] w-40 h-40" delay={4} />

      {/* Main Stacked Card Container */}
      <div className="relative max-w-4xl mx-auto">
        {/* Visual "Stack" Layers */}
        <div className="absolute -inset-4 bg-white/20 rounded-[4rem] -z-10 blur-xl" />
        <div className="absolute inset-2 bg-pink-100/10 rounded-[3.5rem] -z-10 translate-y-4" />
        
        <div className="glass-card rounded-[3.5rem] overflow-hidden border-white/60 shadow-[0_40px_100px_rgba(219,39,119,0.08)]">
          <div className="p-8 md:p-16">
            <header className="text-center mb-24 relative">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-6xl md:text-[8rem] text-pink-950 font-serif font-light mb-8 tracking-tighter leading-[0.85] relative inline-block">
                  Christos <br className="md:hidden" />
                  <span className="text-pink-600 italic font-light">Cakes</span>
                </h1>

                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="h-[1px] w-12 bg-pink-100" />
                  <p className="text-slate-400 font-medium tracking-[0.4em] uppercase text-[9px] md:text-[10px] leading-relaxed">
                    Bespoke Luxury Cake Artistry
                  </p>
                  <div className="h-[1px] w-12 bg-pink-100" />
                </div>
              </motion.div>
            </header>

            <div className="flex justify-center mb-24">
              <motion.a 
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/40 backdrop-blur-md inline-flex items-center gap-4 px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(219,39,119,0.05)] hover:shadow-[0_20px_40px_rgba(219,39,119,0.1)] transition-all group border border-white/60"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-md group-hover:rotate-[360deg] transition-transform duration-1000">
                  <Instagram className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none mb-1.5">Follow our journey</span>
                  <span className="text-sm font-medium text-slate-800 tracking-tight font-serif">@Christoscakes_events</span>
                </div>
              </motion.a>
            </div>

            <div className="columns-2 md:columns-3 gap-6 md:gap-8 space-y-6 md:space-y-8 mb-24">
              {images.map((img, index) => (
                <motion.div 
                  key={img.id} 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`break-inside-avoid relative group rounded-[2rem] overflow-hidden shadow-[0_15px_60px_rgba(0,0,0,0.03)] border border-white/60 bg-white/20 backdrop-blur-sm ${img.displayMode === 'square' ? 'aspect-square' : ''}`}
                >
                  <div className="overflow-hidden w-full h-full">
                    <img 
                      src={img.url} 
                      alt="Cake Inspiration" 
                      className={`w-full h-full block transition-transform duration-[1500ms] ease-out group-hover:scale-110 ${img.displayMode === 'square' ? 'object-cover' : 'object-contain'}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-950/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <motion.button 
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/order')}
                className="relative bg-gradient-to-r from-pink-950 to-rose-950 hover:from-pink-900 hover:to-rose-900 text-white px-16 py-7 rounded-full text-sm font-medium tracking-[0.3em] shadow-[0_25px_60px_rgba(28,25,23,0.15)] hover:shadow-[0_35px_80px_rgba(190,24,93,0.25)] transition-all w-full md:w-auto flex items-center justify-center gap-8 border border-white/10 group overflow-hidden"
              >
                {/* Subtle gold shimmering light reflection */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-120%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
                
                <span className="font-serif uppercase lg:text-base tracking-[0.25em]">Begin Bespoke Commission</span>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-180 transition-transform duration-1000 border border-white/20">
                  <Plus className="h-5 w-5 text-pink-200" strokeWidth={1} />
                </div>
              </motion.button>
            </div>

            {/* Tracking & Active Commissions Section */}
            <div className="mt-28 pt-16 border-t border-pink-100/30 text-center">
              <div className="max-w-xl mx-auto space-y-8">
                <div className="space-y-3">
                  <p className="small-caps text-[9px] text-pink-400 tracking-[0.4em] uppercase font-bold">Trace Archivals</p>
                  <h3 className="text-3xl font-serif text-pink-950 font-light tracking-tight text-center">Commission Tracking</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-light leading-relaxed text-center">
                    Check the preparation status of your custom artisanal creations.
                  </p>
                </div>

                {/* Track Search Bar */}
                <form onSubmit={handleTrackOrder} className="relative mt-6 max-w-md mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter Order ID (e.g. 8f2b... or full ID)"
                      value={searchOrderId}
                      onChange={(e) => {
                        setSearchOrderId(e.target.value);
                        setSearchError('');
                      }}
                      className="w-full pl-6 pr-14 py-4 bg-white/40 backdrop-blur-md rounded-full border border-pink-100 text-xs md:text-sm text-pink-950 placeholder-slate-400 outline-none focus:border-pink-500 focus:bg-white/60 transition-all font-mono tracking-wider shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pink-700 hover:bg-pink-800 text-white flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {searchError && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-rose-500 mt-3 font-medium text-left px-4"
                    >
                      {searchError}
                    </motion.p>
                  )}
                </form>

                {/* Local Commissions List if present */}
                {localOrders.length > 0 && (
                  <div className="pt-8 text-left space-y-4 max-w-lg mx-auto">
                    <p className="text-[9px] font-mono font-bold text-pink-400 uppercase tracking-widest text-center">Your Recent Commissions</p>
                    <div className="space-y-3">
                      {localOrders.slice(0, 5).map((order) => {
                        const isCompleted = order.status === 'Completed';
                        const isReady = order.status === 'Ready';
                        const isBaking = order.status === 'Baking';
                        
                        return (
                          <div
                            key={order.id}
                            onClick={() => navigate(`/order/${order.id}`)}
                            className="bg-white/40 hover:bg-white/70 backdrop-blur-sm border border-white/80 p-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:translate-x-1 shadow-sm hover:shadow-md group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-700 font-serif font-semibold border border-pink-100/50 group-hover:scale-105 transition-transform shrink-0">
                                {order.category === 'Pastries' ? '🥐' : '🎂'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-800">
                                    ORD-{order.id.slice(0, 4).toUpperCase()}
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-400">
                                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-serif font-light truncate">
                                  {order.category} Commission for {order.customerName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                isReady ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                isBaking ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {order.status}
                              </span>
                              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Patron Reflections Section */}
            {feedbacks.length > 0 && (
              <div className="mt-32 pt-20 border-t border-pink-100/30">
                <div className="text-center mb-16 space-y-4">
                  <p className="small-caps text-[9px] text-pink-400 tracking-[0.4em] uppercase font-bold">Patron Journeys</p>
                  <h3 className="text-4xl font-serif text-pink-950 font-light tracking-tight">Voices of the Atelier</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-light leading-relaxed">
                    Honest impressions from commissions delivered across our clientele.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                  {feedbacks.map((fb, idx) => (
                    <motion.div
                      key={fb.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="bg-white/40 backdrop-blur-sm p-8 border border-white/50 shadow-sm relative group hover:bg-white/60 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <svg 
                              key={s} 
                              className={`h-3.5 w-3.5 ${s <= fb.feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold tracking-tighter uppercase whitespace-nowrap">ORD-{fb.id.slice(0,4).toUpperCase()}</span>
                      </div>
                      
                      <p className="text-xs text-slate-600 font-serif italic leading-relaxed mb-6">
                        "{fb.feedbackComment || 'No comment shared'}"
                      </p>
                      
                      <div className="flex items-center gap-3 border-t border-pink-100/20 pt-4 mt-auto">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-pink-950 uppercase tracking-widest truncate">{fb.customerName}</p>
                          <p className="text-[9px] font-medium text-slate-400 font-mono tracking-tight">{fb.category} Design</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="mt-48 text-center relative px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-pink-300 mb-8 pt-16">Handcrafted with Love</p>
        <h2 className="text-4xl font-serif text-pink-950 mb-8 font-light tracking-tighter">Christos Cakes</h2>
        <div className="flex justify-center gap-10">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-pink-600 transition-all hover:scale-110 duration-500">
            <span className="sr-only">Instagram</span>
            <Instagram className="h-6 w-6" />
          </a>
        </div>
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-16">© 2024 Christos Cakes. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default CustomerPortal;
