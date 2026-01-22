
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_INSTA = [
  { id: 1, url: 'https://picsum.photos/seed/cake1/600/600' },
  { id: 2, url: 'https://picsum.photos/seed/cake2/600/600' },
  { id: 3, url: 'https://picsum.photos/seed/cake3/600/600' },
  { id: 4, url: 'https://picsum.photos/seed/cake4/600/600' },
  { id: 5, url: 'https://picsum.photos/seed/cake5/600/600' },
  { id: 6, url: 'https://picsum.photos/seed/cake6/600/600' },
];

const CustomerPortal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fadeIn">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl text-pink-800 font-bold mb-2">Christos Cakes</h1>
        <p className="text-slate-500 italic">Bespoke luxury cakes for every occasion</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-12">
        {MOCK_INSTA.map((img) => (
          <div key={img.id} className="aspect-square bg-slate-200 overflow-hidden relative group">
            <img 
              src={img.url} 
              alt="Cake Inspiration" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-24 md:bottom-8 flex justify-center w-full px-4">
        <button 
          onClick={() => navigate('/order')}
          className="bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl hover:bg-pink-700 active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ORDER CAKE INSPO
        </button>
      </div>
      
      <section className="mt-20 text-center text-slate-400">
        <p className="text-sm">Follow us on Instagram @Christoscakes_events</p>
      </section>
    </div>
  );
};

export default CustomerPortal;
