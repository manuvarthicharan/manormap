import React, { useState } from 'react';
import { X, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Logo } from '../Common/Logo';
import { GoogleIcon } from '../Common/GoogleIcon';
import { signInWithGoogle, isSupabaseConfigured } from '../../services/supabaseClient';
import { saveUserProfile } from '../../services/userService';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess?: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  onSignInSuccess,
  actionTitle = 'Sign In to ManorMap',
  actionDescription = 'Sign in with your Google account to access full property records, cadastral boundaries, verified builder contacts, and to list your own real estate.'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await signInWithGoogle();
        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }
        // OAuth redirect will take over
      } else {
        // Fallback for development/offline mode
        saveUserProfile({
          id: `usr_${Date.now()}`,
          name: 'Verified User',
          email: 'user@manormap.in',
          isAuthenticated: true,
          authProvider: 'google'
        });
        if (onSignInSuccess) onSignInSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 text-center">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100 p-6 sm:p-7 space-y-5">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 pt-1">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-1">
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="flex justify-center">
              <Logo size="sm" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {actionTitle}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {actionDescription}
            </p>
          </div>

          {/* Value Highlights */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">Direct verified Owner & Builder phone contacts</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">Cadastral land parcel boundaries & acreages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">List custom properties with geolocation & photo upload</span>
            </div>
          </div>

          {/* Error notice if any */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center">
              {errorMsg}
            </div>
          )}

          {/* Google Sign In CTA */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-xl shadow-slate-900/15 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel and continue browsing map
            </button>
          </div>

          <div className="text-center pt-1 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit OAuth authentication &bull; Zero spam</span>
          </div>
        </div>
      </div>
    </div>
  );
};
