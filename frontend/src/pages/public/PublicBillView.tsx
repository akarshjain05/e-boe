import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileText, FileDown, ShieldCheck, MapPin, Building2 } from 'lucide-react';
import { publicService } from '../../api/services/public';
import { Bill } from '../../api/services/bills';
import { formatCurrency, formatDate } from '@/lib/utils';

export function PublicBillView() {
  const { token } = useParams<{ token: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadBill(token);
    }
  }, [token]);

  const loadBill = async (token: string) => {
    try {
      setLoading(true);
      const data = await publicService.getBill(token);
      setBill(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load bill. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    try {
      setAccepting(true);
      const data = await publicService.acceptBill(token);
      setBill(data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to accept bill');
    } finally {
      setAccepting(false);
    }
  };

  const handleDownload = async () => {
    if (!token) return;
    try {
      await publicService.downloadPdf(token);
    } catch (err: any) {
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Bill Not Found</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const isPending = bill.status === 'pending_acceptance';
  const isAccepted = bill.status === 'accepted' || bill.status === 'partially_paid' || bill.status === 'paid' || bill.status === 'overdue';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30">
      
      {/* Dynamic Header Banner */}
      <div className="h-48 bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-zinc-900/40 border-b border-zinc-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-8 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-sm border border-emerald-500/20">
              Bill of Exchange
            </div>
            {isPending && (
              <div className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-sm border border-amber-500/20 flex items-center gap-1">
                <Clock size={14} /> Action Required
              </div>
            )}
            {isAccepted && (
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-sm border border-blue-500/20 flex items-center gap-1">
                <CheckCircle size={14} /> Accepted
              </div>
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {formatCurrency(bill.total_amount)}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Header Section */}
          <div className="p-8 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Bill #{bill.bill_number}</h2>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Clock size={14} /> Issued: {formatDate(bill.issue_date)}</span>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1 text-rose-400"><Clock size={14} /> Due: {formatDate(bill.due_date)}</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={handleDownload}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
              >
                <FileDown size={18} />
                PDF
              </button>
              {isPending && (
                <button 
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-2 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {accepting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Accept Bill
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Drawer (Issuer) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Building2 size={16} /> Issued By (Drawer)
              </h3>
              <div>
                <div className="text-lg font-semibold text-zinc-100">{bill.drawer_name}</div>
                {bill.drawer_address && (
                  <div className="text-zinc-400 text-sm mt-1 flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>{bill.drawer_address}</span>
                  </div>
                )}
                {bill.drawer_state && (
                  <div className="text-zinc-400 text-sm mt-1 ml-5">{bill.drawer_state}</div>
                )}
              </div>
            </div>

            {/* Drawee (Customer) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                <ShieldCheck size={16} /> Issued To (Drawee)
              </h3>
              <div>
                <div className="text-lg font-semibold text-zinc-100">{bill.drawee_name}</div>
                {bill.drawee_address && (
                  <div className="text-zinc-400 text-sm mt-1 flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>{bill.drawee_address}</span>
                  </div>
                )}
                {bill.drawee_state && (
                  <div className="text-zinc-400 text-sm mt-1 ml-5">{bill.drawee_state}</div>
                )}
              </div>
            </div>

          </div>

          {/* Items Table */}
          <div className="p-8 bg-zinc-900/50 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Bill Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-300">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Description</th>
                    <th className="px-4 py-3">HSN/SAC</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Tax</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-4 py-4 font-medium text-zinc-200">{item.description}</td>
                      <td className="px-4 py-4">{item.hsn_code || '-'}</td>
                      <td className="px-4 py-4 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-4 text-right">{item.tax_rate}%</td>
                      <td className="px-4 py-4 text-right font-medium text-white">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-zinc-200">{formatCurrency(bill.amount)}</span>
                </div>
                {bill.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Discount</span>
                    <span className="text-emerald-400">-{formatCurrency(bill.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total Tax</span>
                  <span className="text-zinc-200">{formatCurrency(bill.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-zinc-800 pt-3">
                  <span className="text-white">Total Amount</span>
                  <span className="text-white">{formatCurrency(bill.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-600">
          <p>This is an officially generated electronic Bill of Exchange via the e-BoE platform.</p>
        </div>
      </div>
    </div>
  );
}
