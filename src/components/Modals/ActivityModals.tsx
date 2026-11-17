import React, { useState } from 'react';
import { Property } from '../../types';
import {
  X,
  Heart,
  Building2,
  Bookmark,
  Bell,
  User,
  HelpCircle,
  Trash2,
  ShieldCheck,
  MapPin,
  Navigation,
  RefreshCw,
  Edit2,
  Save,
  Check,
  LogOut
} from 'lucide-react';
import { Logo } from '../Common/Logo';
import { GoogleIcon } from '../Common/GoogleIcon';
import { getUserProfile, saveUserProfile, cycleNextAvatar, syncProfileFromSupabaseUser, UserProfile } from '../../services/userService';
import { signInWithGoogle, signOut, isSupabaseConfigured } from '../../services/supabaseClient';

interface ActivityModalProps {
  modalType: string | null;
  onClose: () => void;
  properties: Property[];
  favorites: string[];
  onSelectProperty: (prop: Property) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteProperty?: (id: string) => void;
  onSelectLocationCoords?: (coords: [number, number]) => void;
}

interface SavedSearchItem {
  id: string;
  title: string;
  sub: string;
  alert: string;
  coords: [number, number];
}

const DEFAULT_SAVED_SEARCHES: SavedSearchItem[] = [
  { id: 'ss-1', title: 'Gachibowli & Financial District', sub: '3 BHK, ₹1.5 Cr – ₹2.5 Cr', alert: 'Active Daily Alert', coords: [78.3512, 17.4385] },
  { id: 'ss-2', title: 'Indiranagar & Koramangala', sub: 'Penthouse & Luxury Villas', alert: 'Weekly Digest', coords: [77.6412, 12.9719] },
  { id: 'ss-3', title: 'Bandra West Sea-Facing', sub: '3+ BHK, Ready to Move', alert: 'Instant Alert', coords: [72.8258, 19.0596] }
];

export const ActivityModals: React.FC<ActivityModalProps> = ({
  modalType,
  onClose,
  properties,
  favorites,
  onSelectProperty,
  onToggleFavorite,
  onDeleteProperty,
  onSelectLocationCoords
}) => {
  // User Profile state
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [phoneInput, setPhoneInput] = useState(profile.phone);
  const [roleInput, setRoleInput] = useState(profile.role || 'Buyer / Investor');
  const [cityInput, setCityInput] = useState(profile.city || 'Hyderabad');
  const [stateInput, setStateInput] = useState(profile.state || 'Telangana');
  const [avatarUrlInput, setAvatarUrlInput] = useState(profile.avatarUrl);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const supabaseOnline = isSupabaseConfigured();

  // Saved Searches & Alerts state with localStorage persistence
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>(() => {
    try {
      const stored = localStorage.getItem('manormap_saved_searches');
      if (stored) return JSON.parse(stored);
    } catch { }
    return DEFAULT_SAVED_SEARCHES;
  });

  const handleDeleteSavedSearch = (id: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('manormap_saved_searches', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const handleGoogleSignIn = async () => {
    if (!supabaseOnline) {
      alert(
        'Supabase credentials are not yet configured in .env.\n\nPlease add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google OAuth and live cloud database storage.'
      );
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      alert(`Supabase Auth Error: ${error.message}`);
    }
  };

  const handleSignOutGoogle = async () => {
    await signOut();
    const updated = syncProfileFromSupabaseUser(null);
    setProfile(updated);
    window.location.reload();
  };

  if (!modalType || modalType === 'map' || modalType === 'settings') return null;

  const favoriteProps = properties.filter((p) => favorites.includes(p.id));
  const myListedProps = properties.filter(
    (p) => p.id.startsWith('custom-') || p.contact.name.includes(profile.name.split(' ')[0])
  );

  const handleCycleAvatar = () => {
    const nextUrl = cycleNextAvatar(profile.avatarUrl);
    const updated = saveUserProfile({ avatarUrl: nextUrl });
    setProfile(updated);
    setAvatarUrlInput(nextUrl);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUserProfile({
      name: nameInput.trim() || profile.name,
      email: emailInput.trim() || profile.email,
      phone: phoneInput.trim(),
      role: roleInput,
      city: cityInput.trim() || profile.city,
      state: stateInput.trim() || profile.state,
      avatarUrl: avatarUrlInput.trim() || profile.avatarUrl
    });
    setProfile(updated);
    setIsEditingProfile(false);
    setSaveSuccessMessage('Profile details updated successfully');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 text-center">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" variant="icon" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                {modalType === 'favorites' && (
                  <>
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>Saved Favorites ({favoriteProps.length})</span>
                  </>
                )}
                {modalType === 'my-properties' && (
                  <>
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>My Listed Properties ({myListedProps.length})</span>
                  </>
                )}
                {modalType === 'saved-searches' && (
                  <>
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span>Saved Localities & Alerts</span>
                  </>
                )}
                {modalType === 'notifications' && (
                  <>
                    <Bell className="w-4 h-4 text-blue-500" />
                    <span>Activity Notifications</span>
                  </>
                )}
                {modalType === 'profile' && (
                  <>
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Account Profile & Credentials</span>
                  </>
                )}
                {modalType === 'help' && (
                  <>
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Support & Portal Guide</span>
                  </>
                )}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 max-h-[calc(82vh-90px)] overflow-y-auto space-y-4">
            {/* FAVORITES */}
            {modalType === 'favorites' && (
              <div>
                {favoriteProps.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Heart className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-bold text-slate-700">No favorite properties saved yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click the heart icon on any property marker or preview card to bookmark it.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteProps.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          onSelectProperty(p);
                          onClose();
                        }}
                      >
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {p.priceDisplay}
                          </div>
                          <div className="text-xs font-medium text-slate-700 truncate">{p.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{p.area}, {p.city} &bull; {p.bhk} BHK</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProperty(p);
                              onClose();
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
                            title="Fly to location on map"
                          >
                            <Navigation className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(p.id);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY PROPERTIES */}
            {modalType === 'my-properties' && (
              <div>
                {myListedProps.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-bold text-slate-700">You haven't listed any properties yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click the "+ Add Property" button at the bottom of the map to drop a pin and publish your listing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myListedProps.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          onSelectProperty(p);
                          onClose();
                        }}
                      >
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {p.priceDisplay}
                          </div>
                          <div className="text-xs font-medium text-slate-700 truncate">{p.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{p.area}, {p.city} &bull; {p.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProperty(p);
                              onClose();
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
                            title="Fly to location on map"
                          >
                            <Navigation className="w-4 h-4" />
                          </button>
                          {onDeleteProperty && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProperty(p.id);
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                              title="Delete listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY PROFILE WITH AUTO AVATAR */}
            {modalType === 'profile' && (
              <div className="space-y-4">
                {saveSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>{saveSuccessMessage}</span>
                  </div>
                )}

                {/* Profile Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-100">
                  <div className="flex items-center gap-4">
                    {/* Auto Avatar with Cycle button */}
                    <div className="relative group flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 ring-4 ring-white shadow-md">
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={handleCycleAvatar}
                        title="Roll new auto avatar"
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
                      >
                        <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-extrabold text-slate-900">{profile.name}</h4>
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-xs text-slate-500">{profile.email}</div>
                      <div className="text-xs font-semibold text-slate-600">{profile.phone}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="self-start sm:self-center px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>

                {/* Edit Profile Form */}
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Edit Profile Information
                    </h5>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="name@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">I am a</label>
                        <select
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Buyer / Investor">Buyer / Investor</option>
                          <option value="Property Owner">Property Owner</option>
                          <option value="Real Estate Agent">Real Estate Agent</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                        <input
                          type="text"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Hyderabad"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">State</label>
                        <input
                          type="text"
                          value={stateInput}
                          onChange={(e) => setStateInput(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Telangana"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">Account Classification</span>
                      <span className="font-bold text-slate-800">{profile.role || 'Buyer / Investor'}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">Preferred Location</span>
                      <span className="font-bold text-slate-800">{profile.city || 'Hyderabad'}, {profile.state || 'Telangana'}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">Registered Mobile</span>
                      <span className="font-medium text-slate-800">{profile.phone || 'Not provided'}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">Saved Favorites</span>
                      <span className="font-bold text-rose-600">{favoriteProps.length} Shortlisted Properties</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">My Listed Properties</span>
                      <span className="font-bold text-blue-600">{myListedProps.length} Listed Properties</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">Member Since</span>
                      <span className="font-medium text-slate-600">{profile.memberSince || '2026'}</span>
                    </div>
                  </div>
                )}

                {/* Supabase Google Auth Connection Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                        <GoogleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Google Cloud Authentication</div>
                        <div className="text-[11px] text-slate-500">
                          {profile.authProvider === 'google' && profile.isAuthenticated
                            ? 'Logged in with verified Google account'
                            : 'Sign in to sync your listings and favorites across all devices'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {profile.authProvider === 'google' && profile.isAuthenticated ? (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-slate-700">{profile.email}</span>
                      </div>
                      <button
                        onClick={handleSignOutGoogle}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button
                        onClick={handleGoogleSignIn}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2"
                      >
                        <GoogleIcon className="w-4 h-4" />
                        <span>Continue with Google</span>
                      </button>
                      <span className="text-[11px] text-slate-500">
                        Secure instant sign-in & device synchronization
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SAVED SEARCHES */}
            {modalType === 'saved-searches' && (
              <div className="space-y-3">
                {savedSearches.length > 0 ? (
                  savedSearches.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{s.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{s.sub}</div>
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {s.alert}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onSelectLocationCoords && (
                          <button
                            onClick={() => {
                              onSelectLocationCoords(s.coords);
                              onClose();
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="View on Map"
                          >
                            <Navigation className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSavedSearch(s.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                    <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No saved localities or alerts</p>
                    <p className="text-[11px] text-slate-400 mt-1">Search any locality or micro-market to subscribe to instant alerts.</p>
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {modalType === 'notifications' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Price Appreciation Alert</span>
                    <span className="text-[10px] text-slate-400">2 hours ago</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Properties in Madhapur & Hitec City corridor rose by +14.2% YoY according to Q3 RERA market index.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">New Direct Inquiries</span>
                    <span className="text-[10px] text-slate-400">1 day ago</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    3 verified buyers viewed your listing in Financial District.
                  </p>
                </div>
              </div>
            )}

            {/* HELP & SUPPORT */}
            {modalType === 'help' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900">
                  <h4 className="font-bold mb-1">Welcome to Real Estate Discovery</h4>
                  <p className="text-[11px]">
                    A high-performance, map-first real estate discovery engine powered by Google Maps JavaScript API with interactive pin-drop placement.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-800 mb-0.5">How do I drop a pin to add my property?</div>
                    <p className="text-[11px] text-slate-500">
                      Click "+ Add Property" at the bottom of the map, then click "Drop Pin on Map". Pan the map until the center pin aligns with your building or land, then click "Set Pin Location Here". No coordinates needed!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-800 mb-0.5">How do I search for properties?</div>
                    <p className="text-[11px] text-slate-500">
                      Type any Indian city, area (e.g. Banjara Hills, Indiranagar, Bandra West), or 6-digit PIN code (e.g. 500081) into the top search bar, or tap one of the popular discovery pills.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-800 mb-0.5">How do photo links work?</div>
                    <p className="text-[11px] text-slate-500">
                      Paste direct web image URLs for your property photos. The platform validates and renders high-res live thumbnail previews before you publish.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModals;
