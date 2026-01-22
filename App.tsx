
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CustomerPortal from './components/CustomerPortal';
import AdminPortal from './components/AdminPortal';
import OrderForm from './components/OrderForm';
import { UserRole } from './types';

const Navigation = ({ role, setRole }: { role: UserRole, setRole: (r: UserRole) => void }) => {
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto">
      <button 
        onClick={() => { setRole(UserRole.CUSTOMER); navigate('/'); }}
        className={`flex flex-col items-center gap-1 ${role === UserRole.CUSTOMER ? 'text-pink-600' : 'text-slate-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="text-[10px] uppercase font-bold tracking-widest">Store</span>
      </button>
      <button 
        onClick={() => { navigate('/admin'); }}
        className={`flex flex-col items-center gap-1 ${window.location.hash.includes('admin') ? 'text-pink-600' : 'text-slate-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span className="text-[10px] uppercase font-bold tracking-widest">Admin</span>
      </button>
    </nav>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);

  return (
    <HashRouter>
      <div className="min-h-screen pb-20 md:pb-0 md:pt-20">
        <Navigation role={role} setRole={setRole} />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<CustomerPortal />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/admin" element={<AdminPortal />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
