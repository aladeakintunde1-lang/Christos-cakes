
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGalleryImages } from '../utils/storage';
import { GalleryImage } from '../types';
import { INSTAGRAM_URL } from '../constants';

const DEFAULT_IMAGES: Partial<GalleryImage>[] = [
  { id: 'd1', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd2', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd3', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=600&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd4', url: 'https://images.unsplash.com/photo-1557925923-33b27f891f88?q=80&w=600&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd5', url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=600&auto=format&fit=crop', displayMode: 'original' },
  { id: 'd6', url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=600&auto=format&fit=crop', displayMode: 'original' },
];

const CustomerPortal: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<Partial<GalleryImage>[]>([]);

  useEffect(() => {
    const stored = getGalleryImages();
    if (stored.length > 0) {
      setImages(stored);
    } else {
      setImages(DEFAULT_IMAGES);
    }
  }, []);

  return (
    <div className="animate-fadeIn">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl text-pink-800 font-bold mb-2">Christos Cakes</h1>
        <p className="text-slate-500 italic">Bespoke luxury cakes for every occasion</p>
      </header>

      <div className="flex justify-center mb-8">
        <a 
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md border border-slate-100 hover:border-pink-200 transition-all hover:-translate-y-0.5 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/>
          </svg>
          <span className="text-sm font-bold text-slate-700">@Christoscakes_events</span>
        </a>
      </div>

      <div className="columns-2 md:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4 mb-16">
        {images.map((img) => (
          <div 
            key={img.id} 
            className={`break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-white ${img.displayMode === 'square' ? 'aspect-square' : ''}`}
          >
            <img 
              src={img.url} 
              alt="Cake Inspiration" 
              className={`w-full h-full block transition-transform duration-500 group-hover:scale-[1.02] ${img.displayMode === 'square' ? 'object-cover' : 'object-contain'}`}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop';
              }}
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-24 md:bottom-8 flex justify-center w-full px-4">
        <button 
          onClick={() => navigate('/order')}
          className="bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl hover:bg-pink-700 active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-3 border-4 border-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ORDER CAKE NOW
        </button>
      </div>
      
      <footer className="mt-20 mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-1">Follow us on Instagram</p>
        <a 
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-pink-600 hover:underline"
        >
          @Christoscakes_events
        </a>
      </footer>
    </div>
  );
};

export default CustomerPortal;
