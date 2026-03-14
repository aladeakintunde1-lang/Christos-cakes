
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll } from 'motion/react';
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
    <div className="relative animate-fadeIn pt-12">
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

      <header className="text-center mb-32 relative px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex flex-col items-center mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-pink-400 block mb-4">Established 2024</span>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
          </div>
          
          <h1 className="text-7xl md:text-[11rem] text-pink-950 font-serif font-light mb-10 tracking-tighter leading-[0.8] relative inline-block">
            Christos <br className="md:hidden" />
            <span className="text-pink-600 italic font-light">Cakes</span>
            <motion.div
              animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.9, 1.2, 0.9], rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-12 -right-16 text-pink-200 pointer-events-none hidden md:block"
            >
              <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0l3.09 8.91L24 12l-8.91 3.09L12 24l-3.09-8.91L0 12l8.91-3.09L12 0z" />
              </svg>
            </motion.div>
          </h1>

          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="h-[1px] w-16 bg-pink-100" />
            <p className="text-slate-400 font-medium tracking-[0.4em] uppercase text-[9px] md:text-xs max-w-xs md:max-w-none leading-relaxed">
              Bespoke Luxury Cake Artistry & Design
            </p>
            <div className="h-[1px] w-16 bg-pink-100" />
          </div>
        </motion.div>
      </header>

      <div className="flex justify-center mb-32 px-4">
        <motion.a 
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card inline-flex items-center gap-6 px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(219,39,119,0.08)] hover:shadow-[0_30px_60px_rgba(219,39,119,0.15)] transition-all group border-white/60"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-lg group-hover:rotate-[360deg] transition-transform duration-1000">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">Follow our journey</span>
            <span className="text-base font-medium text-slate-800 tracking-tight font-serif">@Christoscakes_events</span>
          </div>
        </motion.a>
      </div>

      <div className="columns-2 md:columns-3 gap-8 md:gap-12 space-y-8 md:space-y-12 mb-48 px-4 md:px-8">
        {images.map((img, index) => (
          <motion.div 
            key={img.id} 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`break-inside-avoid relative group rounded-[2.5rem] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.04)] border border-white/80 bg-white/40 backdrop-blur-md ${img.displayMode === 'square' ? 'aspect-square' : ''}`}
          >
            <div className="overflow-hidden w-full h-full">
              <img 
                src={img.url} 
                alt="Cake Inspiration" 
                className={`w-full h-full block transition-transform duration-[2000ms] ease-out group-hover:scale-110 ${img.displayMode === 'square' ? 'object-cover' : 'object-contain'}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-pink-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="absolute bottom-8 left-8 right-8 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[0.16, 1, 0.3, 1]">
              <div className="glass-card px-6 py-3 rounded-full text-[10px] font-bold text-pink-950 uppercase tracking-[0.3em] inline-block border-white/80 shadow-xl">
                View Design
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sticky bottom-24 md:bottom-16 flex justify-center w-full px-6 z-40">
        <motion.button 
          whileHover={{ scale: 1.02, y: -10 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/order')}
          className="bg-pink-700 text-white px-16 py-7 rounded-full text-xl font-light shadow-[0_30px_70px_rgba(190,24,93,0.3)] hover:bg-pink-800 transition-all w-full md:w-auto flex items-center justify-center gap-8 border-[6px] border-white/90 group backdrop-blur-sm"
        >
          <span className="tracking-[0.25em] font-serif">COMMISSION A CAKE</span>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-180 transition-transform duration-700 border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </motion.button>
      </div>
      
      <footer className="mt-60 mb-32 text-center relative px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-pink-300 mb-10 pt-24">Handcrafted with Love & Precision</p>
        <h2 className="text-5xl font-serif text-pink-950 mb-12 font-light tracking-tighter">Christos Cakes</h2>
        <div className="flex justify-center gap-12">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-pink-600 transition-all hover:scale-125 duration-500">
            <span className="sr-only">Instagram</span>
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/></svg>
          </a>
        </div>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em] mt-20">© 2024 Christos Cakes. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default CustomerPortal;
