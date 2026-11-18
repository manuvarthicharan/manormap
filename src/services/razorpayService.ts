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
  | 'seller_boost' 
  | 'due_diligence' 
  | 'agent_sub' 
  | 'legal_agreement';

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

// Available Business Model Plans
export const MONETIZATION_PLANS: MonetizationPlan[] = [
  // 1. Direct Owner Contact Unlocks (Buyer/Tenant Pass)
  {
    id: 'pass_starter_5',
    category: 'buyer_pass',
    title: '5 Owner Contacts Pass',
    badge: 'Starter',
    price: 499,
    originalPrice: 999,
    description: 'Directly connect with 5 verified property owners on WhatsApp & phone with zero brokerage.',
    features: [
      'Unlock 5 direct owner mobile numbers',
      'Instant direct WhatsApp chat button',
      'Zero brokerage guarantee',
      '30-day validity across all Indian cities'
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
    description: 'Comprehensive buyer & tenant pass with assisted calling and legal rental draft agreement.',
    features: [
      'Unlock 25 direct owner phone numbers & WhatsApp',
      'Assisted relationship manager call coordination',
      'Free customized legal rental / sale agreement draft',
      'Instant SMS alert when matching properties are listed',
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
    description: 'Unlimited owner unlocks for serious real estate investors and relocation professionals.',
    features: [
      'Unlimited owner phone numbers & WhatsApp for 90 days',
      'Priority access to newly listed distress/hot deals',
      'Dedicated relationship manager for site visits',
      'Comprehensive property comparison dossier',
      'VIP badge on your buyer inquiries'
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
    description: 'Boost your property to the top of map pins & locality search results with a glowing gold pin.',
    features: [
      'Golden glowing pin on live Google Satellite Map',
      'Ranked #1 in locality search results & list view',
      'Promoted badge: "⭐ Verified Featured Property"',
      'Promoted in AI Advisor recommendations',
      'Instant WhatsApp notifications for new buyer leads'
    ],
    durationDays: 30,
    isPopular: true
  },
  {
    id: 'boost_vip_90',
    category: 'seller_boost',
    title: '90-Day VIP Citywide Domination',
    badge: 'Max Inquiries',
    price: 2499,
    originalPrice: 4999,
    description: 'Guaranteed maximum buyer reach across the entire metropolitan area for 90 days.',
    features: [
      'Promoted across all adjacent localities & citywide search',
      'Top banner featured placement on ManorMap radar',
      'Video tour & layout plan highlighted in 3D card',
      'Direct WhatsApp inquiry lead capture widget',
      'Weekly buyer impression & click analytics report'
    ],
    durationDays: 90
  },

  // 3. Due Diligence Legal Report
  {
    id: 'report_dossier',
    category: 'due_diligence',
    title: 'Certified Land & Title Due Diligence Dossier',
    badge: '100% Title Safety',
    price: 1999,
    originalPrice: 3499,
    description: 'Official legal audit matching state land records (Bhu-Bharati, Dharani, Bhoomi) & RERA verification.',
    features: [
      'Pahani & ROR-1B Land Record ownership match',
      'Prohibited / Government land list cross-check',
      '30-Year Encumbrance Certificate (EC) audit',
      'HMDA / DTCP / BDA layout approval validation',
      'Certified downloadable PDF report with seal'
    ],
    durationDays: 365,
    isPopular: true
  },

  // 4. Pro Broker / Builder Subscription
  {
    id: 'agent_silver',
    category: 'agent_sub',
    title: 'Pro Agent Monthly Club',
    badge: 'Agent Pro',
    price: 1999,
    originalPrice: 3999,
    description: 'Essential toolkit for active real estate brokers and channel partners.',
    features: [
      'List up to 15 properties active simultaneously',
      'Official "Verified Channel Partner" badge',
      '50 direct buyer lead inquiries delivered monthly',
      'Dedicated agent profile page on ManorMap'
    ],
    durationDays: 30
  },
  {
    id: 'builder_gold',
    category: 'agent_sub',
    title: 'Enterprise Builder & Developer Suite',
    badge: 'Enterprise',
    price: 6999,
    originalPrice: 12999,
    description: 'Full-scale listing & lead engine for project builders and venture developers.',
    features: [
      'Unlimited property and plotted layout listings',
      'Custom project banner & branded virtual tour',
      'Direct API lead sync with your CRM (Salesforce / Zoho)',
      'Dedicated relationship account manager'
    ],
    durationDays: 30
  },

  // 5. Digital Rental Agreement & E-Stamp
  {
    id: 'legal_agreement_stamp',
    category: 'legal_agreement',
    title: 'Govt. E-Stamped Rental Agreement',
    badge: 'Legally Binding',
    price: 999,
    originalPrice: 1599,
    description: 'Legally valid residential/commercial rental agreement on official government stamp paper with Aadhaar e-sign.',
    features: [
      'Official state government e-stamp certificate included',
      'Lawyer-vetted legal agreement clauses',
      'Instant digital Aadhaar biometric e-sign for both parties',
      'Legally admissible in all Indian courts'
    ],
    durationDays: 365
  }
];

const LOCAL_STORAGE_TRANSACTIONS_KEY = 'manormap_razorpay_transactions_v1';
const LOCAL_STORAGE_UNLOCKED_CONTACTS_KEY = 'manormap_unlocked_contacts_v1';
const LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY = 'manormap_boosted_properties_v1';
const LOCAL_STORAGE_PURCHASED_REPORTS_KEY = 'manormap_purchased_reports_v1';
const LOCAL_STORAGE_ACTIVE_PASS_KEY = 'manormap_active_buyer_pass_v1';

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
   * Check if title due diligence report was purchased for property
   */
  hasPurchasedReport(propertyId: string): boolean {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PURCHASED_REPORTS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      return list.includes(propertyId);
    } catch {
      return false;
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
        } else if (plan.category === 'seller_boost' && propertyId) {
          const days = plan.durationDays || 30;
          const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          const raw = localStorage.getItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY);
          const dict = raw ? JSON.parse(raw) : {};
          dict[propertyId] = expires;
          localStorage.setItem(LOCAL_STORAGE_BOOSTED_PROPERTIES_KEY, JSON.stringify(dict));
          window.dispatchEvent(new CustomEvent('manormap_property_boosted', { detail: { propertyId } }));
        } else if (plan.category === 'due_diligence' && propertyId) {
          const raw = localStorage.getItem(LOCAL_STORAGE_PURCHASED_REPORTS_KEY);
          const list = raw ? JSON.parse(raw) : [];
          if (!list.includes(propertyId)) {
            list.push(propertyId);
            localStorage.setItem(LOCAL_STORAGE_PURCHASED_REPORTS_KEY, JSON.stringify(list));
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
