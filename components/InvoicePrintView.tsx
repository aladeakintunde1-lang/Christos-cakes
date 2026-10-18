import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Download, CheckCircle, ShieldCheck, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { getInvoiceById, getOwnerSettings, getLogoUrl } from '../utils/storage';
import { Invoice, OwnerProfile } from '../types';
import { PICKUP_ADDRESS, SHOP_POSTCODE, LOGO_URL } from '../constants';

export const InvoicePrintView: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<OwnerProfile>(getOwnerSettings());
  const [logo, setLogo] = useState<string>(getLogoUrl() || LOGO_URL);

  useEffect(() => {
    if (invoiceId) {
      const found = getInvoiceById(invoiceId);
      if (found) {
        setInvoice(found);
      }
    }
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md">
          <p className="text-xl font-serif text-slate-900 mb-4 font-bold">Invoice Not Found</p>
          <p className="text-sm text-slate-400 mb-6">The requested invoice ID could not be loaded.</p>
          <button
            onClick={() => navigate('/admin')}
            className="bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'Paid';

  return (
    <div className="min-h-screen bg-slate-100/60 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
      {/* Floating Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/admin')}
          className="text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print / Save to PDF
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2.5rem] border border-slate-200/80 overflow-hidden print:shadow-none print:border-none print:m-0 print:rounded-none print:max-w-full">
        {/* Top Decorative Stripe */}
        <div className="h-2.5 w-full bg-gradient-to-r from-pink-600 via-rose-500 to-pink-700 print:h-2" />

        <div className="p-8 sm:p-14 print:p-10 space-y-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 pb-10 border-b border-slate-100">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0">
                <img src={logo} alt="Atelier Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Christos Cakes</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-600 mt-1">Bespoke Luxury Atelier</p>
                <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                  <p>{ownerInfo.pickupAddress || PICKUP_ADDRESS}</p>
                  <p>{ownerInfo.shopPostcode || SHOP_POSTCODE}, United Kingdom</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block relative">
                <span className={`text-[11px] font-black uppercase px-4 py-1.5 rounded-full border tracking-widest ${
                  isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  invoice.status === 'Issued' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-3xl font-mono font-bold text-slate-900 mt-3">{invoice.invoiceNumber}</h2>
              <p className="text-xs text-slate-400 mt-1">Order Ref: <span className="font-mono font-bold text-slate-700">#{invoice.orderNumber}</span></p>
            </div>
          </div>

          {/* Bill To & Invoice Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 bg-slate-50/70 rounded-3xl border border-slate-100 print:bg-white print:border-slate-200">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
              <h3 className="text-xl font-serif font-bold text-slate-900 leading-tight">{invoice.customerName}</h3>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
                {invoice.customerAddress && <p className="text-slate-600 mt-1 whitespace-pre-line">{invoice.customerAddress}</p>}
              </div>
            </div>

            <div className="sm:text-right space-y-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Issue Date</p>
                <p className="text-sm font-bold text-slate-800">{new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Due / Event Date</p>
                <p className="text-sm font-bold text-pink-700">{new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-3xl overflow-hidden print:border-slate-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400 print:bg-slate-100">
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-4 text-center">Qty</th>
                  <th className="py-4 px-6 text-right">Unit Price</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30">
                    <td className="py-4 px-6 font-medium text-slate-800 leading-relaxed max-w-md">
                      {item.description}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700 font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-600">
                      £{(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                      £{(item.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & Bank Transfer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start pt-4">
            {/* Bank Details & Terms */}
            <div className="space-y-6">
              <div className="p-6 bg-pink-50/40 rounded-3xl border border-pink-100/60 print:bg-white print:border-pink-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-pink-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-pink-600" />
                  Bank Transfer Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Bank</span>
                    <span className="font-bold text-slate-800">{ownerInfo.bankName || 'Monzo Bank'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Account Name</span>
                    <span className="font-bold text-slate-800">{ownerInfo.accountName || 'Christianah Alade'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Sort Code</span>
                    <span className="font-mono font-bold text-slate-800">{ownerInfo.sortCode || '04-00-03'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Account Number</span>
                    <span className="font-mono font-bold text-slate-800">{ownerInfo.accountNumber || '90709406'}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-pink-100 text-[11px] text-pink-950">
                  <span className="font-bold">Payment Reference: </span>
                  <span className="font-mono font-bold">{invoice.invoiceNumber}</span> ({invoice.customerName})
                </div>
              </div>

              {invoice.paymentTerms && (
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">Terms & Conditions</span>
                  <p>{invoice.paymentTerms}</p>
                </div>
              )}
            </div>

            {/* Calculations Summary */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-2.5 print:bg-white print:border-slate-300">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">£{(invoice.subtotal || 0).toFixed(2)}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'})</span>
                  <span className="font-mono">-£{(invoice.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>VAT / Tax ({invoice.taxRate}%)</span>
                  <span className="font-mono">+£{(invoice.taxAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {invoice.deliveryCharge > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>White-Glove Delivery</span>
                  <span className="font-mono">£{(invoice.deliveryCharge || 0).toFixed(2)}</span>
                </div>
              )}

              {invoice.otherFees > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{invoice.otherFeesDescription || 'Additional Services'}</span>
                  <span className="font-mono">£{(invoice.otherFees || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-slate-900">
                <span className="text-sm font-black uppercase tracking-wider">Total Amount Due</span>
                <span className="text-2xl font-serif font-black text-pink-700">£{(invoice.total || 0).toFixed(2)}</span>
              </div>

              {isPaid && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs font-bold text-emerald-800">
                  ✓ This invoice has been marked as fully settled.
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400">
            <p className="font-serif italic text-slate-600 text-sm mb-1">
              "Every bespoke confection is crafted with patience, passion, and perfection."
            </p>
            <p>Christos Cakes Boutique · www.christoscakes.co.uk · enquiries@christoscakes.co.uk</p>
          </div>
        </div>
      </div>
    </div>
  );
};
