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
  Calculator,
  LogOut,
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
      alert(`Notice: ${error.message}`);
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181716]/50 backdrop-blur-xs transition-opacity duration-200 ease-out animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 left-0 w-[85vw] max-w-xs sm:max-w-sm bg-[#fbf9f6] dark:bg-[#181716] text-[#1c1917] dark:text-[#f5f5f4] border-r border-[#e7e5e4] dark:border-[#292524] shadow-[0_4px_24px_rgba(0,0,0,0.12)] flex flex-col h-[100dvh] z-50 transform transition duration-200 ease-out animate-in slide-in-from-left">
        
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-[#e7e5e4] dark:border-[#292524] flex-shrink-0">
          <Logo size="md" />

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xs text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-4 touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* User Profile Block */}
          <div className="p-3 rounded-xs bg-[#f5f2eb] dark:bg-[#211f1d] border border-[#e7e5e4] dark:border-[#292524] space-y-2.5">
            <div 
              onClick={() => handleAction('profile')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xs overflow-hidden border border-[#d6d3d1] dark:border-[#44403c] flex-shrink-0 relative">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] truncate">
                  {userProfile.name}
                </div>
                <div className="text-[11px] text-[#78716c] truncate">
                  {userProfile.email}
                </div>
              </div>
            </div>

            {/* Auth CTA */}
            {userProfile.authProvider === 'google' && userProfile.isAuthenticated ? (
              <div className="flex items-center justify-between pt-2 border-t border-[#e7e5e4] dark:border-[#292524] text-[11px]">
                <div className="flex items-center gap-1.5 text-[#78716c] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8b3a24]" />
                  <span>Google Account</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="text-[11px] font-mono text-[#8b3a24] hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#fbf9f6] dark:bg-[#181716] hover:bg-[#e7e5e4]/50 dark:hover:bg-[#292524] text-[#1c1917] dark:text-[#f5f5f4] text-xs font-medium rounded-xs border border-[#e7e5e4] dark:border-[#292524] transition-colors"
              >
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="space-y-4">
            {/* Discover */}
            <div>
              <div className="px-1 text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-1">
                Navigation
              </div>
              <button
                onClick={() => handleAction('map')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-xs font-medium transition-colors ${
                  activeOption === 'map'
                    ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917]'
                    : 'text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#8b3a24]" />
                <span>Map view</span>
              </button>
            </div>

            {/* Analysis */}
            <div>
              <div className="px-1 text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-1">
                Analysis
              </div>
              <button
                onClick={() => handleAction('investment-roi')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-[#78716c]" />
                  <span>Investment calculator</span>
                </div>
                <span className="font-mono text-[10px] text-[#8b3a24]">DCF</span>
              </button>
            </div>

            {/* Activity */}
            <div>
              <div className="px-1 text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-1">
                Activity
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleAction('my-properties')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#78716c]" />
                    <span>My listings</span>
                  </div>
                  {myPropertiesCount > 0 && (
                    <span className="font-mono text-[10px] text-[#8b3a24]">
                      {myPropertiesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleAction('favorites')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-[#78716c]" />
                    <span>Saved properties</span>
                  </div>
                  {favoritesCount > 0 && (
                    <span className="font-mono text-[10px] text-[#8b3a24]">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleAction('saved-searches')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-[#78716c]" />
                  <span>Saved searches</span>
                </button>

                <button
                  onClick={() => handleAction('notifications')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[#78716c]" />
                    <span>Alerts</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8b3a24]">2</span>
                </button>
              </div>
            </div>

            {/* Settings */}
            <div>
              <div className="px-1 text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-1">
                Preferences
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleAction('profile')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <User className="w-4 h-4 text-[#78716c]" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => handleAction('settings')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#78716c]" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => handleAction('help')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-[#78716c]" />
                  <span>Documentation</span>
                </button>

                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xs text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-[#8b3a24]" /> : <Moon className="w-4 h-4 text-[#78716c]" />}
                      <span>Appearance</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#78716c] capitalize">
                      {theme}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e7e5e4] dark:border-[#292524] bg-[#f5f2eb] dark:bg-[#211f1d] flex-shrink-0 text-left">
          <div className="text-[11px] text-[#78716c] font-mono">
            ManorMap • Indian cadastral & real estate engine
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideMenuDrawer;
