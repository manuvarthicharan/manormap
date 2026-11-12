import React, { useEffect } from 'react';
import {
  X,
  Compass,
  Building2,
  Heart,
  Bookmark,
  Bell,
  User,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Calculator,
  LogOut,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { Logo } from '../Common/Logo';
import { GoogleIcon } from '../Common/GoogleIcon';
import { getUserProfile, syncProfileFromSupabaseUser } from '../../services/userService';
import { signInWithGoogle, signOut, isSupabaseConfigured } from '../../services/supabaseClient';

interface SlideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (optionKey: string) => void;
  activeOption: string;
  myPropertiesCount: number;
  favoritesCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const SlideMenuDrawer: React.FC<SlideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  activeOption,
  myPropertiesCount,
  favoritesCount,
  theme = 'light',
  onToggleTheme
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userProfile = getUserProfile();
  const supabaseOnline = isSupabaseConfigured();

  const handleAction = (key: string) => {
    onSelectOption(key);
    onClose();
  };

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supabaseOnline) {
      handleAction('profile');
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      alert(`Supabase Auth Notice: ${error.message}`);
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await signOut();
    syncProfileFromSupabaseUser(null);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop (closes on click) */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 left-0 w-[85vw] max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col h-[100dvh] z-50 transform transition duration-300 ease-out animate-in slide-in-from-left">
        {/* Sticky Top Header Bar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0 bg-white">
          <Logo size="md" />

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body: Entire content scrolls smoothly with momentum */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-4 touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* User Profile & Supabase Google Auth Card */}
          <div className="space-y-2">
            <div 
              onClick={() => handleAction('profile')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-100 transition-colors flex items-center gap-3 group"
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-blue-500/20 shadow-sm flex-shrink-0 relative">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {userProfile.authProvider === 'google' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center p-0.5">
                    <GoogleIcon className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {userProfile.name}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {userProfile.email}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Supabase Google Auth Action Button */}
            {userProfile.authProvider === 'google' && userProfile.isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span>Google Cloud Synced</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="text-[10px] font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            )}

            {/* Supabase Database Architecture Status Pill */}
            <div className="px-2.5 py-1 rounded-lg bg-slate-100/80 flex items-center justify-between text-[10px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-blue-600" />
                <span>Supabase PostGIS</span>
              </div>
              <span className={`font-bold flex items-center gap-1 ${
                supabaseOnline ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  supabaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                }`} />
                {supabaseOnline ? 'Cloud Connected' : 'Ready for Setup'}
              </span>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-4">
            {/* DISCOVER */}
            <div>
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Discover
              </div>
              <button
                onClick={() => handleAction('map')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  activeOption === 'map'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Explore Map</span>
              </button>
            </div>

            {/* INTELLIGENCE & ANALYSIS */}
            <div>
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Intelligence & Analysis
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleAction('investment-roi')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>ROI & Buy vs Rent</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    DCF
                  </span>
                </button>
              </div>
            </div>

            {/* MY ACTIVITY */}
            <div>
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                My Activity
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleAction('my-properties')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>My Properties</span>
                  </div>
                  {myPropertiesCount > 0 && (
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {myPropertiesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleAction('favorites')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Favorites</span>
                  </div>
                  {favoritesCount > 0 && (
                    <span className="text-[11px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleAction('saved-searches')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-slate-500" />
                  <span>Saved Searches</span>
                </button>

                <button
                  onClick={() => handleAction('notifications')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span>Notifications</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                    2 NEW
                  </span>
                </button>
              </div>
            </div>

            {/* ACCOUNT & SETTINGS */}
            <div>
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Account & Preferences
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleAction('profile')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => handleAction('settings')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Settings & Map Source</span>
                </button>

                <button
                  onClick={() => handleAction('help')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Help & Support</span>
                </button>

                {/* Theme Mode Toggle (Light / Dark) */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Theme Appearance</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg capitalize">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Attribution Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex-shrink-0 text-center">
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <div className="font-bold text-slate-700">Real Estate Discovery Platform</div>
            <div>Google Maps JavaScript API &bull; PostGIS Spatial Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
};
