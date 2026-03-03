
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import CustomerPortal from './components/CustomerPortal';
import AdminPortal from './components/AdminPortal';
import OrderForm from './components/OrderForm';
import InvoiceView from './components/InvoiceView';
import { UserRole } from './types';
import { syncWithSupabase } from './utils/storage';

const Navigation = ({ role, setRole }: { role: UserRole, setRole: (r: UserRole) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdminActive = location.pathname.includes('admin');
  const isStoreActive = location.pathname === '/' || location.pathname === '/order';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-t border-white/20 px-8 pt-4 pb-safe flex justify-around items-center z-50 transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] md:top-6 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:w-fit md:rounded-full md:border md:px-12 md:py-3">
      <button 
        onClick={() => { setRole(UserRole.CUSTOMER); navigate('/'); }}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isStoreActive ? 'text-pink-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${isStoreActive ? 'bg-pink-100/50 shadow-inner' : 'bg-transparent'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <span className={`text-[9px] uppercase font-black tracking-[0.2em] transition-opacity ${isStoreActive ? 'opacity-100' : 'opacity-0'}`}>Store</span>
      </button>
      <div className="w-px h-8 bg-slate-100 hidden md:block mx-4" />
      <button 
        onClick={() => { navigate('/admin'); }}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isAdminActive ? 'text-pink-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${isAdminActive ? 'bg-pink-100/50 shadow-inner' : 'bg-transparent'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <span className={`text-[9px] uppercase font-black tracking-[0.2em] transition-opacity ${isAdminActive ? 'opacity-100' : 'opacity-0'}`}>Admin</span>
      </button>
    </nav>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);

  useEffect(() => {
    syncWithSupabase();
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[#faf9f6]">
        <Navigation role={role} setRole={setRole} />
        <main className="flex-grow max-w-4xl mx-auto w-full px-4 pt-6 pb-24 md:pb-12 md:pt-28 relative">
          {/* Global decorative background */}
          <div className="fixed inset-0 pointer-events-none -z-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,207,232,0.1),transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(251,207,232,0.1),transparent_50%)]" />
          </div>
          <Routes>
            <Route path="/" element={<CustomerPortal />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/invoice/:orderId" element={<InvoiceView />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
