import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  city: string;
  state: string;
  kycVerified: boolean;
  memberSince: string;
  panNumberMasked: string;
  authProvider?: 'google' | 'guest';
  isAuthenticated?: boolean;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&h=256&q=80'
];

const USER_STORAGE_KEY = 'radar_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_guest_demo',
  name: 'Rohith Polisetti',
  email: 'rohith@realtyradar.in',
  phone: '+91 98490 12345',
  role: 'Verified Property Owner & Investor',
  avatarUrl: DEFAULT_AVATARS[0],
  city: 'Hyderabad',
  state: 'Telangana',
  kycVerified: true,
  memberSince: 'March 2024',
  panNumberMasked: 'ABCDE****F',
  authProvider: 'guest',
  isAuthenticated: false
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('manormap_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.avatarUrl || parsed.avatarUrl.trim() === '') {
        parsed.avatarUrl = DEFAULT_AVATARS[0];
      }
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load user profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  try {
    const current = getUserProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save user profile', e);
    return DEFAULT_PROFILE;
  }
}

/**
 * Synchronize user profile when signed in via Supabase Google Auth
 */
export function syncProfileFromSupabaseUser(supabaseUser: User | null): UserProfile {
  if (!supabaseUser) {
    const current = getUserProfile();
    const guestProfile: UserProfile = {
      ...current,
      id: 'usr_guest_demo',
      authProvider: 'guest',
      isAuthenticated: false
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestProfile));
    return guestProfile;
  }

  const meta = supabaseUser.user_metadata || {};
  const googleName = meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'Google User';
  const googleAvatar = meta.avatar_url || meta.picture || DEFAULT_AVATARS[0];

  const current = getUserProfile();
  const authenticatedProfile: UserProfile = {
    ...current,
    id: supabaseUser.id,
    name: googleName,
    email: supabaseUser.email || current.email,
    avatarUrl: googleAvatar,
    authProvider: 'google',
    isAuthenticated: true,
    kycVerified: true
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedProfile));
  return authenticatedProfile;
}

export function cycleNextAvatar(currentUrl: string): string {
  const currentIndex = DEFAULT_AVATARS.indexOf(currentUrl);
  const nextIndex = (currentIndex + 1) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[nextIndex];
}
