/**
 * Razorpay Payment Gateway & Real Estate Monetization Engine
 * Integration with Razorpay standard checkout SDK.
 * 
 * Credentials configured:
 * Key ID: rzp_test_U1eiUsZq4Rv15v
 * Key Secret: 88OtcJbbaIPIU1sLX2GDybV2
 */

import { notificationService } from './notificationService';

export const RAZORPAY_CONFIG = {
  keyId: 'rzp_test_U1eiUsZq4Rv15v',
  keySecret: '88OtcJbbaIPIU1sLX2GDybV2',
  currency: 'INR',
  companyName: 'ManorMap Real Estate Radar',
  themeColor: '#2563EB'
};

export type MonetizationCategory = 
  | 'buyer_pass' 
  | 'seller_boost';

export interface MonetizationPlan {
  id: string;
  category: MonetizationCategory;
  title: string;
  badge?: string;
  price: number; // in INR
  originalPrice?: number;
  description: string;
  features: string[];
  contactsIncluded?: number;
  boostsIncluded?: number;
  durationDays?: number;
  isPopular?: boolean;
}

export interface RazorpayTransaction {
  id: string; // Razorpay payment id (pay_xxx)
  orderId?: string;
  planId: string;
  planTitle: string;
  category: MonetizationCategory;
  amount: number; // in INR
  currency: string;
  timestamp: string;
  status: 'captured' | 'failed';
  propertyId?: string;
  propertyTitle?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
}

// Available Business Model Plans (Focused on High-Intent Indian Real Estate Transactions)
export const MONETIZATION_PLANS: MonetizationPlan[] = [
  // 1. Direct Owner Contact Unlocks (Buyer/Tenant Pass)
  {
    id: 'pass_starter_5',
    category: 'buyer_pass',
    title: '5 Owner Contacts Pass',
    badge: 'Starter',
    price: 499,
    originalPrice: 999,
    description: 'Directly view verified phone numbers & WhatsApp chat links of property owners with zero brokerage.',
    features: [
      'Unlock 5 direct owner mobile numbers & WhatsApp chats',
      'Instant direct calling button & chat prefill',
      'Zero brokerage guarantee across all listings',
      '30-day validity with rollover balance'
    ],
    contactsIncluded: 5,
    durationDays: 30
  },
  {
    id: 'pass_pro_25',
    category: 'buyer_pass',
    title: '25 Owner Contacts + Assisted Calling',
    badge: 'Most Popular',
    price: 1499,
    originalPrice: 2999,
    description: 'Comprehensive buyer & tenant pass with priority notifications and assisted calling.',
    features: [
      'Unlock 25 direct owner phone numbers & WhatsApp',
      'Assisted relationship manager call coordination',
      'Instant alert notifications when matching properties are listed',
      '60-day validity'
    ],
    contactsIncluded: 25,
    durationDays: 60,
    isPopular: true
  },
  {
    id: 'pass_unlimited_90',
    category: 'buyer_pass',
    title: 'Unlimited Investor Pass',
    badge: 'VIP Elite',
    price: 3999,
    originalPrice: 7999,
    description: 'Unlimited owner unlocks for active real estate investors and relocation clients.',
    features: [
      'Unlimited owner phone numbers & WhatsApp for 90 days',
      'Priority access to newly listed deals',
      'Dedicated relationship manager for site visit assistance',
      'VIP verified badge on your inquiries'
    ],
    contactsIncluded: 999,
    durationDays: 90
  },

  // 2. Seller & Broker Listing Boost
  {
    id: 'boost_spotlight_30',
    category: 'seller_boost',
    title: '30-Day Golden Spotlight Boost',
    badge: '10x Visibility',
    price: 999,
    originalPrice: 1999,
    description: 'Elevate your property to the top of map pins & locality search results with a glowing gold pin.',
    features: [
      'Golden glowing pin on live Google Satellite Map',
      'Ranked #1 in locality search results & list view',
      'Promoted badge: "⭐ Verified Spotlight Property"',
      'Instant WhatsApp notifications for new buyer leads',
      '1 Property Spotlight Boost included (30 Days)'
    ],
    boostsIncluded: 1,
    durationDays: 30,
    isPopular: true
  },
  {
    id: 'boost_vip_90',
    category: 'seller_boost',
    title: '3-Property Spotlight Multi-Pack',
    badge: 'Best Value',
    price: 2499,
    originalPrice: 4999,
    description: 'Multi-pack for property owners and brokers with multiple listings across the city.',
    features: [
      '3 Property Spotlight Boost credits included',
      'Golden glowing pins & #1 rank across all 3 properties',
      'High priority visibility on Google Hybrid map',
      '90-day multi-pack validity with on-demand activation',
      'Save 17% compared to individual boosts'
    ],
    boostsIncluded: 3,
    durationDays: 90
  }
];

const LOCAL_STORAGE_TRANSACTIONS_KEY = 'manormap_razorpay_transactions_v1';
const LOCAL_STORAGE_UNLOCKED_CONTACTS_KEY = 'manormap_unlocked_contacts_v1';
const LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY = 'manormap_boosted_properties_v1';
const LOCAL_STORAGE_ACTIVE_PASS_KEY = 'manormap_active_buyer_pass_v1';
const LOCAL_STORAGE_SPOTLIGHT_CREDITS_KEY = 'manormap_spotlight_credits_v1';

export const razorpayService = {
  /**
   * Get all recorded transactions
   */
  getTransactions(): RazorpayTransaction[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Record a new successful transaction
   */
  recordTransaction(tx: RazorpayTransaction): void {
    try {
      const current = this.getTransactions();
      const updated = [tx, ...current];
      localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updated));

      // Trigger update event
      window.dispatchEvent(new CustomEvent('manormap_payment_success', { detail: tx }));
    } catch {
      // ignore
    }
  },

  /**
   * Check if user has an active buyer pass
   */
  getActiveBuyerPass(): { planId: string; contactsRemaining: number; expiresAt: string } | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PASS_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (new Date(data.expiresAt).getTime() < Date.now()) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Check if contact is unlocked for a given property
   */
  isContactUnlocked(propertyId: string): boolean {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_UNLOCKED_CONTACTS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      return list.includes(propertyId);
    } catch {
      return false;
    }
  },

  /**
   * Unlock contact for a property using an active pass or deduct credit
   */
  unlockContact(propertyId: string): boolean {
    try {
      const pass = this.getActiveBuyerPass();
      if (!pass || pass.contactsRemaining <= 0) {
        return false;
      }

      // Add to unlocked list
      const raw = localStorage.getItem(LOCAL_STORAGE_UNLOCKED_CONTACTS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(propertyId)) {
        list.push(propertyId);
        localStorage.setItem(LOCAL_STORAGE_UNLOCKED_CONTACTS_KEY, JSON.stringify(list));
      }

      // Deduct credit if not unlimited
      if (pass.contactsRemaining < 900) {
        pass.contactsRemaining -= 1;
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PASS_KEY, JSON.stringify(pass));
      }

      window.dispatchEvent(new CustomEvent('manormap_contacts_updated', { detail: { propertyId } }));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get remaining Spotlight Boost credits
   */
  getSpotlightCredits(): number {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SPOTLIGHT_CREDITS_KEY);
      if (raw === null) return 1; // Starter complimentary credit for demonstration
      return Math.max(0, parseInt(raw, 10) || 0);
    } catch {
      return 0;
    }
  },

  /**
   * Add spotlight credits to balance
   */
  addSpotlightCredits(amount: number): number {
    try {
      const current = this.getSpotlightCredits();
      const updated = current + amount;
      localStorage.setItem(LOCAL_STORAGE_SPOTLIGHT_CREDITS_KEY, updated.toString());
      window.dispatchEvent(new CustomEvent('manormap_spotlight_credits_updated', { detail: { credits: updated } }));
      return updated;
    } catch {
      return 0;
    }
  },

  /**
   * Boost a property using 1 spotlight credit from balance
   */
  boostProperty(propertyId: string, durationDays: number = 30): boolean {
    try {
      const credits = this.getSpotlightCredits();
      if (credits <= 0) {
        return false;
      }
      const updatedCredits = credits - 1;
      localStorage.setItem(LOCAL_STORAGE_SPOTLIGHT_CREDITS_KEY, updatedCredits.toString());

      const expires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const raw = localStorage.getItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY);
      const dict: Record<string, string> = raw ? JSON.parse(raw) : {};
      dict[propertyId] = expires;
      localStorage.setItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY, JSON.stringify(dict));

      window.dispatchEvent(new CustomEvent('manormap_property_boosted', { detail: { propertyId, expires } }));
      window.dispatchEvent(new CustomEvent('manormap_spotlight_credits_updated', { detail: { credits: updatedCredits } }));

      notificationService.addNotification({
        title: '⭐ Property Boosted with Spotlight',
        message: 'Your property is now featured with #1 rank and a glowing gold pin on the map for 30 days.',
        type: 'system',
        propertyId
      });

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Force boost property (used on direct Razorpay payment)
   */
  forceBoostProperty(propertyId: string, durationDays: number = 30): void {
    try {
      const expires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const raw = localStorage.getItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY);
      const dict: Record<string, string> = raw ? JSON.parse(raw) : {};
      dict[propertyId] = expires;
      localStorage.setItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY, JSON.stringify(dict));
      window.dispatchEvent(new CustomEvent('manormap_property_boosted', { detail: { propertyId, expires } }));
    } catch {
      // ignore
    }
  },

  /**
   * Check if a property is boosted to Featured / Spotlight
   */
  isPropertyBoosted(propertyId: string): boolean {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY);
      const dict: Record<string, string> = raw ? JSON.parse(raw) : {};
      const exp = dict[propertyId];
      if (!exp) return false;
      return new Date(exp).getTime() > Date.now();
    } catch {
      return false;
    }
  },

  /**
   * Get all actively boosted property IDs
   */
  getBoostedPropertyIds(): string[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY);
      const dict: Record<string, string> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      return Object.entries(dict)
        .filter(([_, exp]) => new Date(exp).getTime() > now)
        .map(([id]) => id);
    } catch {
      return [];
    }
  },

  /**
   * Initiate Razorpay standard checkout dialog
   */
  async openCheckout(options: {
    plan: MonetizationPlan;
    propertyId?: string;
    propertyTitle?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    onSuccess: (tx: RazorpayTransaction) => void;
    onDismiss?: () => void;
    onError?: (err: any) => void;
  }): Promise<void> {
    const {
      plan,
      propertyId,
      propertyTitle,
      userName = 'Keerthi Charan',
      userEmail = 'charan@manormap.in',
      userPhone = '+91 98490 12345',
      onSuccess,
      onDismiss,
      onError
    } = options;

    // Check if Razorpay is loaded on window
    if (typeof (window as any).Razorpay === 'undefined') {
      console.warn('Razorpay SDK not yet loaded from script. Attempting dynamic load...');
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay Checkout script'));
          document.body.appendChild(script);
        });
      } catch (err) {
        console.error(err);
        onError?.(err);
        return;
      }
    }

    const cleanPhone = userPhone.replace(/[^0-9]/g, '').slice(-10);

    const rzpOptions = {
      key: RAZORPAY_CONFIG.keyId,
      amount: plan.price * 100, // Amount in paise
      currency: RAZORPAY_CONFIG.currency,
      name: RAZORPAY_CONFIG.companyName,
      description: `${plan.title} — ${plan.description.slice(0, 80)}`,
      image: '/logo.png',
      handler: (response: any) => {
        const paymentId = response.razorpay_payment_id || `pay_test_${Date.now()}`;
        const orderId = response.razorpay_order_id || `order_${Date.now()}`;

        const tx: RazorpayTransaction = {
          id: paymentId,
          orderId: orderId,
          planId: plan.id,
          planTitle: plan.title,
          category: plan.category,
          amount: plan.price,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          status: 'captured',
          propertyId,
          propertyTitle,
          userName,
          userEmail,
          userPhone
        };

        // 1. Record transaction
        this.recordTransaction(tx);

        // 2. Activate specific monetization feature
        if (plan.category === 'buyer_pass') {
          const days = plan.durationDays || 30;
          const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_PASS_KEY, JSON.stringify({
            planId: plan.id,
            contactsRemaining: plan.contactsIncluded || 5,
            expiresAt: expires
          }));

          // If a propertyId was passed, automatically unlock that property now
          if (propertyId) {
            this.unlockContact(propertyId);
          }
        } else if (plan.category === 'seller_boost') {
          const boosts = plan.boostsIncluded || 1;
          const days = plan.durationDays || 30;
          if (propertyId && propertyId !== 'general') {
            this.forceBoostProperty(propertyId, days);
            if (boosts > 1) {
              this.addSpotlightCredits(boosts - 1);
            }
          } else {
            this.addSpotlightCredits(boosts);
          }
        }

        // 3. Trigger user notification
        notificationService.addNotification({
          title: `Payment Successful: ₹${plan.price}`,
          message: `Your payment for ${plan.title} was completed via Razorpay (Ref: ${paymentId}). All benefits are active immediately.`,
          type: 'system',
          propertyId: propertyId
        });

        // 4. Invoke success callback
        onSuccess(tx);
      },
      prefill: {
        name: userName,
        email: userEmail,
        contact: cleanPhone ? `+91${cleanPhone}` : '+919849012345'
      },
      notes: {
        plan_id: plan.id,
        property_id: propertyId || 'general',
        monetization_category: plan.category
      },
      theme: {
        color: RAZORPAY_CONFIG.themeColor
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
        }
      }
    };

    try {
      const rzpInstance = new (window as any).Razorpay(rzpOptions);
      rzpInstance.on('payment.failed', (failRes: any) => {
        console.error('Razorpay payment failed:', failRes.error);
        notificationService.addNotification({
          title: 'Payment Incomplete',
          message: failRes.error?.description || 'Your Razorpay payment could not be completed. No amount was deducted.',
          type: 'system'
        });
        onError?.(failRes.error);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Failed to open Razorpay instance:', err);
      onError?.(err);
    }
  }
};
