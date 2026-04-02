
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
    </nav>
  );
};

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-pink-50">
        <div className="glass-card p-12 rounded-[2.5rem] max-w-md w-full text-center">
          <h2 className="text-2xl font-serif text-pink-950 mb-4">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          <pre className="text-[10px] bg-red-50 p-4 rounded-xl text-red-600 overflow-auto mb-8 text-left max-h-32">
            {error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-pink-700 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-pink-800 transition-all"
          >
            Refresh Studio
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);

  useEffect(() => {
    const init = async () => {
      await seedPastries(PASTRIES);
    };
    init();
  }, []);

  return (
    <HashRouter>
      <ErrorBoundary>
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
      </ErrorBoundary>
    </HashRouter>
  );
};

export default App;
