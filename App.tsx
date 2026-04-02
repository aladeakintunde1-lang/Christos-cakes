
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Lock } from 'lucide-react';
import CustomerPortal from './components/CustomerPortal';
import AdminPortal from './components/AdminPortal';
import OrderForm from './components/OrderForm';
import OrderView from './components/OrderView';
import { UserRole } from './types';
import { syncWithSupabase, seedPastries } from './utils/storage';
import { PASTRIES } from './constants';

const Navigation = ({ role, setRole }: { role: UserRole, setRole: (r: UserRole) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isStoreActive = location.pathname === '/' || location.pathname === '/order';
  const isAdminActive = location.pathname === '/admin';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-t border-white/20 px-8 pt-4 pb-safe flex justify-around items-center z-50 transition-all duration-300 shadow-[0_-10px_40px_rgba(219,39,119,0.05)] md:top-0 md:bottom-auto md:border-t-0 md:border-b md:pb-4">
      <button 
        onClick={() => { setRole(UserRole.CUSTOMER); navigate('/'); }}
        className={`flex flex-col items-center gap-1.5 transition-all duration-300 group ${isStoreActive ? 'text-pink-600 scale-110' : 'text-slate-400 hover:text-pink-400'}`}
      >
        <div className={`p-2 rounded-2xl transition-all duration-500 ${isStoreActive ? 'bg-pink-100/50 shadow-inner' : 'bg-transparent group-hover:bg-pink-50/30'}`}>
          <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Boutique</span>
      </button>

      <button 
        onClick={() => { setRole(UserRole.ADMIN); navigate('/admin'); }}
        className={`flex flex-col items-center gap-1.5 transition-all duration-300 group ${isAdminActive ? 'text-pink-600 scale-110' : 'text-slate-400 hover:text-pink-400'}`}
      >
        <div className={`p-2 rounded-2xl transition-all duration-500 ${isAdminActive ? 'bg-pink-100/50 shadow-inner' : 'bg-transparent group-hover:bg-pink-50/30'}`}>
          <Lock className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Studio</span>
      </button>
    </nav>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);

  useEffect(() => {
    const init = async () => {
      await seedPastries(PASTRIES);
      await syncWithSupabase();
    };
    init();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col soft-pink-bg">
        <Navigation role={role} setRole={setRole} />
        <main className="flex-grow max-w-5xl mx-auto w-full px-4 pt-8 pb-24 md:pb-16 md:pt-32">
          <Routes>
            <Route path="/" element={<CustomerPortal />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/order/:orderId" element={<OrderView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
