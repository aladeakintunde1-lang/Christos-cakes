
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FLAVORS, SIZES, SHOP_POSTCODE, PRICE_PER_MILE, MIN_DELIVERY_FEE, PICKUP_ADDRESS, INSTAGRAM_URL } from '../constants';
import { getCakeMessageSuggestion, getDistanceBetweenPostcodes } from '../services/gemini';
import { saveOrder } from '../utils/storage';
import { Order, FulfillmentType } from '../types';

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

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
    flavor: FLAVORS[0],
    size: SIZES[0].label,
    deliveryFee: 0,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9),
  });

  const handlePostcodeChange = async (postcode: string) => {
    const pc = postcode.toUpperCase().trim();
    setOrder(prev => ({ ...prev, postcode: pc }));
    
    if (UK_POSTCODE_REGEX.test(pc)) {
      setDistanceLoading(true);
      try {
        const miles = await getDistanceBetweenPostcodes(SHOP_POSTCODE, pc);
        setCalculatedDistance(miles);
        const fee = Math.max(MIN_DELIVERY_FEE, miles * PRICE_PER_MILE);
        setOrder(prev => ({ ...prev, deliveryFee: fee }));
      } catch (error) {
        console.error(error);
      } finally {
        setDistanceLoading(false);
      }
    } else {
      setCalculatedDistance(null);
      setOrder(prev => ({ ...prev, deliveryFee: 0 }));
    }
  };

  useEffect(() => {
    if (order.fulfillmentType === 'Collection') {
      setOrder(prev => ({ ...prev, deliveryFee: 0, postcode: '' }));
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

  const handleFinish = () => {
    const basePrice = SIZES.find(s => s.label === order.size)?.price || 0;
    const finalOrder = {
      ...order,
      totalPrice: basePrice + (order.deliveryFee || 0),
    } as Order;
    
    saveOrder(finalOrder);
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
      <div className="animate-fadeIn min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-10 md:p-16 max-w-2xl w-full text-center border border-slate-100 relative overflow-hidden">
          {/* Confetti-like decor */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-green-400 to-blue-500" />
          
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-[bounce_2s_infinite]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-4xl font-bold text-slate-900 mb-4 font-serif">Order Received!</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Thank you, <span className="font-bold text-slate-900">{order.customerName}</span>. Your bespoke luxury cake journey has officially begun.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-left animate-slideIn" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-100 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Alert</span>
              </div>
              <p className="text-xs font-bold text-slate-700">SMS Confirmation has been dispatched to {order.phone}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-left animate-slideIn" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Ping</span>
              </div>
              <p className="text-xs font-bold text-slate-700">The baker has been notified and is reviewing your design.</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 uppercase flex items-center justify-center gap-3"
          >
            RETURN TO GALLERY
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-12 border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className={`text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors ${step === 1 ? 'invisible' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Step {step} of 3</span>
          <div className="flex gap-1">
            <div className={`h-1 w-6 rounded-full ${step >= 1 ? 'bg-pink-500' : 'bg-slate-100'}`} />
            <div className={`h-1 w-6 rounded-full ${step >= 2 ? 'bg-pink-500' : 'bg-slate-100'}`} />
            <div className={`h-1 w-6 rounded-full ${step >= 3 ? 'bg-pink-500' : 'bg-slate-100'}`} />
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {step === 1 && (
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 font-serif">Delivery Logistics</h2>
          <p className="text-sm text-slate-400 mb-8 font-medium">Choose how you'd like to receive your cake.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => setOrder(prev => ({ ...prev, fulfillmentType: 'Collection' }))}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${order.fulfillmentType === 'Collection' ? 'border-pink-500 bg-pink-50/50 shadow-lg shadow-pink-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${order.fulfillmentType === 'Collection' ? 'text-pink-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="text-xs font-black uppercase tracking-widest">Collection</div>
              <div className="text-[10px] text-slate-400 font-bold">FREE</div>
            </button>
            <button 
              onClick={() => setOrder(prev => ({ ...prev, fulfillmentType: 'Delivery' }))}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${order.fulfillmentType === 'Delivery' ? 'border-pink-500 bg-pink-50/50 shadow-lg shadow-pink-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${order.fulfillmentType === 'Delivery' ? 'text-pink-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <div className="text-xs font-black uppercase tracking-widest">Delivery</div>
              <div className="text-[10px] text-slate-400 font-bold">Calculated by Mile</div>
            </button>
          </div>

          {order.fulfillmentType === 'Collection' ? (
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Studio Address</p>
              <p className="text-sm text-slate-700 font-bold">{PICKUP_ADDRESS}</p>
            </div>
          ) : (
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Delivery Postcode</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. TA21 9RH"
                    className={`w-full p-4 bg-slate-50 rounded-2xl border-2 transition-all focus:bg-white outline-none uppercase font-bold text-slate-800 ${distanceLoading ? 'animate-pulse border-pink-100' : 'border-transparent focus:border-pink-200'}`}
                    value={order.postcode}
                    onChange={e => handlePostcodeChange(e.target.value)}
                  />
                  {distanceLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-pink-500 animate-pulse">
                      CALCULATING...
                    </div>
                  )}
                </div>
                {!isPostcodeValid() && order.postcode && !distanceLoading && (
                  <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-widest">Invalid UK postcode.</p>
                )}
                {calculatedDistance !== null && !distanceLoading && (
                  <div className="mt-3 flex items-center justify-between p-4 bg-pink-50 rounded-xl border border-pink-100">
                    <div>
                      <span className="text-[10px] font-black text-pink-700 uppercase tracking-widest block">Mileage</span>
                      <span className="text-sm font-black text-pink-900">{calculatedDistance.toFixed(1)} miles</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-pink-700 uppercase tracking-widest block">Delivery Fee</span>
                      <span className="text-sm font-black text-pink-900">£{order.deliveryFee?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Street Address</label>
                <input 
                  type="text" 
                  placeholder="Address Line 1"
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-200 focus:bg-white outline-none transition-all"
                  value={order.address}
                  onChange={e => setOrder(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Preferred Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-200 focus:bg-white outline-none transition-all font-bold text-slate-800"
                value={order.deliveryDate}
                onChange={e => setOrder(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Time Slot</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-200 focus:bg-white outline-none transition-all font-bold text-slate-800"
                value={order.deliveryTimeSlot}
                onChange={e => setOrder(prev => ({ ...prev, deliveryTimeSlot: e.target.value }))}
              >
                <option value="">Select Time</option>
                <option value="Morning">Morning (9am - 12pm)</option>
                <option value="Afternoon">Afternoon (1pm - 5pm)</option>
                <option value="Night">Evening (6pm - 8pm)</option>
              </select>
            </div>
          </div>

          <button 
            disabled={!order.deliveryDate || !order.deliveryTimeSlot || !isPostcodeValid() || distanceLoading}
            onClick={() => setStep(2)}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl mt-10 font-black text-sm tracking-widest disabled:opacity-50 transition-all shadow-xl active:scale-[0.98] uppercase"
          >
            Continue to Customization
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 font-serif">Cake Design</h2>
          <p className="text-sm text-slate-400 mb-8 font-medium">Customize your bespoke masterpiece.</p>
          
          <div className="space-y-6">
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              <h3 className="text-xs font-black text-slate-800 mb-2 uppercase tracking-widest flex items-center gap-2">
                Design Inspiration
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Upload a screenshot or link from our Instagram gallery.</p>
              
              <a 
                href={INSTAGRAM_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-slate-900 text-white font-black text-[10px] tracking-widest mb-6 shadow-lg hover:bg-slate-800 transition-all uppercase"
              >
                Browse @Christoscakes_events
              </a>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-300 mb-2 uppercase tracking-[0.2em]">Instagram Post Link</label>
                  <input 
                    type="url" 
                    placeholder="Paste URL..."
                    className="w-full p-4 bg-white rounded-xl border border-slate-100 text-xs focus:ring-4 focus:ring-pink-50 outline-none transition-all"
                    value={order.inspirationLink || ''}
                    onChange={e => setOrder(prev => ({ ...prev, inspirationLink: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-300 mb-2 uppercase tracking-[0.2em]">Visual Reference</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[120px] p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all group"
                  >
                    {order.inspirationImage ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-white shadow-inner">
                        <img src={order.inspirationImage} alt="Preview" className="w-full h-auto block object-contain max-h-[200px]" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOrder(prev => ({ ...prev, inspirationImage: undefined })) }}
                          className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white p-2 rounded-full shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 group-hover:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Click to upload screenshot</span>
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
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Flavor Selection</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-200 focus:bg-white outline-none transition-all font-bold text-slate-800"
                value={order.flavor}
                onChange={e => setOrder(prev => ({ ...prev, flavor: e.target.value }))}
              >
                {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Size</label>
              <div className="grid grid-cols-2 gap-3">
                {SIZES.map(s => (
                  <button 
                    key={s.label}
                    onClick={() => setOrder(prev => ({ ...prev, size: s.label }))}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${order.size === s.label ? 'border-pink-500 bg-pink-50/50 shadow-lg shadow-pink-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <div className="text-xs font-black uppercase tracking-widest mb-1">{s.label}</div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest">£{s.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Message on Cake</label>
                <button 
                  onClick={handleAiHelp}
                  disabled={loading}
                  className="text-[10px] font-black text-pink-600 flex items-center gap-1.5 hover:text-pink-700 transition-colors uppercase tracking-widest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {loading ? 'Thinking...' : 'AI Assistance'}
                </button>
              </div>
              <textarea 
                placeholder="Write your special message here..."
                className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-pink-200 focus:bg-white outline-none transition-all h-32 text-sm font-medium leading-relaxed"
                value={order.messageOnCake}
                onChange={e => setOrder(prev => ({ ...prev, messageOnCake: e.target.value }))}
              />
              {aiSuggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {aiSuggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setOrder(prev => ({ ...prev, messageOnCake: s }))}
                      className="text-[10px] font-black uppercase tracking-widest bg-pink-100 text-pink-700 px-3 py-2 rounded-full border border-pink-200 hover:bg-pink-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setStep(3)}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl mt-10 font-black text-sm tracking-widest shadow-xl active:scale-[0.98] uppercase"
          >
            Review Summary
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 font-serif">Order Review</h2>
          <p className="text-sm text-slate-400 mb-8 font-medium">Verify your details before placing the order.</p>
          
          <div className="space-y-6 mb-10">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Details</span>
              <div className="text-right flex flex-col items-end gap-2">
                <input 
                  type="text" placeholder="Your Full Name" 
                  className="block w-full text-right bg-transparent text-sm font-bold outline-none text-slate-800"
                  value={order.customerName || ''}
                  onChange={e => setOrder(prev => ({ ...prev, customerName: e.target.value }))}
                />
                <input 
                  type="tel" placeholder="Mobile Number" 
                  className="block w-full text-right bg-transparent text-xs text-slate-400 font-bold outline-none"
                  value={order.phone || ''}
                  onChange={e => setOrder(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specifications</span>
              <span className="font-bold text-sm text-slate-800">{order.size} {order.flavor}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment</span>
              <div className="text-right">
                <span className="font-bold text-sm text-slate-800 block">{order.fulfillmentType}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{order.deliveryDate} @ {order.deliveryTimeSlot}</span>
              </div>
            </div>

            {order.inspirationLink && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Design Reference</span>
                <a 
                  href={order.inspirationLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-pink-600 truncate max-w-[200px] hover:underline flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Instagram Link
                </a>
              </div>
            )}

            <div className="bg-slate-50/80 backdrop-blur-md p-8 rounded-[2rem] space-y-4 border border-slate-100 shadow-inner">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Base Cake Price</span>
                <span className="text-slate-900">£{SIZES.find(s => s.label === order.size)?.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Delivery Charge {calculatedDistance ? `(${calculatedDistance.toFixed(1)} miles)` : ''}</span>
                <span className="text-slate-900">£{order.deliveryFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-3xl pt-6 border-t border-slate-200">
                <span className="font-serif">Total</span>
                <span className="text-pink-600">£{( (SIZES.find(s => s.label === order.size)?.price || 0) + (order.deliveryFee || 0) ).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button 
            disabled={!order.customerName || !order.phone}
            onClick={handleFinish}
            className="w-full bg-pink-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-pink-100 hover:bg-pink-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-widest disabled:opacity-50"
          >
            Place Bespoke Order
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderForm;
