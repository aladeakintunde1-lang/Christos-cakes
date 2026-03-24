
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll } from 'motion/react';
import { Instagram, Plus } from 'lucide-react';
import { getGalleryImages } from '../utils/storage';
import { GalleryImage } from '../types';
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
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const stored = getGalleryImages();
    if (stored.length > 0) {
      setImages(stored);
    } else {
      setImages(DEFAULT_IMAGES);
    }
  }, []);

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
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/order')}
                className="bg-pink-700 text-white px-12 py-6 rounded-full text-lg font-light shadow-[0_20px_50px_rgba(190,24,93,0.2)] hover:bg-pink-800 transition-all w-full md:w-auto flex items-center justify-center gap-6 border-4 border-white/80 group backdrop-blur-sm"
              >
                <span className="tracking-[0.2em] font-serif uppercase">ORDER</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-180 transition-transform duration-700 border border-white/20">
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </motion.button>
            </div>
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
