
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, getLogoUrl } from '../utils/storage';
import { Order } from '../types';
import { SHOP_POSTCODE, PICKUP_ADDRESS, LOGO_URL } from '../constants';

const InvoiceView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [brandLogo, setBrandLogo] = useState<string>(LOGO_URL);

  useEffect(() => {
    const savedLogo = getLogoUrl();
    if (savedLogo) setBrandLogo(savedLogo);

    if (orderId) {
      const orders = getOrders();
      const foundOrder = orders.find(o => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Invoice Not Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-pink-600 font-bold hover:underline"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  const date = new Date(order.createdAt);
  const invoiceNumber = `INV-${order.id.toUpperCase().slice(0, 6)}`;
  const issueDate = date.toLocaleDateString();
  const dueDate = new Date(order.deliveryDate).toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto my-12 bg-white shadow-2xl rounded-[2.5rem] border border-slate-100 overflow-hidden animate-fadeIn print:shadow-none print:border-none print:m-0 print:rounded-none">
      {/* TOP DECORATIVE BAR */}
      <div className="h-2 w-full bg-pink-600" />
      
      <div className="p-10 md:p-16">
        {/* HEADER SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pb-12 border-b border-slate-100">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                <img 
                  src={brandLogo} 
                  alt="Christos Cakes Logo" 
                  className="w-full h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Christos Cakes</h1>
                <p className="text-[10px] font-black text-pink-600 uppercase tracking-[0.4em] mt-1">Bespoke Luxury Cakes</p>
              </div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed space-y-1">
              <p className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Studio Location</p>
              <p>{PICKUP_ADDRESS}</p>
              <p>{SHOP_POSTCODE}, United Kingdom</p>
            </div>
          </div>
          
          <div className="flex flex-col justify-between items-end text-right">
            <div className="relative">
              <h2 className="text-8xl font-black text-slate-50 uppercase tracking-tighter select-none absolute -top-10 -right-4 z-0">Invoice</h2>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Invoice Number</p>
                <p className="text-2xl font-bold text-slate-900 font-serif">{invoiceNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Issue Date</p>
                <p className="text-sm font-bold text-slate-800">{issueDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Due Date</p>
                <p className="text-sm font-bold text-slate-800">{dueDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CLIENT & EVENT DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-16 border border-slate-100 rounded-3xl overflow-hidden">
          <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Bill To</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-slate-900 font-serif">{order.customerName}</p>
              <div className="text-sm text-slate-500 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  {order.email}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  {order.phone}
                </p>
                {order.address && (
                  <p className="flex items-start gap-2 pt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5" />
                    <span>{order.address}<br />{order.postcode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-white">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Event Logistics</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Fulfillment Type</p>
                <p className="text-lg font-bold text-slate-800">{order.fulfillmentType}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Event Date</p>
                  <p className="text-sm font-bold text-slate-800">{dueDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Time Slot</p>
                  <p className="text-sm font-bold text-slate-800">{order.deliveryTimeSlot}</p>
                </div>
              </div>
              {order.fulfillmentType === 'Delivery' && order.calculatedDistance !== undefined && (
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Estimated Distance</p>
                  <p className="text-sm font-bold text-pink-600">{order.calculatedDistance.toFixed(1)} miles from Studio</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-16">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-200">
                <th className="text-left py-6 px-4">Description</th>
                <th className="text-right py-6 px-4">Rate</th>
                <th className="text-right py-6 px-4">Qty</th>
                <th className="text-right py-6 px-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td className="py-8 px-4">
                  <p className="text-lg font-bold text-slate-800 font-serif">{order.size} Bespoke Cake</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Flavors & Fillings</p>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-md">{order.flavor || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Custom Message</p>
                      <p className="text-xs text-slate-400 italic leading-relaxed max-w-md">"{order.messageOnCake || 'No message requested'}"</p>
                    </div>
                  </div>
                </td>
                <td className="py-8 px-4 text-right text-sm font-medium text-slate-600">
                  {order.totalPrice ? `£${(order.totalPrice - (order.deliveryFee || 0)).toFixed(2)}` : 'Pending'}
                </td>
                <td className="py-8 px-4 text-right text-sm font-medium text-slate-600">1</td>
                <td className="py-8 px-4 text-right text-lg font-bold text-slate-900">
                  {order.totalPrice ? `£${(order.totalPrice - (order.deliveryFee || 0)).toFixed(2)}` : 'Pending'}
                </td>
              </tr>
              {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                <tr>
                  <td className="py-8 px-4">
                    <p className="text-lg font-bold text-slate-800 font-serif">Luxury Delivery Service</p>
                    <p className="text-xs text-slate-400 mt-2">Professional hand-delivery to {order.postcode}</p>
                  </td>
                  <td className="py-8 px-4 text-right text-sm font-medium text-slate-600">£{order.deliveryFee.toFixed(2)}</td>
                  <td className="py-8 px-4 text-right text-sm font-medium text-slate-600">1</td>
                  <td className="py-8 px-4 text-right text-lg font-bold text-slate-900">£{order.deliveryFee.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS & TERMS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Terms & Conditions</h3>
            <ul className="text-[10px] text-slate-500 space-y-3 leading-relaxed">
              <li className="flex gap-3">
                <span className="text-pink-500 font-bold">01</span>
                <span>A 50% non refundable deposit is require to confirm all custom cake orders.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-pink-500 font-bold">02</span>
                <span>The deposit must be paid minimum of 6weeks before collection date to secure your booking.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-pink-500 font-bold">03</span>
                <span>The remaining 50% balance must be paid atleast 2weeks before collection/delivery date.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-pink-500 font-bold">04</span>
                <span>Store your luxury cake in a cool, dry place away from direct sunlight. Refrigeration recommended for fresh cream designs.</span>
              </li>
            </ul>
          </div>
          
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
              <span>Subtotal</span>
              <span className="text-slate-900">{order.totalPrice ? `£${order.totalPrice.toFixed(2)}` : 'Pending'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
              <span>VAT (0%)</span>
              <span className="text-slate-900">£0.00</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200">
              <span className="text-xs font-black uppercase tracking-[0.3em]">Total Amount</span>
              <span className="text-4xl font-bold font-serif">{order.totalPrice ? `£${order.totalPrice.toFixed(2)}` : 'Pending'}</span>
            </div>
            <div className="pt-4 px-4 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
              <p className="text-sm font-bold text-slate-800">Bank Transfer / Online</p>
              <p className="text-[10px] text-slate-400 mt-1 italic">Ref: {invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] mb-10">Thank you for choosing Christos Cakes</p>
          <div className="flex flex-wrap justify-center gap-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
