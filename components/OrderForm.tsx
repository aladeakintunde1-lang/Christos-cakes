
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FLAVORS, SIZES, ZONES, PICKUP_ADDRESS, INSTAGRAM_URL } from '../constants';
import { getCakeMessageSuggestion } from '../services/gemini';
import { saveOrder } from '../utils/storage';
import { Order, FulfillmentType } from '../types';

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [order, setOrder] = useState<Partial<Order>>({
    fulfillmentType: 'Collection',
    flavor: FLAVORS[0],
    size: SIZES[0].label,
    deliveryFee: 0,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9),
  });

  const getDeliveryFee = (postcode: string): number => {
    const pc = postcode.toUpperCase().trim();
    if (!UK_POSTCODE_REGEX.test(pc)) return 0;

    const outward = pc.split(' ')[0];
    const area = outward.replace(/[0-9].*$/, '');

    const exactZone = ZONES.find(z => z.postcodes.includes(outward));
    if (exactZone) return exactZone.fee;

    const areaZone = ZONES.find(z => z.postcodes.includes(area));
    if (areaZone) return areaZone.fee;

    const nationwideZone = ZONES.find(z => z.name === 'Rest of UK');
    return nationwideZone ? nationwideZone.fee : 45.00;
  };

  useEffect(() => {
    if (order.fulfillmentType === 'Collection') {
      setOrder(prev => ({ ...prev, deliveryFee: 0, postcode: '' }));
    } else if (order.postcode && UK_POSTCODE_REGEX.test(order.postcode)) {
      const fee = getDeliveryFee(order.postcode);
      setOrder(prev => ({ ...prev, deliveryFee: fee }));
    }
  }, [order.fulfillmentType, order.postcode]);

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
    alert('Order Placed Successfully!');
    navigate('/');
  };

  const isPostcodeValid = () => {
    if (order.fulfillmentType === 'Collection') return true;
    if (!order.postcode) return false;
    return UK_POSTCODE_REGEX.test(order.postcode.trim());
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-12">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className={`text-slate-400 ${step === 1 ? 'invisible' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Step {step} of 3</span>
        <button onClick={() => navigate('/')} className="text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {step === 1 && (
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold text-slate-800 mb-6 font-serif">Delivery Details</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => setOrder(prev => ({ ...prev, fulfillmentType: 'Collection' }))}
              className={`p-4 rounded-2xl border-2 transition-all ${order.fulfillmentType === 'Collection' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="text-sm font-bold">Collection</div>
              <div className="text-xs text-slate-400">FREE</div>
            </button>
            <button 
              onClick={() => setOrder(prev => ({ ...prev, fulfillmentType: 'Delivery' }))}
              className={`p-4 rounded-2xl border-2 transition-all ${order.fulfillmentType === 'Delivery' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="text-sm font-bold">Delivery</div>
              <div className="text-xs text-slate-400">From £5.00</div>
            </button>
          </div>

          {order.fulfillmentType === 'Collection' ? (
            <div className="bg-slate-50 p-4 rounded-xl mb-6">
              <p className="text-xs font-bold text-slate-400 mb-1 uppercase">Pickup Address</p>
              <p className="text-sm text-slate-700">{PICKUP_ADDRESS}</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Postcode</label>
                <input 
                  type="text" 
                  placeholder="e.g. TA21 9RH"
                  className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none uppercase"
                  value={order.postcode}
                  onChange={e => setOrder(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                />
                {!isPostcodeValid() && order.postcode && (
                  <p className="text-red-500 text-xs mt-2">Please enter a valid UK postcode.</p>
                )}
                {isPostcodeValid() && order.postcode && (
                  <p className="text-green-600 text-xs mt-2 font-medium">Valid UK Postcode. Delivery fee: £{order.deliveryFee?.toFixed(2)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Address Line 1</label>
                <input 
                  type="text" 
                  placeholder="Street name and number"
                  className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none"
                  value={order.address}
                  onChange={e => setOrder(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none"
                value={order.deliveryDate}
                onChange={e => setOrder(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Time Window</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none"
                value={order.deliveryTimeSlot}
                onChange={e => setOrder(prev => ({ ...prev, deliveryTimeSlot: e.target.value }))}
              >
                <option value="">Select Time</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <button 
            disabled={!order.deliveryDate || !order.deliveryTimeSlot || !isPostcodeValid()}
            onClick={() => setStep(2)}
            className="w-full bg-pink-600 text-white p-4 rounded-xl mt-8 font-bold disabled:opacity-50 transition-opacity shadow-lg"
          >
            CONTINUE
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold text-slate-800 mb-6 font-serif">Customize Cake</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                Cake Inspiration
              </h3>
              <p className="text-xs text-slate-500 mb-4">Browse our gallery to pick a design or see size references.</p>
              
              <a 
                href={INSTAGRAM_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white font-bold text-sm mb-6 shadow-md hover:opacity-90 transition-opacity"
              >
                OPEN INSTAGRAM GALLERY
              </a>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">Instagram Link (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="Paste the post link here..."
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    value={order.inspirationLink || ''}
                    onChange={e => setOrder(prev => ({ ...prev, inspirationLink: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">Or Upload Screenshot</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[100px] p-4 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    {order.inspirationImage ? (
                      <div className="relative w-full rounded-lg overflow-hidden bg-white">
                        <img src={order.inspirationImage} alt="Preview" className="w-full h-auto block object-contain" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOrder(prev => ({ ...prev, inspirationImage: undefined })) }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Click to upload screenshot</span>
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
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Flavor</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none"
                value={order.flavor}
                onChange={e => setOrder(prev => ({ ...prev, flavor: e.target.value }))}
              >
                {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Size</label>
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map(s => (
                  <button 
                    key={s.label}
                    onClick={() => setOrder(prev => ({ ...prev, size: s.label }))}
                    className={`p-4 rounded-xl border text-left transition-all ${order.size === s.label ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white'}`}
                  >
                    <div className="text-sm font-bold">{s.label}</div>
                    <div className="text-xs text-slate-400">£{s.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Message on Cake</label>
                <button 
                  onClick={handleAiHelp}
                  disabled={loading}
                  className="text-xs font-bold text-pink-600 flex items-center gap-1 hover:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {loading ? 'Thinking...' : 'AI Suggestions'}
                </button>
              </div>
              <textarea 
                placeholder="Write your special message here..."
                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none h-24"
                value={order.messageOnCake}
                onChange={e => setOrder(prev => ({ ...prev, messageOnCake: e.target.value }))}
              />
              {aiSuggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiSuggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setOrder(prev => ({ ...prev, messageOnCake: s }))}
                      className="text-[10px] bg-pink-100 text-pink-700 px-2 py-1 rounded-full border border-pink-200"
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
            className="w-full bg-pink-600 text-white p-4 rounded-xl mt-8 font-bold shadow-lg"
          >
            VIEW SUMMARY
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold text-slate-800 mb-6 font-serif">Final Summary</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Contact Details</span>
              <div className="text-right flex flex-col items-end">
                <input 
                  type="text" placeholder="Your Name" 
                  className="block w-full text-right bg-transparent text-sm font-bold outline-none"
                  value={order.customerName || ''}
                  onChange={e => setOrder(prev => ({ ...prev, customerName: e.target.value }))}
                />
                <input 
                  type="tel" placeholder="Phone Number" 
                  className="block w-full text-right bg-transparent text-xs text-slate-500 outline-none"
                  value={order.phone || ''}
                  onChange={e => setOrder(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Flavor & Size</span>
              <span className="font-bold text-sm">{order.size} {order.flavor}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Method</span>
              <span className="font-bold text-sm">{order.fulfillmentType} ({order.deliveryDate} @ {order.deliveryTimeSlot})</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Cake Price</span>
                <span>£{SIZES.find(s => s.label === order.size)?.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>£{order.deliveryFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-pink-600">£{( (SIZES.find(s => s.label === order.size)?.price || 0) + (order.deliveryFee || 0) ).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button 
            disabled={!order.customerName || !order.phone}
            onClick={handleFinish}
            className="w-full bg-pink-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
          >
            PAY & PLACE ORDER
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderForm;
