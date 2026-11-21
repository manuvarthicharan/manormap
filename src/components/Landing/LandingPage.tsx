import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  CloudRain,
  Columns2,
  Compass,
  FileSearch,
  Home,
  Leaf,
  ListChecks,
  Map,
  MapPin,
  MapPinned,
  Menu,
  MessageSquare,
  PhoneCall,
  Route,
  ScanLine,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Trees,
  Waves,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { GoogleIcon } from '../Common/GoogleIcon';
import { signInWithGoogle, isSupabaseConfigured } from '../../services/supabaseClient';
import { saveUserProfile } from '../../services/userService';
import { Loader2 } from 'lucide-react';

export interface LandingPageProps {
  onEnterApp: () => void;
  onOpenListing?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenListing,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authActionReason, setAuthActionReason] = useState<'open-map' | 'list-land'>('open-map');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpenAuth = (reason: 'open-map' | 'list-land' = 'open-map') => {
    setAuthActionReason(reason);
    setAuthError(null);
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase is not configured yet. Please check your credentials in .env.');
      setIsAuthenticating(false);
      return;
    }
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setAuthError(error.message);
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error');
      setIsAuthenticating(false);
    }
  };

  const handleDemoSignIn = () => {
    saveUserProfile({
      name: 'MapEstate Explorer',
      email: 'explorer@mapestate.com',
      authProvider: 'google',
      isAuthenticated: true
    });
    setIsAuthModalOpen(false);
    if (authActionReason === 'list-land' && onOpenListing) {
      onOpenListing();
    } else {
      onEnterApp();
    }
  };

  // Scroll listener for sticky header
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 16);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Staggered scroll-reveal animations & Ambient background color shifts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Reveal elements on scroll
    const reveals = container.querySelectorAll('.reveal');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, {
        root: container,
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px'
      });

      reveals.forEach(el => revealObserver.observe(el));
    }

    // 2. Ambient background transitions
    const bgSections = container.querySelectorAll('section[data-bg]');
    if ('IntersectionObserver' in window && bgSections.length > 0) {
      const bgObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const targetBg = entry.target.getAttribute('data-bg');
            if (targetBg && container) {
              container.style.backgroundColor = targetBg;
            }
          }
        });
      }, {
        root: container,
        rootMargin: '-35% 0px -35% 0px',
        threshold: 0
      });

      bgSections.forEach(s => bgObserver.observe(s));
    }
  }, []);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalType) setModalType(null);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalType, mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    if (id === 'top') {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = containerRef.current?.querySelector(`#${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const modalContent: Record<string, { title: string; body: string; action: string; onAction: () => void }> = {
    privacy: {
      title: 'Privacy Overview',
      body: 'MapEstate only displays the land details and contact information that property owners choose to publish on the platform.',
      action: 'Understood',
      onAction: () => setModalType(null),
    },
    terms: {
      title: 'Terms Overview',
      body: 'MapEstate provides AI guidance and property risk scans to help you evaluate land clearly. Buyers and sellers are responsible for verifying official ownership records before completing any transaction.',
      action: 'Understood',
      onAction: () => setModalType(null),
    },
  };

  const activeModalConfig = modalType ? modalContent[modalType] : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-700 font-sans"
    >


  {/*  =====================================================================
       STICKY GLASSMORPHIC NAVIGATION BAR
       =====================================================================  */}
  <header id="site-header" className={`sticky top-0 z-40 w-full transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm" : "bg-white/75 border-b border-transparent"}`}>
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main navigation">
      {/*  Brand Logo & Wordmark  */}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); scrollToSection('top'); }}
        className="flex items-center gap-2.5 rounded-lg group"
      >
        <img
          src={logoImg}
          alt="MapEstate"
          className="h-8 sm:h-9 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
      </a>

      {/*  Center Navigation Links (Desktop)  */}
      <div className="hidden md:flex items-center gap-8">
        <a href="#ai-guide" onClick={(e) => { e.preventDefault(); scrollToSection("ai-guide"); setMobileMenuOpen(false); }} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">AI Guide</a>
        <a href="#property-scan" onClick={(e) => { e.preventDefault(); scrollToSection("property-scan"); setMobileMenuOpen(false); }} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Property Scan</a>
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); setMobileMenuOpen(false); }} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
        <a href="#who-its-for" onClick={(e) => { e.preventDefault(); scrollToSection("who-its-for"); setMobileMenuOpen(false); }} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Who It's For</a>
      </div>

      {/*  Right Actions (Desktop)  */}
      <div className="hidden md:flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleOpenAuth("open-map")}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-soft cursor-pointer"
        >
          <span>Open MapEstate</span>
          <ArrowRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
        </button>
      </div>

      {/*  Mobile Hamburger Toggle  */}
      <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="md:hidden inline-flex items-center justify-center p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-slate-900" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5 text-slate-900" aria-hidden="true" />
          )}
        </button>
    </nav>

    {/*  Mobile Slide-Down Navigation Drawer  */}
    <div id="mobile-menu-drawer" className={`md:hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 ${mobileMenuOpen ? "block" : "hidden"}`}>
      <div>
        <div className="px-4 pt-2 pb-5 space-y-1">
          <a href="#ai-guide" onClick={(e) => { e.preventDefault(); scrollToSection("ai-guide"); setMobileMenuOpen(false); }} className="mobile-nav-link block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">AI Guide</a>
          <a href="#property-scan" onClick={(e) => { e.preventDefault(); scrollToSection("property-scan"); setMobileMenuOpen(false); }} className="mobile-nav-link block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">Property Scan</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); setMobileMenuOpen(false); }} className="mobile-nav-link block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">How It Works</a>
          <a href="#who-its-for" onClick={(e) => { e.preventDefault(); scrollToSection("who-its-for"); setMobileMenuOpen(false); }} className="mobile-nav-link block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">Who It's For</a>
          <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenAuth("open-map")}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-soft cursor-pointer"
            >
              <span>Open MapEstate</span>
              <ArrowRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main>
    {/*  =====================================================================
         HERO SECTION — EDITORIAL SAAS INTRO (Background: #FFFFFF)
         =====================================================================  */}
    <section data-bg="#FFFFFF" className="pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*  Centered Hero Copy  */}
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="reveal font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] tracking-display text-slate-900">
            Find the right land. Know every risk before you buy.
          </h1>
          <p className="reveal reveal-delay-1 mt-6 text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
            MapEstate connects land buyers and sellers on one clear map — with an AI guide to help you choose and instant AI scans to check every plot.
          </p>

          {/*  Dual Primary & Secondary CTAs  */}
          <div className="reveal reveal-delay-2 mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAuth("open-map")}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-6 py-3.5 rounded-xl transition-colors shadow-card"
            >
              <span>Open MapEstate</span>
              <ArrowRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuth("list-land")}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 text-sm font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              <span>List Your Land</span>
            </button>
          </div>
        </div>

        {/*  Wide 16:7 Editorial Hero Photograph + 3 Minimal Capability Badges  */}
        <div className="reveal reveal-delay-3 mt-14 sm:mt-16">
          <div className="group rounded-2xl border border-slate-200/90 bg-white shadow-soft overflow-hidden">
            {/*  Crisp 16:7 Aerial Landscape Frame  */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/7] bg-gradient-to-br from-emerald-50 via-slate-100 to-slate-200 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
                alt="Aerial view of open green land and natural terrain"
                className="editorial-img w-full h-full object-cover object-center"
                loading="eager"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/1600x700/F2F7F4/0F172A?text=MapEstate+Land+Platform"; }}
              />
              {/*  Subtle bottom vignette for crisp edge contrast  */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/15 to-transparent"></div>
            </div>

            {/*  3 Minimal Capability Badges along the lower architectural frame  */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 bg-white">
              <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <Map className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-slate-900">Direct Map Platform</p>
                  <p className="text-xs text-slate-500">Buyers and landowners in one place</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-slate-900">AI Listing Guide</p>
                  <p className="text-xs text-slate-500">Matches land to your real needs</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-slate-900">AI Property Risk Scan</p>
                  <p className="text-xs text-slate-500">Checks flood, environment &amp; local issues</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/*  =====================================================================
         SECTION 1: AI AGENT — YOUR PERSONAL LAND GUIDE (Background: #F2F7F4)
         =====================================================================  */}
    <section id="ai-guide" data-bg="#F2F7F4" className="py-20 sm:py-28 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/*  Left Column: Plain-Language Explanation & 3 Icon Rows  */}
          <div className="lg:col-span-6 reveal">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">AI Land Guide</p>
            <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-display text-slate-900 leading-tight">
              Tell us what you need. Let AI find the best listings.
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Searching for land can feel overwhelming when there are hundreds of plots and unfamiliar areas. MapEstate's AI Agent understands your goals and guides you straight to the most suitable listings — saving hours of guesswork.
            </p>

            {/*  3 Simple Lucide Icon Rows  */}
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-slate-900">Ask in plain words</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Describe your ideal land just like talking to a helpful advisor — no complicated filters required.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-slate-900">Guided recommendations</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Get matched with listings that genuinely fit your purpose, location preferences, and access needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  <Columns2 className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-slate-900">Clear side-by-side guidance</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Understand why each listing fits your goals before you spend time visiting or reaching out.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/*  Right Column: Minimalist Conceptual SaaS UI Card (Zero Fake Data)  */}
          <div className="lg:col-span-6 reveal reveal-delay-2">
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-soft p-5 sm:p-7">
              {/*  Card Header  */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm text-slate-900">MapEstate AI Guide</p>
                    <p className="text-xs text-slate-500">Personal land search assistant</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Ready
                </span>
              </div>

              {/*  Conceptual User Prompt Bubble  */}
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Your Request</p>
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3.5 text-sm text-slate-800 leading-relaxed">
                  &ldquo;Find peaceful agricultural or residential land with good road access.&rdquo;
                </div>
              </div>

              {/*  Conceptual AI Guide Structured Steps  */}
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">How the AI Guide Helps</p>
                <div className="space-y-3">
                  {/*  Row 1  */}
                  <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display font-semibold text-sm text-slate-900">Matching Area Criteria</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        Filters quiet zones suited for residential or farming use.
                      </p>
                    </div>
                  </div>

                  {/*  Row 2  */}
                  <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                      <Route className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display font-semibold text-sm text-slate-900">Road &amp; Access Check</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        Prioritizes plots with clear, practical road connectivity.
                      </p>
                    </div>
                  </div>

                  {/*  Row 3  */}
                  <div className="flex items-start gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <ListChecks className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display font-semibold text-sm text-slate-900">Shortlisted Land Options</p>
                        <span className="text-[11px] font-medium text-emerald-700">Tailored to you</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                        Presents the strongest matches with clear reasons why each plot fits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/*  =====================================================================
         SECTION 2: AI PROPERTY SCAN (Background: #FFFFFF)
         =====================================================================  */}
    <section id="property-scan" data-bg="#FFFFFF" className="py-20 sm:py-28 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*  Centered Section Header  */}
        <div className="max-w-2xl mx-auto text-center reveal">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">AI Property Scan</p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-display text-slate-900">
            Scan any property before you make a move.
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Select any land listing on MapEstate to run an instant AI scan. It checks hidden risks and everyday conditions so you never buy blindly.
          </p>
        </div>

        {/*  Top Showcase: Split Architectural Card (Terrain Photo + Conceptual Scan Report)  */}
        <div className="reveal reveal-delay-1 mt-14 rounded-2xl border border-slate-200/90 bg-white shadow-soft overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/*  Left: Crisp Aerial / Nature Terrain Photograph  */}
            <div className="group lg:col-span-6 relative min-h-[260px] sm:min-h-[340px] bg-gradient-to-br from-slate-100 to-emerald-50 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80"
                alt="Natural valley terrain, greenery, and landscape elevation"
                className="editorial-img w-full h-full object-cover object-center"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/1200x900/F4F6F9/0F172A?text=Terrain+and+Environment"; }}
              />
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/90 px-3.5 py-1.5 text-xs font-medium text-slate-800 shadow-card">
                  <ScanSearch className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Instant land &amp; surroundings analysis</span>
                </div>
              </div>
            </div>

            {/*  Right: Clean AI Property Scan Report Conceptual Checklist  */}
            <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                    <FileSearch className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-slate-900">AI Property Scan Report</h3>
                    <p className="text-xs text-slate-500">Generated for any selected land plot</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Overview</span>
              </div>

              <div className="mt-5 space-y-4">
                {/*  Category 1: Flood Risk Assessment  */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CloudRain className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <p className="font-display font-semibold text-sm text-slate-900">Flood Risk Assessment</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Checked
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Reviews elevation, water drainage paths, and seasonal rainfall exposure.
                  </p>
                </div>

                {/*  Category 2: Environmental Conditions  */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Trees className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <p className="font-display font-semibold text-sm text-slate-900">Environmental Conditions</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Checked
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Examines green cover, land slope, nearby water bodies, and natural surroundings.
                  </p>
                </div>

                {/*  Category 3: Local Area Issues  */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
                      <p className="font-display font-semibold text-sm text-slate-900">Local Area Issues</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      Highlighted
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Surfaces practical road access notes, nearby essentials, and local concerns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*  Bottom 3-Column Bento Row: Explaining Each Scan Dimension  */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/*  Card 1: Flood & Water Risk  */}
          <div className="reveal reveal-delay-1 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <Waves className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display font-semibold text-lg tracking-tightSub text-slate-900">Flood &amp; Water Risk</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Checks low-lying terrain, drainage behavior, and flood exposure so you know if the land stays safe during heavy rains.
            </p>
          </div>

          {/*  Card 2: Environmental Factors  */}
          <div className="reveal reveal-delay-2 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <Leaf className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display font-semibold text-lg tracking-tightSub text-slate-900">Environmental Factors</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Evaluates surrounding greenery, water bodies, land slope, and nearby environmental conditions that affect long-term value.
            </p>
          </div>

          {/*  Card 3: Local Problems & Access  */}
          <div className="reveal reveal-delay-3 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <MapPinned className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display font-semibold text-lg tracking-tightSub text-slate-900">Local Problems &amp; Access</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Flags practical neighborhood realities — road access, nearby facilities, and local issues worth knowing before visiting.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/*  =====================================================================
         SECTION 3: HOW IT WORKS (Background: #F4F6F9)
         =====================================================================  */}
    <section id="how-it-works" data-bg="#F4F6F9" className="py-20 sm:py-28 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl reveal">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">How It Works</p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-display text-slate-900">
            Three clear steps from search to decision.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Built to be effortless for first-time buyers and experienced property owners alike.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/*  Step 01  */}
          <div className="reveal reveal-delay-1 rounded-2xl bg-white border border-slate-200/90 p-7 sm:p-8 shadow-card">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400">STEP 01</span>
            </div>
            <h3 className="mt-6 font-display font-semibold text-xl tracking-tightSub text-slate-900">Ask the AI or Browse</h3>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              Open the main map or tell the AI Agent what kind of land you want.
            </p>
          </div>

          {/*  Step 02  */}
          <div className="reveal reveal-delay-2 rounded-2xl bg-white border border-slate-200/90 p-7 sm:p-8 shadow-card">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                <ScanLine className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400">STEP 02</span>
            </div>
            <h3 className="mt-6 font-display font-semibold text-xl tracking-tightSub text-slate-900">Run an AI Scan</h3>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              Check flood risk, environmental factors, and local issues for any selected plot.
            </p>
          </div>

          {/*  Step 03  */}
          <div className="reveal reveal-delay-3 rounded-2xl bg-white border border-slate-200/90 p-7 sm:p-8 shadow-card">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                <PhoneCall className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400">STEP 03</span>
            </div>
            <h3 className="mt-6 font-display font-semibold text-xl tracking-tightSub text-slate-900">Connect Directly</h3>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              Contact the landowner directly with full clarity and zero middleman confusion.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/*  =====================================================================
         SECTION 4: BUILT FOR EVERYONE (Background: #FFFFFF)
         =====================================================================  */}
    <section id="who-its-for" data-bg="#FFFFFF" className="py-20 sm:py-28 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl reveal">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Who It's For</p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-display text-slate-900">
            Built for everyone buying, selling, or advising on land.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Whether you are choosing a single plot or managing multiple properties, MapEstate keeps every detail clear.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/*  Card 1: Land Buyers  */}
          <div className="group reveal reveal-delay-1 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-card flex flex-col">
            <div className="h-44 bg-slate-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
                alt="Open countryside road and land for buyers"
                className="editorial-img w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/800x450/F2F7F4/0F172A?text=Land+Buyers"; }}
              />
            </div>
            <div className="p-6 sm:p-7 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Buyers</span>
              </div>
              <h3 className="mt-2.5 font-display font-semibold text-xl tracking-tightSub text-slate-900">Land Buyers</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Discover suitable plots easily and understand every risk before committing.
              </p>
            </div>
          </div>

          {/*  Card 2: Property Owners  */}
          <div className="group reveal reveal-delay-2 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-card flex flex-col">
            <div className="h-44 bg-slate-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
                alt="Expansive natural landscape for property owners"
                className="editorial-img w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/800x450/F2F7F4/0F172A?text=Property+Owners"; }}
              />
            </div>
            <div className="p-6 sm:p-7 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <Home className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Owners</span>
              </div>
              <h3 className="mt-2.5 font-display font-semibold text-xl tracking-tightSub text-slate-900">Property Owners</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                List your land clearly on the map and connect directly with serious buyers.
              </p>
            </div>
          </div>

          {/*  Card 3: Brokers & Developers  */}
          <div className="group reveal reveal-delay-3 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-card flex flex-col">
            <div className="h-44 bg-slate-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
                alt="Modern architecture for brokers and land developers"
                className="editorial-img w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/800x450/F4F6F9/0F172A?text=Brokers+and+Developers"; }}
              />
            </div>
            <div className="p-6 sm:p-7 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Professionals</span>
              </div>
              <h3 className="mt-2.5 font-display font-semibold text-xl tracking-tightSub text-slate-900">Brokers &amp; Developers</h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Evaluate parcels faster with AI scans and present transparent insights to clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/*  =====================================================================
         CLOSING CALL-TO-ACTION BANNER (Background: #EDF3F0)
         =====================================================================  */}
    <section data-bg="#EDF3F0" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto">
        <div className="reveal rounded-2xl bg-slate-900 px-6 py-12 sm:px-12 sm:py-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-soft">
          <div className="max-w-xl">
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-display text-white">
              Ready to explore land with clarity?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Open the main MapEstate platform to ask the AI Guide, run property scans, or list your land directly on the map.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAuth("open-map")}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 text-sm font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              <span>Open MapEstate</span>
              <ArrowRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuth("list-land")}
              className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-sm font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              List Your Land
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>

  {/*  =====================================================================
       OFFICIAL FOOTER
       =====================================================================  */}
  <footer className="border-t border-slate-200/80 bg-white">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/*  Brand & Concise Tagline  */}
        <div>
          <a href="#" className="inline-flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="MapEstate Logo"
              className="h-7 w-7 object-contain shrink-0"
              
            />
            <svg className="hidden h-7 w-7 shrink-0 text-slate-900" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.75" />
              <path d="M2 12H26M12 2V26" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.22" />
              <rect x="14" y="14" width="9" height="9" rx="2" fill="#059669" fillOpacity="0.16" stroke="#059669" strokeWidth="1.75" />
              <circle cx="18.5" cy="18.5" r="1.75" fill="#059669" />
            </svg>
            <span className="font-display font-semibold text-[17px] tracking-tight text-slate-900">MapEstate</span>
          </a>
          <p className="mt-2.5 text-sm text-slate-500">
            Clear land discovery with AI guidance and instant property risk scans.
          </p>
        </div>

        {/*  Clean Navigation Links (No Pricing Links)  */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600" aria-label="Footer navigation">
          <a href="#ai-guide" onClick={(e) => { e.preventDefault(); scrollToSection("ai-guide"); setMobileMenuOpen(false); }} className="hover:text-slate-900 transition-colors">AI Guide</a>
          <a href="#property-scan" onClick={(e) => { e.preventDefault(); scrollToSection("property-scan"); setMobileMenuOpen(false); }} className="hover:text-slate-900 transition-colors">Property Scan</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); setMobileMenuOpen(false); }} className="hover:text-slate-900 transition-colors">How It Works</a>
          <a href="#who-its-for" onClick={(e) => { e.preventDefault(); scrollToSection("who-its-for"); setMobileMenuOpen(false); }} className="hover:text-slate-900 transition-colors">Who It's For</a>
          <button type="button" onClick={() => setModalType("privacy")} className="hover:text-slate-900 transition-colors">Privacy</button>
          <button type="button" onClick={() => setModalType("terms")} className="hover:text-slate-900 transition-colors">Terms</button>
        </nav>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
        &copy; 2026 MapEstate. All rights reserved.
      </div>
    </div>
  </footer>

  {/*  =====================================================================
       CLEAN ACCESSIBLE ACTION MODAL
       =====================================================================  */}
  

  {/*  =====================================================================
       INTERACTIVE BEHAVIORS:
       1. Lucide icons initialization
       2. Sticky navbar glassmorphic scroll elevation
       3. Mobile drawer toggle
       4. Smooth scroll-driven ambient background transitions
       5. Staggered scroll-reveal animations
       6. Accessible modal dialogs (Escape + backdrop close)
       =====================================================================  */}
  

      
      {/* Google Authentication Dialog right on Welcome Screen */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 relative text-left transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Header with Logo */}
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="MapEstate Logo"
                className="h-8 w-auto object-contain shrink-0"
              />
            </div>

            <div className="mt-4">
              <h3 className="font-display font-bold text-xl tracking-tight text-slate-900">
                Sign in to Enter MapEstate
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Continue with your Google account to access interactive cadastral land maps, run AI property scans, and view verified plots.
              </p>
            </div>

            {/* Value checklist */}
            <div className="mt-5 space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Cadastral plot boundaries & GPS land survey</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">AI flood, slope, zoning & livability risk audits</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Direct contact with verified land owners</span>
              </div>
            </div>

            {authError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {authError}
              </div>
            )}

            {/* Google Sign-In Action */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow text-sm active:scale-[0.98] cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
              >
                Or preview as Guest Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {activeModalConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalType(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 relative scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="font-display font-bold text-lg tracking-tight text-slate-900">
                  {activeModalConfig.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              {activeModalConfig.body}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  activeModalConfig.onAction();
                  setModalType(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium shadow-soft transition-colors"
              >
                {activeModalConfig.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
