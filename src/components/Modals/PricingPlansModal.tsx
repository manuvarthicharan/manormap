import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  Download,
  Receipt
} from 'lucide-react';
import {
  MONETIZATION_PLANS,
  MonetizationPlan,
  MonetizationCategory,
  razorpayService,
  RazorpayTransaction,
  RAZORPAY_CONFIG
} from '../../services/razorpayService';
import { Property } from '../../types';

interface PricingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProperty?: Property | null;
  initialCategory?: MonetizationCategory;
  onPaymentSuccess?: (tx: RazorpayTransaction) => void;
}

export const PricingPlansModal: React.FC<PricingPlansModalProps> = ({
  isOpen,
  onClose,
  targetProperty,
  initialCategory = 'buyer_pass',
  onPaymentSuccess
}) => {
  const [activeCategory, setActiveCategory] = useState<MonetizationCategory>(initialCategory);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<RazorpayTransaction | null>(null);
  const [viewHistory, setViewHistory] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<RazorpayTransaction[]>([]);
  const [buyerPass, setBuyerPass] = useState(() => razorpayService.getActiveBuyerPass());
  const [spotlightCredits, setSpotlightCredits] = useState(() => razorpayService.getSpotlightCredits());

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (isOpen) {
      setTransactions(razorpayService.getTransactions());
      setCompletedTx(null);
      setBuyerPass(razorpayService.getActiveBuyerPass());
      setSpotlightCredits(razorpayService.getSpotlightCredits());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategoryPlans = MONETIZATION_PLANS.filter((p) => p.category === activeCategory);

  const handleSelectPlan = (plan: MonetizationPlan) => {
    setSelectedPlanId(plan.id);
  };

  const handleInitiatePayment = (plan: MonetizationPlan) => {
    setIsProcessing(true);
    razorpayService.openCheckout({
      plan,
      propertyId: targetProperty?.id,
      propertyTitle: targetProperty?.title,
      userName: 'Keerthi Charan',
      userEmail: 'charan@mapestate.in',
      userPhone: '+91 98490 12345',
      onSuccess: (tx) => {
        setIsProcessing(false);
        setCompletedTx(tx);
        setTransactions(razorpayService.getTransactions());
        setBuyerPass(razorpayService.getActiveBuyerPass());
        setSpotlightCredits(razorpayService.getSpotlightCredits());
        onPaymentSuccess?.(tx);
      },
      onDismiss: () => {
        setIsProcessing(false);
      },
      onError: (err) => {
        setIsProcessing(false);
        console.error('Payment error', err);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center font-sans antialiased bg-slate-900/75 p-3 sm:p-6"
      onClick={(e) => {
        // Click on empty space outside modal closes it immediately
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92dvh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="bg-slate-900 text-white px-5 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                Razorpay Verified Gateway
              </span>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Zero Commission Platform
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black tracking-tight mt-1">
              Monetization Plans & Owner Unlocks
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Secure payments powered by Razorpay with UPI, Credit/Debit cards & NetBanking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewHistory(!viewHistory)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{viewHistory ? 'View Plans' : 'Invoices'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= TARGET PROPERTY BANNER (IF APPLICABLE) ================= */}
        {targetProperty && !viewHistory && (
          <div className="bg-blue-50 border-b border-blue-100 px-5 sm:px-8 py-3 flex items-center justify-between gap-3 text-xs flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black flex-shrink-0">
                📍
              </div>
              <div className="truncate">
                <span className="font-bold text-slate-900 block truncate">
                  {targetProperty.title}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {targetProperty.area}, {targetProperty.city} &bull; {targetProperty.priceDisplay}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] uppercase flex-shrink-0">
              Target Property
            </span>
          </div>
        )}

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">

          {/* VIEW: COMPLETED SUCCESS RECEIPT */}
          {completedTx && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                  Payment Successful • Powered by Razorpay
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  ₹{completedTx.amount.toLocaleString('en-IN')} Received
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Transaction Reference ID: <span className="font-mono font-bold text-slate-900">{completedTx.id}</span>
                </p>
              </div>

              <div className="max-w-md mx-auto p-3.5 rounded-xl bg-white border border-emerald-100 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Activated:</span>
                  <span className="font-bold text-slate-900">{completedTx.planTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billed To:</span>
                  <span className="font-bold text-slate-900">{completedTx.userName} ({completedTx.userPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700 uppercase">Instant 100% Active</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompletedTx(null);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
                >
                  Continue to Property
                </button>
              </div>
            </div>
          )}

          {/* VIEW: TRANSACTION & INVOICE HISTORY */}
          {viewHistory && !completedTx && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base sm:text-lg text-slate-900">
                    Payment & Invoice History
                  </h4>
                  <p className="text-xs text-slate-500">
                    All transactions recorded through Razorpay Gateway (Key: {RAZORPAY_CONFIG.keyId}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewHistory(false)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  ← Back to Plans
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  No payment transactions found on this browser. Select a plan to make your first Razorpay payment!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{tx.planTitle}</span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                            {tx.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Ref: <span className="font-mono">{tx.id}</span> &bull; {new Date(tx.timestamp).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="text-base font-black text-blue-600">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Official Tax Invoice for ${tx.id}\nAmount: ₹${tx.amount}\nService: ${tx.planTitle}\nGST Included: 18%\nGateway: Razorpay (rzp_test_U1eiUsZq4Rv15v)`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: BUSINESS PLANS TABS & CARDS */}
          {!viewHistory && !completedTx && (
            <>
              {/* Active User Balances Banner */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-500">Buyer Pass:</span>
                  <span className="font-extrabold text-slate-900">
                    {buyerPass && buyerPass.contactsRemaining > 0
                      ? `${buyerPass.contactsRemaining} Owner Unlocks Left`
                      : '0 Unlocks Available'}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-300 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-500">Spotlight Credits:</span>
                  <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    {spotlightCredits} {spotlightCredits === 1 ? 'Credit' : 'Credits'} Available
                  </span>
                </div>
              </div>

              {/* Category Nav Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
                {[
                  { id: 'buyer_pass', label: '🔑 Buyer & Tenant Pass' },
                  { id: 'seller_boost', label: '⭐ Spotlight Boost (Map Pin Glow)' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(tab.id as MonetizationCategory);
                      setSelectedPlanId('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                      activeCategory === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCategoryPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`relative rounded-2xl border-2 p-5 flex flex-col justify-between transition-all cursor-pointer ${
                        plan.isPopular
                          ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                          : isSelected
                            ? 'border-slate-900 bg-white shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {plan.badge && (
                        <span className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          plan.isPopular ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-900 text-white'
                        }`}>
                          {plan.badge}
                        </span>
                      )}

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-black text-base text-slate-900">
                            {plan.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {plan.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          {plan.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{plan.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-emerald-600">
                            Save {Math.round(((plan.originalPrice! - plan.price) / plan.originalPrice!) * 100)}%
                          </span>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-2 pt-2 text-xs">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pay Button */}
                      <div className="pt-5 mt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiatePayment(plan);
                          }}
                          disabled={isProcessing}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] ${
                            plan.isPopular
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-900 hover:bg-black text-white'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay ₹{plan.price} with Razorpay</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust & Guarantee Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>
                    <strong>100% Zero Brokerage Guarantee:</strong> If the owner does not respond within 48 hours, contact credits are automatically refunded to your pass.
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 flex-shrink-0">
                  <span>Merchant: rzp_test_U1eiUsZq4Rv15v</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="bg-slate-50 px-5 sm:px-8 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>256-bit SSL Encrypted &bull; Razorpay Secure Payment</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
