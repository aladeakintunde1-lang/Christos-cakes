
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft } from 'lucide-react';
import { getOrders, getSettings } from '../utils/storage';
import { Order } from '../types';
import { SHOP_POSTCODE, PICKUP_ADDRESS, LOGO_URL } from '../constants';

const OrderView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [brandLogo, setBrandLogo] = useState<string>(LOGO_URL);

  useEffect(() => {
    const settings = getSettings();
    if (settings?.logoUrl) setBrandLogo(settings.logoUrl);

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
          <h2 className="text-2xl font-light text-luxury-ink font-serif">Order Not Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-luxury-accent font-light small-caps hover:underline"
          >
            Return to Boutique
          </button>
        </div>
      </div>
    );
  }

  const date = new Date(order.createdAt);
  const orderNumber = `ORD-${order.id.toUpperCase().slice(0, 6)}`;
  const issueDate = date.toLocaleDateString();
  const dueDate = new Date(order.deliveryDate).toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto my-12 bg-white shadow-2xl rounded-none border border-slate-100 overflow-hidden animate-fadeIn print:shadow-none print:border-none print:m-0 print:rounded-none print:max-w-full">
      {/* TOP DECORATIVE BAR */}
      <div className="h-2 w-full bg-luxury-accent print:h-1" />
      
      <div className="p-10 md:p-20 print:p-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20 pb-12 border-b border-slate-100">
          <div className="space-y-8">
            <div className="flex items-center gap-8">
              <div className="w-28 h-28 bg-white rounded-none flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-sm p-2">
                <img 
                  src={brandLogo} 
                  alt="Christos Cakes Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-5xl font-light text-luxury-ink font-serif tracking-tight leading-none">Christos Cakes</h1>
                <p className="small-caps text-luxury-accent mt-3 tracking-[0.3em] text-xs">Bespoke Luxury Cakes</p>
              </div>
            </div>
            <div className="text-xs text-luxury-muted leading-relaxed space-y-1.5 opacity-80">
              <p className="small-caps text-luxury-ink font-semibold tracking-wider mb-1">Studio Location</p>
              <p>{PICKUP_ADDRESS}</p>
              <p>{SHOP_POSTCODE}, United Kingdom</p>
              <p className="pt-2 italic">www.christoscakes.co.uk</p>
            </div>
          </div>
          
          <div className="flex flex-col justify-between items-end text-right h-full">
            <div className="relative mb-12">
              <h2 className="text-9xl font-black text-slate-50 uppercase tracking-tighter select-none absolute -top-14 -right-6 z-0 opacity-40 print:opacity-10">Order</h2>
              <div className="relative z-10">
                <p className="small-caps text-luxury-muted mb-2 tracking-widest text-[10px]">Order Number</p>
                <p className="text-3xl font-light text-luxury-ink font-serif">{orderNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="small-caps text-luxury-muted mb-2 tracking-widest text-[10px]">Issue Date</p>
                <p className="text-sm font-medium text-luxury-ink">{issueDate}</p>
              </div>
              <div>
                <p className="small-caps text-luxury-muted mb-2 tracking-widest text-[10px]">Event Date</p>
                <p className="text-sm font-medium text-luxury-ink">{dueDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CLIENT & EVENT DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-20 border border-slate-100 rounded-none overflow-hidden shadow-sm">
          <div className="p-10 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
            <h3 className="small-caps text-luxury-muted mb-8 tracking-widest text-[10px] font-semibold">Bill To</h3>
            <div className="space-y-4">
              <p className="text-3xl font-light text-luxury-ink font-serif leading-tight">{order.customerName}</p>
              <div className="text-sm text-luxury-muted space-y-2 font-light">
                <p className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-luxury-accent/30" />
                  {order.email}
                </p>
                <p className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-luxury-accent/30" />
                  {order.phone}
                </p>
                {order.address && (
                  <p className="flex items-start gap-3 pt-3 border-t border-slate-200/50 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-luxury-accent/30 mt-1.5" />
                    <span className="leading-relaxed">{order.address}<br />{order.postcode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-10 bg-white">
            <h3 className="small-caps text-luxury-muted mb-8 tracking-widest text-[10px] font-semibold">Event Logistics</h3>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Fulfillment Type</p>
                <p className="text-xl font-light text-luxury-ink border-b border-slate-100 pb-2 inline-block min-w-[120px]">{order.fulfillmentType}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Collection/Delivery</p>
                  <p className="text-sm font-medium text-luxury-ink">{dueDate}</p>
                </div>
                <div>
                  <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Time Slot</p>
                  <p className="text-sm font-medium text-luxury-ink">{order.deliveryTimeSlot}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-20">
          <table className="w-full">
            <thead>
              <tr className="small-caps text-luxury-muted border-b-2 border-luxury-ink/5">
                <th className="text-left py-8 px-6 tracking-widest text-[10px]">Description</th>
                <th className="text-right py-8 px-6 tracking-widest text-[10px]">Rate</th>
                <th className="text-right py-8 px-6 tracking-widest text-[10px]">Qty</th>
                <th className="text-right py-8 px-6 tracking-widest text-[10px]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.category === 'Cake' ? (
                <tr>
                  <td className="py-12 px-6">
                    <p className="text-2xl font-light text-luxury-ink font-serif mb-4">{order.size} Bespoke Cake</p>
                    <div className="space-y-4 pl-4 border-l-2 border-luxury-accent/10">
                      <div>
                        <p className="small-caps text-[9px] text-luxury-muted tracking-widest mb-1">Flavors & Fillings</p>
                        <p className="text-xs text-luxury-muted leading-relaxed max-w-md font-light">{order.flavor || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="small-caps text-[9px] text-luxury-muted tracking-widest mb-1">Custom Message</p>
                        <p className="text-xs text-luxury-muted italic leading-relaxed max-w-md font-light">"{order.messageOnCake || 'No message requested'}"</p>
                      </div>
                      {order.inspirationImage && (
                        <div className="pt-4">
                          <p className="small-caps text-[9px] text-luxury-muted mb-3 tracking-widest">Inspiration Image</p>
                          <div className="rounded-none overflow-hidden border border-slate-100 max-w-[240px] shadow-sm">
                            <img src={order.inspirationImage} alt="Inspiration" className="w-full h-auto" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-12 px-6 text-right text-sm font-medium text-luxury-muted">
                    {order.totalPrice ? `£${(order.totalPrice - (order.deliveryFee || 0)).toFixed(2)}` : 'Pending'}
                  </td>
                  <td className="py-12 px-6 text-right text-sm font-medium text-luxury-muted">1</td>
                  <td className="py-12 px-6 text-right text-xl font-light text-luxury-ink font-serif">
                    {order.totalPrice ? `£${(order.totalPrice - (order.deliveryFee || 0)).toFixed(2)}` : 'Pending'}
                  </td>
                </tr>
              ) : (
                <>
                  {order.pastries?.map((pastry, idx) => (
                    <tr key={pastry.id}>
                      <td className="py-12 px-6">
                        <p className="text-2xl font-light text-luxury-ink font-serif mb-2">{pastry.name}</p>
                        <p className="text-xs text-luxury-muted font-light opacity-70 italic">Selection from our bespoke pastry collection</p>
                      </td>
                      <td className="py-12 px-6 text-right text-sm font-medium text-luxury-muted">
                        {/* We don't have individual prices for pastries yet, so we'll show TBD or calculate if we add them later */}
                        TBD
                      </td>
                      <td className="py-12 px-6 text-right text-sm font-medium text-luxury-muted">{pastry.quantity}</td>
                      <td className="py-12 px-6 text-right text-xl font-light text-luxury-ink font-serif">
                        {idx === 0 && order.totalPrice ? `£${(order.totalPrice - (order.deliveryFee || 0)).toFixed(2)}` : 'TBD'}
                      </td>
                    </tr>
                  ))}
                  {(!order.pastries || order.pastries.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-12 px-6 text-center text-luxury-muted italic">No items selected</td>
                    </tr>
                  )}
                </>
              )}
              {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                <tr>
                  <td className="py-10 px-6">
                    <p className="text-xl font-light text-luxury-ink font-serif">Luxury Delivery Service</p>
                    <p className="text-xs text-luxury-muted mt-2 font-light opacity-70">Professional hand-delivery to {order.postcode}</p>
                  </td>
                  <td className="py-10 px-6 text-right text-sm font-medium text-luxury-muted">£{order.deliveryFee.toFixed(2)}</td>
                  <td className="py-10 px-6 text-right text-sm font-medium text-luxury-muted">1</td>
                  <td className="py-10 px-6 text-right text-xl font-light text-luxury-ink font-serif">£{order.deliveryFee.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS & TERMS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-10">
            <div className="bg-slate-50/50 p-10 rounded-none border border-slate-100">
              <h3 className="small-caps text-luxury-muted mb-8 tracking-widest text-[10px] font-semibold">Terms & Conditions</h3>
              <ul className="text-[10px] text-luxury-muted space-y-4 leading-relaxed font-light">
                <li className="flex gap-4">
                  <span className="text-luxury-accent font-bold opacity-50">01</span>
                  <span>A 50% non refundable deposit is require to confirm all bespoke orders.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-luxury-accent font-bold opacity-50">02</span>
                  <span>The deposit must be paid minimum of 6weeks before collection date to secure your booking.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-luxury-accent font-bold opacity-50">03</span>
                  <span>The remaining 50% balance must be paid atleast 2weeks before collection/delivery date.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-luxury-accent font-bold opacity-50">04</span>
                  <span>Store your luxury cake in a cool, dry place away from direct sunlight. Refrigeration recommended for fresh cream designs.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-10 rounded-none border-l-4 border-luxury-accent shadow-sm">
              <h3 className="small-caps text-luxury-accent mb-8 tracking-widest text-[10px] font-bold">Secure Bank Transfer</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Bank Name</p>
                  <p className="text-sm font-semibold text-luxury-ink">Monzo</p>
                </div>
                <div>
                  <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Account Name</p>
                  <p className="text-sm font-semibold text-luxury-ink">Christianah Alade</p>
                </div>
                <div>
                  <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Sort Code</p>
                  <p className="text-sm font-medium text-luxury-ink font-mono tracking-tighter">04-00-03</p>
                </div>
                <div>
                  <p className="small-caps text-[9px] text-luxury-muted mb-2 tracking-widest">Account Number</p>
                  <p className="text-sm font-medium text-luxury-ink font-mono tracking-tighter">90709406</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-slate-100">
                  <p className="small-caps text-luxury-accent mb-1 text-[10px] tracking-widest font-bold">Reference</p>
                  <p className="text-xs font-light text-luxury-muted italic">Please use your <span className="text-luxury-accent font-medium">full name</span> as the reference only.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3 px-6">
              <div className="flex justify-between small-caps text-luxury-muted text-[10px] tracking-widest">
                <span>Subtotal</span>
                <span className="text-luxury-ink font-medium">{order.totalPrice ? `£${order.totalPrice.toFixed(2)}` : 'Pending'}</span>
              </div>
              <div className="flex justify-between small-caps text-luxury-muted text-[10px] tracking-widest">
                <span>VAT (0%)</span>
                <span className="text-luxury-ink font-medium">£0.00</span>
              </div>
            </div>
            
            <div className="bg-luxury-ink text-white p-10 rounded-none shadow-2xl transform hover:scale-[1.02] transition-transform print:bg-white print:text-black print:border-4 print:border-black print:shadow-none">
              <span className="small-caps text-white/60 tracking-[0.3em] text-[10px] mb-4 block print:text-black/60">Total Amount Due</span>
              <span className="text-6xl font-light font-serif leading-none block">
                {order.totalPrice ? `£${order.totalPrice.toFixed(2)}` : 'Pending'}
              </span>
            </div>
            
            <div className="pt-8 px-6 text-right space-y-2">
              <p className="small-caps text-luxury-muted tracking-widest text-[9px]">Payment Method</p>
              <p className="text-sm font-semibold text-luxury-ink">Bank Transfer</p>
              <div className="flex items-center justify-end gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-widest">Awaiting Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-24 pt-16 border-t border-slate-100 flex flex-col items-center">
          <p className="small-caps text-luxury-muted mb-12 opacity-40 tracking-[0.4em] text-[10px]">Thank you for choosing Christos Cakes</p>
          <div className="flex flex-wrap justify-center gap-6 print:hidden">
            <button 
              onClick={() => window.print()}
              className="px-12 py-5 bg-luxury-ink text-white rounded-none small-caps hover:bg-luxury-accent transition-all shadow-xl active:scale-95 flex items-center gap-4 tracking-widest font-semibold"
            >
              <Printer className="h-5 w-5" strokeWidth={1.5} />
              Print Order
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="px-12 py-5 bg-white text-luxury-muted rounded-none small-caps border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 tracking-widest"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderView;
