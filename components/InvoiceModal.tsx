import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  CheckCircle, 
  Printer, 
  FileText, 
  Percent, 
  Truck, 
  DollarSign, 
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';
import { saveInvoice, generateInvoiceNumber } from '../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice: Invoice;
  onInvoiceSaved: (invoice: Invoice) => void;
  onViewPrint?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialInvoice,
  onInvoiceSaved,
  onViewPrint
}) => {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    setInvoice(initialInvoice);
    setFeedback({ type: null, message: '' });
  }, [initialInvoice, isOpen]);

  if (!isOpen) return null;

  // Auto-recalculate totals
  const recalculateTotals = (
    items: InvoiceItem[],
    taxRate: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number,
    deliveryCharge: number,
    otherFees: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * (Number(discountValue) / 100)) 
      : Math.min(subtotal, Number(discountValue));
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = discountedSubtotal * (Number(taxRate) / 100);
    const total = Math.max(0, discountedSubtotal + taxAmount + Number(deliveryCharge) + Number(otherFees));

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoice.items];
    const targetItem = { ...newItems[index], [field]: value };
    targetItem.total = Number(targetItem.quantity || 0) * Number(targetItem.unitPrice || 0);
    newItems[index] = targetItem;

    const calc = recalculateTotals(
      newItems,
      invoice.taxRate,
      invoice.discountType,
      invoice.discountValue,
      invoice.deliveryCharge,
      invoice.otherFees
    );

    setInvoice(prev => ({
      ...prev,
      items: newItems,
      ...calc
    }));
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: 'item_' + Date.now(),
      description: 'Artisanal Custom Element / Add-on',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    const newItems = [...invoice.items, newItem];
    const calc = recalculateTotals(
      newItems,
      invoice.taxRate,
      invoice.discountType,
      invoice.discountValue,
      invoice.deliveryCharge,
      invoice.otherFees
    );
    setInvoice(prev => ({ ...prev, items: newItems, ...calc }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    const calc = recalculateTotals(
      newItems,
      invoice.taxRate,
      invoice.discountType,
      invoice.discountValue,
      invoice.deliveryCharge,
      invoice.otherFees
    );
    setInvoice(prev => ({ ...prev, items: newItems, ...calc }));
  };

  const handleRateOrFeeChange = (
    field: 'taxRate' | 'discountType' | 'discountValue' | 'deliveryCharge' | 'otherFees' | 'otherFeesDescription',
    value: any
  ) => {
    const updated = { ...invoice, [field]: value };
    const calc = recalculateTotals(
      updated.items,
      Number(updated.taxRate || 0),
      updated.discountType,
      Number(updated.discountValue || 0),
      Number(updated.deliveryCharge || 0),
      Number(updated.otherFees || 0)
    );
    setInvoice({ ...updated, ...calc });
  };

  const handleSave = async (targetStatus: InvoiceStatus) => {
    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    const finalInvoice: Invoice = {
      ...invoice,
      status: targetStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await saveInvoice(finalInvoice);
      setIsSaving(false);
      if (res.success) {
        setInvoice(res.invoice);
        onInvoiceSaved(res.invoice);
        setFeedback({
          type: 'success',
          message: targetStatus === 'Issued' 
            ? `✓ Invoice ${res.invoice.invoiceNumber} issued and sent to client & owner!` 
            : `✓ Invoice saved as ${targetStatus}.`
        });
        setTimeout(() => {
          if (targetStatus === 'Issued') onClose();
        }, 1800);
      } else {
        setFeedback({ type: 'error', message: 'Failed to save invoice.' });
      }
    } catch (err: any) {
      setIsSaving(false);
      setFeedback({ type: 'error', message: err.message || 'Error saving invoice' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-pink-50/50 via-white to-rose-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-700 shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  {invoice.status === 'Draft' ? 'Invoice Editor' : 'Invoice Details'}
                </h2>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider ${
                  invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  invoice.status === 'Issued' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {invoice.invoiceNumber} · Linked Order #{invoice.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewPrint && (
              <button
                type="button"
                onClick={() => onViewPrint(invoice)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                title="Print or Save PDF"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-3 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {feedback.message && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-medium ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Top Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50/70 rounded-3xl border border-slate-100">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invoice Number</label>
              <input
                type="text"
                className="w-full p-3 bg-white rounded-xl border border-slate-200 font-mono font-bold text-xs text-slate-900 outline-none focus:border-pink-300"
                value={invoice.invoiceNumber}
                onChange={e => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Issue Date</label>
              <input
                type="date"
                className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-pink-300"
                value={invoice.issueDate}
                onChange={e => setInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
              <input
                type="date"
                className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-pink-300"
                value={invoice.dueDate}
                onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invoice Status</label>
              <select
                className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-pink-300"
                value={invoice.status}
                onChange={e => setInvoice(prev => ({ ...prev, status: e.target.value as InvoiceStatus }))}
              >
                <option value="Draft">Draft (Internal)</option>
                <option value="Issued">Issued (Client Sent)</option>
                <option value="Paid">Paid (Settled)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="p-6 bg-pink-50/30 rounded-3xl border border-pink-100/60">
            <h3 className="text-xs font-black uppercase text-pink-900 tracking-wider mb-4 flex items-center gap-2">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Name</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none"
                  value={invoice.customerName}
                  onChange={e => setInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                  value={invoice.customerEmail}
                  onChange={e => setInvoice(prev => ({ ...prev, customerEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                  value={invoice.customerPhone}
                  onChange={e => setInvoice(prev => ({ ...prev, customerPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Itemized Order Specifications & Services
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-pink-600 hover:text-pink-800 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-pink-50 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Item / Service
              </button>
            </div>

            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6 w-1/2">Description / Specification</th>
                    <th className="py-4 px-4 text-center w-20">Qty</th>
                    <th className="py-4 px-4 text-right w-32">Unit Price (£)</th>
                    <th className="py-4 px-4 text-right w-32">Total (£)</th>
                    <th className="py-4 px-4 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 px-6">
                        <textarea
                          rows={2}
                          className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-pink-300 outline-none text-xs font-medium text-slate-800 resize-none"
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        />
                      </td>
                      <td className="p-4 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          className="w-16 p-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-center text-xs font-bold outline-none"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td className="p-4 px-4 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 p-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-right text-xs font-bold outline-none font-mono"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-4 px-4 text-right font-mono font-bold text-slate-900">
                        £{(item.total || 0).toFixed(2)}
                      </td>
                      <td className="p-4 px-4 text-center">
                        {invoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Fees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Notes & Terms */}
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Atelier Notes</label>
                <textarea
                  rows={3}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 outline-none"
                  value={invoice.notes}
                  onChange={e => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Terms</label>
                <textarea
                  rows={2}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 outline-none"
                  value={invoice.paymentTerms}
                  onChange={e => setInvoice(prev => ({ ...prev, paymentTerms: e.target.value }))}
                />
              </div>
            </div>

            {/* Calculations Panel */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-600 pb-2 border-b border-slate-200">
                <span>Line Items Subtotal</span>
                <span className="font-mono">£{(invoice.subtotal || 0).toFixed(2)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center gap-2">
                  <span>Discount</span>
                  <select
                    className="p-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold"
                    value={invoice.discountType}
                    onChange={e => handleRateOrFeeChange('discountType', e.target.value as any)}
                  >
                    <option value="percentage">% Percent</option>
                    <option value="fixed">£ Fixed</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span>-</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-16 p-1 bg-white rounded border border-slate-200 text-right text-xs font-bold"
                    value={invoice.discountValue}
                    onChange={e => handleRateOrFeeChange('discountValue', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-slate-400 text-[10px]">(-£{(invoice.discountAmount || 0).toFixed(2)})</span>
                </div>
              </div>

              {/* Tax / VAT */}
              <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center gap-2">
                  <span>Tax / VAT Rate (%)</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="w-16 p-1 bg-white rounded border border-slate-200 text-right text-xs font-bold"
                    value={invoice.taxRate}
                    onChange={e => handleRateOrFeeChange('taxRate', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-slate-400 text-[10px]">(+£{(invoice.taxAmount || 0).toFixed(2)})</span>
                </div>
              </div>

              {/* Delivery Charge */}
              <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-slate-400" />
                  <span>White-Glove Delivery Fee</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span>£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-20 p-1 bg-white rounded border border-slate-200 text-right text-xs font-bold"
                    value={invoice.deliveryCharge}
                    onChange={e => handleRateOrFeeChange('deliveryCharge', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Other Fees */}
              <div className="flex items-center justify-between text-xs text-slate-600 gap-2 pt-1 border-t border-slate-200">
                <div className="flex items-center gap-2 flex-1">
                  <span>Other Fees / Add-on</span>
                  <input
                    type="text"
                    placeholder="e.g. Stand rental / Cake topper"
                    className="p-1 px-2 bg-white rounded border border-slate-200 text-[10px] flex-1"
                    value={invoice.otherFeesDescription || ''}
                    onChange={e => handleRateOrFeeChange('otherFeesDescription', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span>£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-20 p-1 bg-white rounded border border-slate-200 text-right text-xs font-bold"
                    value={invoice.otherFees}
                    onChange={e => handleRateOrFeeChange('otherFees', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="text-sm font-black uppercase text-slate-900 tracking-wider">Total Invoice Amount</span>
                <span className="text-2xl font-serif font-black text-pink-700">£{(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 px-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-400 font-medium">
            Status: <span className="font-bold text-slate-700">{invoice.status}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSave('Draft')}
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-white border border-slate-300 hover:border-slate-400 text-slate-700 py-3 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave('Paid')}
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Paid
            </button>

            <button
              type="button"
              onClick={() => handleSave('Issued')}
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-pink-600 hover:bg-pink-700 text-white py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {invoice.status === 'Issued' ? 'Update & Re-Issue' : 'Issue Invoice to Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
