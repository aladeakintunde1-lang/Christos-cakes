
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
  <div className={`absolute -z-10 blur-3xl opacity-20 animate-pulse ${className}`} />
);

const FloatingElement = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    className={`absolute -z-10 pointer-events-none ${className}`}
  >
    <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200/30 to-rose-100/30 blur-xl" />
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
    <div className="relative">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-pink-500 origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Decorative Background Elements */}
      <DecorativeBlob className="top-0 -left-20 w-64 h-64 bg-pink-300 rounded-full" />
      <DecorativeBlob className="top-40 -right-20 w-80 h-80 bg-rose-200 rounded-full" />
      <DecorativeBlob className="bottom-0 left-1/2 w-96 h-96 bg-pink-100 rounded-full" />

      {/* Floating Decorative Shapes */}
      <FloatingElement className="top-20 left-10 w-12 h-12" delay={0} />
      <FloatingElement className="top-60 right-20 w-16 h-16" delay={1} />
      <FloatingElement className="bottom-40 left-20 w-20 h-20" delay={2} />
      <FloatingElement className="bottom-80 right-10 w-14 h-14" delay={0.5} />

      <header className="text-center mb-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-8xl text-pink-900 font-serif font-bold mb-4 tracking-tight leading-none relative inline-block">
            Christos <span className="text-pink-600 italic">Cakes</span>
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute -top-4 -right-8 text-pink-400"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0l3.09 8.91L24 12l-8.91 3.09L12 24l-3.09-8.91L0 12l8.91-3.09L12 0z" />
              </svg>
            </motion.div>
          </h1>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-8 bg-pink-200" />
            <p className="text-slate-500 font-medium tracking-widest uppercase text-xs md:text-sm">
              Bespoke Luxury Artistry
            </p>
            <div className="h-px w-8 bg-pink-200" />
          </div>
        </motion.div>
      </header>

      <div className="flex justify-center mb-12">
        <motion.a 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-xl border border-pink-100 hover:border-pink-300 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-700 tracking-tight">@Christoscakes_events</span>
        </motion.a>
      </div>

      <div className="columns-2 md:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6 mb-24">
        {images.map((img, index) => (
          <motion.div 
            key={img.id} 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`break-inside-avoid relative group rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white/30 backdrop-blur-sm ${img.displayMode === 'square' ? 'aspect-square' : ''}`}
          >
            <img 
              src={img.url} 
              alt="Cake Inspiration" 
              className={`w-full h-full block transition-transform duration-700 group-hover:scale-110 ${img.displayMode === 'square' ? 'object-cover' : 'object-contain'}`}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        ))}
      </div>

      <div className="sticky bottom-24 md:bottom-12 flex justify-center w-full px-4 z-40">
        <motion.button 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/order')}
          className="bg-pink-600 text-white px-10 py-5 rounded-full text-xl font-bold shadow-[0_20px_50px_rgba(219,39,119,0.3)] hover:bg-pink-700 transition-all w-full md:w-auto flex items-center justify-center gap-4 border-4 border-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ORDER CAKE NOW
        </motion.button>
      </div>
      
      <footer className="mt-32 mb-16 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-pink-100" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 pt-12">Handcrafted with Love</p>
        <h2 className="text-2xl font-serif text-pink-800 mb-6">Christos Cakes</h2>
        <div className="flex justify-center gap-6">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600 transition-colors">
            <span className="sr-only">Instagram</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortal;
