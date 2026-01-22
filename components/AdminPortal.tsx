
import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, deleteOrder } from '../utils/storage';
import { Order, OrderStatus } from '../types';
import { ADMIN_PASSWORD } from '../constants';

const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'List' | 'Summary'>('List');

  useEffect(() => {
    if (isAuthenticated) {
      setOrders(getOrders().sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()));
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password');
    }
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    setOrders(getOrders());
  };

  const handleCancel = (orderId: string) => {
    if (confirm('Delete this order?')) {
      deleteOrder(orderId);
      setOrders(getOrders());
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 font-serif">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Enter Access Key"
              className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none mb-4"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors">
              ACCESS PORTAL
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">Password is "cake" for demo</p>
        </div>
      </div>
    );
  }

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 font-serif">Master Tracker</h1>
          <p className="text-slate-500">{orders.length} active orders found</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('List')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'List' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setViewMode('Summary')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'Summary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Insights
          </button>
        </div>
      </header>

      {viewMode === 'Summary' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-green-600 font-serif">£{revenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Pending Baking</h3>
            <p className="text-4xl font-bold text-pink-600 font-serif">{orders.filter(o => o.status === 'Baking' || o.status === 'Pending').length}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Collections</h3>
            <p className="text-4xl font-bold text-blue-600 font-serif">{orders.filter(o => o.fulfillmentType === 'Collection').length}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`h-2 w-full ${order.fulfillmentType === 'Delivery' ? 'bg-red-500' : 'bg-green-500'}`} />
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${order.fulfillmentType === 'Delivery' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {order.fulfillmentType}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{order.customerName}</h3>
                    <p className="text-sm text-slate-500 font-medium">{order.deliveryDate} • {order.deliveryTimeSlot}</p>
                    <p className="text-xs text-slate-400">{order.phone}</p>
                  </div>
                  
                  {order.inspirationImage && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={order.inspirationImage} alt="Inspo" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="text-right">
                    <p className="font-bold text-xl text-slate-900 font-serif">£{order.totalPrice.toFixed(2)}</p>
                    <button 
                      onClick={() => handleCancel(order.id)}
                      className="text-xs text-red-400 hover:text-red-600 underline mt-1"
                    >
                      Delete Order
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cake Details</p>
                    <p className="text-sm font-bold text-slate-800 mb-1">{order.size} {order.flavor}</p>
                    <p className="text-xs text-slate-600 italic">"{order.messageOnCake || 'No message'}"</p>
                    
                    {order.inspirationLink && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                         <a 
                          href={order.inspirationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-pink-600 flex items-center gap-1 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/>
                          </svg>
                          SEE INSTAGRAM REFERENCE
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Logistics</p>
                    <p className="text-sm font-bold text-slate-800">{order.postcode || 'Pickup at Studio'}</p>
                    <p className="text-xs text-slate-500 mb-2 truncate">{order.address}</p>
                    {order.fulfillmentType === 'Delivery' && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' ' + order.postcode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 flex items-center gap-1 mt-1 hover:underline"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        OPEN NAVIGATION
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {(['Pending', 'Baking', 'Ready', 'Completed'] as OrderStatus[]).map(s => (
                    <button 
                      key={s}
                      onClick={() => handleStatusChange(order.id, s)}
                      className={`flex-1 text-[10px] font-bold py-3 rounded-xl transition-all shadow-sm ${order.status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
              <p className="text-slate-400 font-medium">No orders to show yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
