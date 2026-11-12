import React from 'react';
import { X, Lock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Logo } from '../Common/Logo';
import { GoogleIcon } from '../Common/GoogleIcon';
import { signInWithGoogle, isSupabaseConfigured } from '../../services/supabaseClient';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'add_property' | 'view_details' | 'general';
  propertyTitle?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  reason,
  propertyTitle
}) => {
  if (!isOpen) return null;

  const supabaseOnline = isSupabaseConfigured();

  const handleGoogleSignIn = async () => {
    if (!supabaseOnline) {
      alert(
        'Supabase is not configured yet. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
      );
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      alert(`Sign in error: ${error.message}`);
    }
  };

  const isAdding = reason === 'add_property';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 text-center">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100 p-6 space-y-5">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Logo size="xs" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Sign In Required
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                {isAdding ? 'Sign In to List Property' : 'Sign In to View Property Details'}
              </h3>
            </div>
          </div>

          {/* Context Explanation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            {isAdding ? (
              <p className="leading-relaxed">
                To list a residential home, villa, or agricultural land with surveyed parcel borders, please sign in with your Google account.
              </p>
            ) : (
              <p className="leading-relaxed">
                {propertyTitle ? (
                  <>
                    To view full architectural specifications, verified seller contacts, and legal documents for{' '}
                    <strong className="text-slate-900">"{propertyTitle}"</strong>, please sign in.
                  </>
                ) : (
                  'To view verified builder contacts, cadastral parcel maps, EMI schedules, and AI livability audits, please sign in with your Google account.'
                )}
              </p>
            )}

            <div className="space-y-1.5 pt-1 text-[11px] text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Verified Owner & Builder direct contact info</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Full RERA registration IDs & cadastral border reports</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Save favorites & list unlimited properties</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Continue Browsing Map
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Supabase OAuth 2.0 • Zero spam policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
