
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { SIZES, SHOP_POSTCODE, PICKUP_ADDRESS, INSTAGRAM_URL } from '../constants';
import { getCakeMessageSuggestion, getDistanceBetweenPostcodes } from '../services/gemini';
import { saveOrder } from '../utils/storage';
import { Order, FulfillmentType } from '../types';

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [order, setOrder] = useState<Partial<Order>>({
    fulfillmentType: 'Collection',
    flavor: '',
    size: SIZES[0].label,
    deliveryFee: 0,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9),
    customerName: '',
    email: '',
    phone: '',
    postcode: '',
    address: '',
    deliveryDate: '',
    deliveryTimeSlot: '',
    messageOnCake: '',
    inspirationLink: '',
  });

  const handlePostcodeChange = async (postcode: string) => {
    const pc = postcode.toUpperCase().trim();
    setOrder(prev => ({ ...prev, postcode: pc }));
    
    if (UK_POSTCODE_REGEX.test(pc)) {
      setDistanceLoading(true);
      try {
        const miles = await getDistanceBetweenPostcodes(SHOP_POSTCODE, pc);
        setCalculatedDistance(miles);
        setOrder(prev => ({ ...prev, estimatedMileage: miles }));
      } catch (error) {
        console.error(error);
      } finally {
        setDistanceLoading(false);
      }
    } else {
      setCalculatedDistance(null);
      setOrder(prev => ({ ...prev, estimatedMileage: undefined }));
    }
  };

  useEffect(() => {
    if (order.fulfillmentType === 'Collection') {
      setOrder(prev => ({ ...prev, deliveryFee: 0, postcode: '', estimatedMileage: undefined }));
      setCalculatedDistance(null);
    }
  }, [order.fulfillmentType]);

  const handleAiHelp = async () => {
    setLoading(true);
    const suggestions = await getCakeMessageSuggestion('Birthday', 'a loved one', 'warm and elegant');
    setAiSuggestions(suggestions);
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrder(prev => ({ ...prev, inspirationImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const finalOrder = {
      ...order,
      totalPrice: 0,
      deliveryFee: 0,
    } as Order;
    
    saveOrder(finalOrder);

    // Send to n8n if configured
    if (N8N_WEBHOOK_URL) {
      try {
        // Remove large image data before sending to webhook to prevent payload size issues
        const { inspirationImage, ...orderData } = finalOrder;
        
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...orderData, 
            type: 'NEW_ORDER',
            appUrl: window.location.origin 
          })
        });
      } catch (err) {
        console.error('Failed to send order to n8n:', err);
      }
    }

    setLoading(false);
    setIsSuccess(true);
    
    // Simulate real notification sound or haptic feedback intent
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const isPostcodeValid = () => {
    if (order.fulfillmentType === 'Collection') return true;
    if (!order.postcode) return false;
    return UK_POSTCODE_REGEX.test(order.postcode.trim());
  };

  if (isSuccess) {
    return (
      <div className="animate-fadeIn min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="glass-card rounded-[3.5rem] p-12 md:p-24 max-w-3xl w-full text-center relative overflow-hidden shadow-[0_40px_100px_rgba(219,39,119,0.1)] border-white/80">
          {/* Confetti-like decor */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-pink-500 via-rose-300 to-pink-600" />
          
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="w-28 h-28 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-12 border border-pink-100 shadow-inner"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          
          <h2 className="text-6xl font-serif text-pink-950 mb-8 leading-[0.9] tracking-tighter">Your Journey <br/><span className="italic text-pink-600">Begins</span></h2>
          <p className="text-slate-500 mb-16 leading-relaxed font-medium text-lg max-w-lg mx-auto">
            Thank you, <span className="font-bold text-pink-800">{order.customerName}</span>. Your bespoke luxury cake request has been received. We are preparing to bring your vision to life.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 text-left animate-slideIn shadow-sm" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Client Alert</span>
              </div>
              <p className="text-sm font-bold text-slate-800">Confirmation dispatched to {order.phone}</p>
            </div>

            <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 text-left animate-slideIn shadow-sm" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Atelier Ping</span>
              </div>
              <p className="text-sm font-bold text-slate-800">The baker is reviewing your bespoke design.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <motion.button 
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/invoice/${order.id}`)}
              className="w-full bg-pink-700 text-white py-7 rounded-full font-bold text-sm tracking-[0.3em] hover:bg-pink-800 transition-all shadow-2xl shadow-pink-200/40 uppercase flex items-center justify-center gap-4 border border-white/20"
            >
              VIEW INVOICE
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.button>
            <button 
              onClick={() => navigate('/')}
              className="w-full text-slate-400 py-4 rounded-full font-bold text-[10px] tracking-[0.5em] hover:text-pink-600 transition-all uppercase"
            >
              Return to Boutique
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Visual "Stack" Layers */}
      <div className="absolute -inset-4 bg-white/20 rounded-[4rem] -z-10 blur-xl" />
      <div className="absolute inset-2 bg-pink-100/10 rounded-[3.5rem] -z-10 translate-y-4" />
      
      <div className="glass-card rounded-[3.5rem] p-10 md:p-16 mb-20 shadow-[0_40px_100px_rgba(219,39,119,0.08)] animate-slideIn border-white/80">
        <div className="flex justify-between items-center mb-16">
        <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className={`text-slate-400 p-4 hover:bg-pink-50 rounded-full transition-all ${step === 1 ? 'invisible' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-pink-300 uppercase tracking-[0.6em] mb-4">Step {step} of 3</span>
          <div className="flex gap-3">
            <div className={`h-[2px] w-10 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-pink-600' : 'bg-pink-100'}`} />
            <div className={`h-[2px] w-10 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-pink-600' : 'bg-pink-100'}`} />
            <div className={`h-[2px] w-10 rounded-full transition-all duration-700 ${step >= 3 ? 'bg-pink-600' : 'bg-pink-100'}`} />
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-slate-400 p-4 hover:bg-pink-50 rounded-full transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {step === 1 && (
        <div className="animate-fadeIn">
          <h2 className="text-5xl font-serif text-pink-950 mb-3">Logistics</h2>
          <p className="text-sm text-slate-400 mb-12 font-medium tracking-wide">Select your preferred fulfillment method.</p>
          
          <div className="grid grid-cols-2 gap-8 mb-12">
            <button 
              onClick={() => setOrder(prev => ({ ...prev, fulfillmentType: 'Collection' }))}
              className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group ${order.fulfillmentType === 'Collection' ? 'border-pink-500 bg-pink-50/20 shadow-2xl shadow-pink-200/20' : 'border-slate-100 bg-white/40 hover:border-pink-200'}`}
            >
              <div className={`p-5 rounded-2xl transition-all duration-500 ${order.fulfillmentType === 'Collection' ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-800">Collection</div>
              <div className="text-[10px] text-pink-500 font-bold uppercase tracking-[0.2em]">Complimentary</div>
            </button>
            <button 
              onClick={() => setOrder(prev => ({ ...prev, fulfillmentType: 'Delivery' }))}
              className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group ${order.fulfillmentType === 'Delivery' ? 'border-pink-500 bg-pink-50/20 shadow-2xl shadow-pink-200/20' : 'border-slate-100 bg-white/40 hover:border-pink-200'}`}
            >
              <div className={`p-5 rounded-2xl transition-all duration-500 ${order.fulfillmentType === 'Delivery' ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-800">Delivery</div>
              <div className="text-[10px] text-pink-500 font-bold uppercase tracking-[0.2em]">Bespoke Quote</div>
            </button>
          </div>

          {order.fulfillmentType === 'Collection' ? (
            <div className="bg-pink-50/20 p-10 rounded-[2.5rem] mb-12 border border-pink-100/50 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-pink-400 mb-4 uppercase tracking-[0.4em]">Atelier Address</p>
              <p className="text-base text-pink-950 font-serif leading-relaxed italic">{PICKUP_ADDRESS}</p>
            </div>
          ) : (
            <div className="space-y-10 mb-12">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.4em]">Delivery Postcode</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. TA21 9RH"
                    className={`w-full p-6 bg-white/40 rounded-2xl border-2 transition-all focus:bg-white outline-none uppercase font-bold text-slate-800 tracking-[0.2em] text-lg ${distanceLoading ? 'animate-pulse border-pink-100' : 'border-slate-100 focus:border-pink-300'}`}
                    value={order.postcode}
                    onChange={e => handlePostcodeChange(e.target.value)}
                  />
                  {distanceLoading && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-pink-500 animate-pulse tracking-[0.3em]">
                      CALCULATING...
                    </div>
                  )}
                </div>
                {!isPostcodeValid() && order.postcode && !distanceLoading && (
                  <p className="text-rose-400 text-[10px] font-bold mt-4 uppercase tracking-[0.2em]">Invalid UK postcode.</p>
                )}
                {calculatedDistance !== null && !distanceLoading && (
                  <div className="mt-6 flex items-center justify-between p-6 bg-pink-50/30 rounded-2xl border border-pink-100/50">
                    <div>
                      <span className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.3em] block mb-2">Estimated Distance</span>
                      <span className="text-base font-bold text-pink-950">{calculatedDistance.toFixed(1)} miles from studio</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.4em]">Street Address</label>
                <input 
                  type="text" 
                  placeholder="Full delivery address..."
                  className="w-full p-6 bg-white/40 rounded-2xl border-2 border-slate-100 focus:border-pink-300 focus:bg-white outline-none transition-all font-medium text-lg"
                  value={order.address}
                  onChange={e => setOrder(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.4em]">Event Date</label>
              <input 
                type="date" 
                className="w-full p-6 bg-white/40 rounded-2xl border-2 border-slate-100 focus:border-pink-300 focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg"
                value={order.deliveryDate}
                onChange={e => setOrder(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.4em]">Arrival Window</label>
              <div className="relative">
                <select 
                  className="w-full p-6 bg-white/40 rounded-2xl border-2 border-slate-100 focus:border-pink-300 focus:bg-white outline-none transition-all font-bold text-slate-800 appearance-none text-lg"
                  value={order.deliveryTimeSlot}
                  onChange={e => setOrder(prev => ({ ...prev, deliveryTimeSlot: e.target.value }))}
                >
                  <option value="">Select Window</option>
                  <option value="Morning">Morning (9am - 12pm)</option>
                  <option value="Afternoon">Afternoon (1pm - 5pm)</option>
                  <option value="Night">Evening (6pm - 8pm)</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            disabled={!order.deliveryDate || !order.deliveryTimeSlot || !isPostcodeValid() || distanceLoading}
            onClick={() => setStep(2)}
            className="w-full bg-pink-700 text-white py-7 rounded-full mt-16 font-bold text-sm tracking-[0.3em] disabled:opacity-30 transition-all shadow-2xl shadow-pink-200/40 uppercase border border-white/20"
          >
            Continue to Design
          </motion.button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fadeIn">
          <h2 className="text-5xl font-serif text-pink-950 mb-3">Artistry</h2>
          <p className="text-sm text-slate-400 mb-12 font-medium tracking-wide">Define the aesthetic of your masterpiece.</p>
          
          <div className="space-y-12">
            <div className="bg-pink-50/20 p-10 rounded-[3rem] border border-pink-100/50 backdrop-blur-sm">
              <h3 className="text-[11px] font-bold text-pink-950 mb-3 uppercase tracking-[0.4em] flex items-center gap-3">
                Visual Inspiration
              </h3>
              <p className="text-[11px] text-slate-400 mb-10 font-medium">Reference our curated gallery or upload your own vision.</p>
              
              <a 
                href={INSTAGRAM_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-6 px-10 rounded-2xl bg-slate-900 text-white font-bold text-[11px] tracking-[0.4em] mb-10 shadow-2xl hover:bg-slate-800 transition-all uppercase"
              >
                Browse @Christoscakes_events
              </a>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.3em]">Instagram Reference Link</label>
                  <input 
                    type="url" 
                    placeholder="Paste URL here..."
                    className="w-full p-6 bg-white rounded-2xl border border-slate-100 text-sm focus:ring-8 focus:ring-pink-50 outline-none transition-all font-medium"
                    value={order.inspirationLink || ''}
                    onChange={e => setOrder(prev => ({ ...prev, inspirationLink: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.3em]">Upload Reference Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[200px] p-10 bg-white/60 border-2 border-dashed border-pink-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 hover:bg-white transition-all group shadow-inner"
                  >
                    {order.inspirationImage ? (
                      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl">
                        <img src={order.inspirationImage} alt="Preview" className="w-full h-auto block object-contain max-h-[400px]" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOrder(prev => ({ ...prev, inspirationImage: undefined })) }}
                          className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-full shadow-2xl hover:bg-rose-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 border border-pink-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-300 group-hover:text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em]">Select from your device</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.4em]">Flavor Palette & Dietary</label>
              <textarea 
                placeholder="Describe your desired flavors, fillings, and any dietary requirements..."
                className="w-full p-8 bg-white/40 rounded-[2.5rem] border-2 border-slate-100 focus:border-pink-300 focus:bg-white outline-none transition-all h-48 text-base font-medium leading-relaxed shadow-inner"
                value={order.flavor}
                onChange={e => setOrder(prev => ({ ...prev, flavor: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-5 uppercase tracking-[0.4em]">Select Tier / Size</label>
              <div className="grid grid-cols-2 gap-6">
                {SIZES.map(s => (
                  <button 
                    key={s.label}
                    onClick={() => setOrder(prev => ({ ...prev, size: s.label }))}
                    className={`p-8 rounded-3xl border-2 text-left transition-all ${order.size === s.label ? 'border-pink-500 bg-pink-50/40 shadow-2xl shadow-pink-200/10' : 'border-slate-100 bg-white/40 hover:border-pink-200'}`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-800">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Calligraphy / Message</label>
                <button 
                  onClick={handleAiHelp}
                  disabled={loading}
                  className="text-[10px] font-bold text-pink-600 flex items-center gap-3 hover:text-pink-800 transition-colors uppercase tracking-[0.3em]"
                >
                  {loading ? 'Generating...' : 'Message Help'}
                </button>
              </div>
              <textarea 
                placeholder="Message to be written on the cake..."
                className="w-full p-8 bg-white/40 rounded-[2.5rem] border-2 border-slate-100 focus:border-pink-300 focus:bg-white outline-none transition-all h-40 text-base font-medium leading-relaxed shadow-inner"
                value={order.messageOnCake}
                onChange={e => setOrder(prev => ({ ...prev, messageOnCake: e.target.value }))}
              />
              {aiSuggestions.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-4">
                  {aiSuggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setOrder(prev => ({ ...prev, messageOnCake: s }))}
                      className="text-[10px] font-bold uppercase tracking-[0.3em] bg-pink-50 text-pink-700 px-6 py-3 rounded-full border border-pink-100 hover:bg-pink-100 transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setStep(3)}
            className="w-full bg-pink-700 text-white py-7 rounded-full mt-16 font-bold text-sm tracking-[0.3em] shadow-2xl shadow-pink-200/40 uppercase border border-white/20"
          >
            Review Summary
          </motion.button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fadeIn">
          <h2 className="text-5xl font-serif text-pink-950 mb-3">Review</h2>
          <p className="text-sm text-slate-400 mb-12 font-medium tracking-wide">Confirm your bespoke specifications.</p>
          
          <div className="space-y-12">
            <div className="bg-pink-50/20 p-10 rounded-[3rem] border border-pink-100/50 backdrop-blur-sm">
              <h3 className="text-[11px] font-bold text-pink-950 mb-8 uppercase tracking-[0.4em]">Client Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.3em]">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    className="w-full bg-transparent border-b-2 border-pink-100 p-4 text-lg font-serif italic outline-none focus:border-pink-500 transition-all text-pink-950 placeholder:text-slate-300"
                    value={order.customerName || ''}
                    onChange={e => setOrder(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.3em]">Contact Email</label>
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    className="w-full bg-transparent border-b-2 border-pink-100 p-4 text-lg font-serif italic outline-none focus:border-pink-500 transition-all text-pink-950 placeholder:text-slate-300"
                    value={order.email || ''}
                    onChange={e => setOrder(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.3em]">Mobile Number</label>
                  <input 
                    type="tel" 
                    placeholder="Phone Number"
                    className="w-full bg-transparent border-b-2 border-pink-100 p-4 text-lg font-serif italic outline-none focus:border-pink-500 transition-all text-pink-950 placeholder:text-slate-300"
                    value={order.phone || ''}
                    onChange={e => setOrder(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-[11px] font-bold text-pink-950 uppercase tracking-[0.4em] mb-6">Specifications</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-pink-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Flavor</span>
                    <span className="text-sm font-bold text-pink-900 text-right max-w-[200px] truncate">{order.flavor || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-pink-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Size</span>
                    <span className="text-sm font-bold text-pink-900">{order.size}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-pink-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Message</span>
                    <span className="text-sm font-bold text-pink-900 italic">"{order.messageOnCake || 'None'}"</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-[11px] font-bold text-pink-950 uppercase tracking-[0.4em] mb-6">Logistics</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-pink-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Method</span>
                    <span className="text-sm font-bold text-pink-900">{order.fulfillmentType}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-pink-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Date</span>
                    <span className="text-sm font-bold text-pink-900">{order.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-pink-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Window</span>
                    <span className="text-sm font-bold text-pink-900">{order.deliveryTimeSlot}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-pink-50/30 p-12 rounded-[3rem] text-center border border-pink-100/50">
              <p className="text-[11px] font-bold text-pink-400 mb-4 uppercase tracking-[0.5em]">Final Quote</p>
              <p className="text-4xl font-serif text-pink-950 italic">Awaiting Atelier Review</p>
              <p className="text-[10px] text-slate-400 mt-6 font-medium tracking-widest uppercase">We will contact you within 24 hours</p>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            disabled={!order.customerName || !order.phone || !order.email || loading}
            onClick={handleFinish}
            className="w-full bg-pink-950 text-white py-8 rounded-full mt-16 font-bold text-sm tracking-[0.4em] shadow-[0_20px_60px_rgba(0,0,0,0.2)] disabled:opacity-30 transition-all uppercase border border-white/10"
          >
            {loading ? 'Processing Order...' : 'Place Bespoke Order'}
          </motion.button>
        </div>
      )}
    </div>
  </div>
  );
};

export default OrderForm;
