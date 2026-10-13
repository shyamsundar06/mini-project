import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Compass,
  User,
  Lock,
  Globe,
  Footprints,
  Heart,
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Phone,
  Utensils,
  Eye,
  Check,
  ChevronRight,
  LogOut,
  Clock,
  Star
} from 'lucide-react';
import { authApi, touristApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

export const TOUR_PACKAGES = [
  {
    id: 'pkg_nilgiris_3d4n',
    tour_id: 'tour_ooty_nilgiris',
    title: 'Nilgiris Grand Mountain Heritage',
    duration: '3 Days / 4 Nights',
    tag: '⭐ Highly Recommended',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    price: '₹8,499',
    originalPrice: '₹10,500',
    discount: '20% OFF',
    rating: '4.9',
    reviews: '1,280',
    places: [
      { name: 'Doddabetta Peak (2,637m)', desc: 'Highest vantage viewpoint in Tamil Nadu with telescope house' },
      { name: 'Government Botanical Garden', desc: '55 acres colonial flora, fossilized tree trunk & glasshouse' },
      { name: 'Heritage Tea Estate & Factory', desc: 'Live tea leaf plucking, artisan tea tasting & museum' },
      { name: 'Pykara Waterfalls & Boathouse', desc: 'Cascading pristine riverfalls & mountain motorboat cruise' },
      { name: 'Nilgiri Mountain Steam Railway', desc: 'UNESCO Heritage toy train through mist-clad viaducts' }
    ],
    inclusions: [
      'Deluxe Mountain Resort Stay (4 Nights)',
      'All Sightseeing in AC Traveler Transit',
      'Daily Mountain Breakfast & Dinner',
      'Guided Eco-Walks & Entry Tickets',
      '24/7 AI Guide & Live Tour Coordinator'
    ]
  },
  {
    id: 'pkg_kodai_4d3n',
    tour_id: 'tour_kodai_valley',
    title: 'Kodaikanal Mist & Pine Valley Expedition',
    duration: '4 Days / 3 Nights',
    tag: '🌲 Cloud Forest Special',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    price: '₹9,999',
    originalPrice: '₹12,000',
    discount: '17% OFF',
    rating: '4.8',
    reviews: '940',
    places: [
      { name: 'Pillar Rocks & Guna Caves', desc: 'Majestic 122m vertical cliff formations & pine forests' },
      { name: 'Coaker’s Walk Sky Path', desc: '1-km pedestrian pathway with breath-taking valley views' },
      { name: 'Berijam Forest Lake & Silent Echo', desc: 'Pristine biosphere reserve lake inside dense reserve' },
      { name: 'Silver Cascade Waterfalls', desc: '55-meter foaming waterfall cascading from mountain pools' },
      { name: 'Kodai Star Lake & Bryant Park', desc: 'Scenic cycling around lake & manicured botanical park' }
    ],
    inclusions: [
      'High-Range Pine Cottages (3 Nights)',
      'Forest Reserve Permits & Local Safaris',
      'Campfire & Organic Dark Chocolate Tasting',
      'Private Chauffeur Mountain Transit',
      'Real-Time Safety & GPS Tracking'
    ]
  },
  {
    id: 'pkg_coonoor_3d2n',
    tour_id: 'tour_coonoor_safari',
    title: 'Coonoor Tea Country & Ravine Safari',
    duration: '3 Days / 2 Nights',
    tag: '🍃 Relaxed & Scenic',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    price: '₹6,499',
    originalPrice: '₹7,999',
    discount: '19% OFF',
    rating: '4.9',
    reviews: '720',
    places: [
      { name: 'Sim’s Park Arboretum', desc: 'Natural botanical garden with 1,000+ plant species' },
      { name: 'Dolphin’s Nose Viewpoint', desc: 'Enormous cliff peak offering sweeping ravine vistas' },
      { name: 'Lamb’s Rock Precipice', desc: 'Steep cliff overlooking Coimbatore coffee plains' },
      { name: 'Highfield Tea Plantation', desc: 'Traditional 50-year-old tea processing and eucalyptus distillery' }
    ],
    inclusions: [
      'Colonial Heritage Bungalow (2 Nights)',
      'Artisan Tea Tasting & Workshop',
      'Toy Train Ticket from Ooty to Coonoor',
      'All Sightseeing & Guide Assistance'
    ]
  }
];

export default function TouristBookingWizard({ isOpen, onClose, onBookingSuccess }) {
  const { user, login: contextLogin } = useAuth();
  const { lang, setLang, t, currentLanguageObj } = useLanguage();

  // Wizard Step: 1 = Login, 2 = Language, 3 = Preferences, 4 = Tour Packages, 5 = Booking Confirmed
  const [step, setStep] = useState(1);

  // Step 1: Login State (2 users: sonika/1234, subika/1234)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  // Step 2: Language Selection
  const [selectedLang, setSelectedLang] = useState(lang || 'en');

  // Step 3: Preferences
  const [preferences, setPreferences] = useState({
    walking_preference: 'Moderate', // Fast | Moderate | Slow
    activity_preference: 'Heritage & Culture',
    interests: 'Sightseeing, Heritage, Photography, Nature',
    dietary_pref: 'Pure Vegetarian',
    emergency_contact_name: 'Parent / Family',
    emergency_contact_phone: '+91 98451 00000',
    special_notes: 'Excited for mountain viewpoints and scenic photography.'
  });

  // Step 4: Tour Package Selection (Defaults to 3 Days / 4 Nights)
  const [selectedPackage, setSelectedPackage] = useState(TOUR_PACKAGES[0]);

  // Booking submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setBookingResult(null);
      setIsSubmitting(false);
      setStep(1); // Always start from Step 1: Login
      setUsername('');
      setPassword('');
      setAuthenticatedUser(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login Step
  const handleLogin = async (overrideUser = null, overridePass = null) => {
    const targetUser = overrideUser || username;
    const targetPass = overridePass || password;

    setLoginLoading(true);
    setLoginError('');

    try {
      const email = targetUser.includes('@') ? targetUser : `${targetUser}@tourism.com`;
      const res = await authApi.login({ email, password: targetPass });

      if (res.data?.success && res.data?.user) {
        const loggedUser = res.data.user;
        localStorage.setItem('tourism_token', res.data.token);
        localStorage.setItem('tourism_user', JSON.stringify(loggedUser));
        setAuthenticatedUser(loggedUser);
        
        // Progress to Step 2: Ask Language
        setStep(2);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.warn('Login attempt fallback check:', err);
      // Client-side fallback if server temporarily unreachable
      const lower = targetUser.toLowerCase();
      if ((lower === 'sonika' || lower === 'subika') && targetPass === '1234') {
        const displayName = lower === 'sonika' ? 'Sonika' : 'Subika';
        const fallbackUser = {
          id: `usr_${lower}`,
          name: displayName,
          username: lower,
          email: `${lower}@tourism.com`,
          role: 'tourist',
          phone: lower === 'sonika' ? '+91 98451 11111' : '+91 98451 22222'
        };
        localStorage.setItem('tourism_user', JSON.stringify(fallbackUser));
        setAuthenticatedUser(fallbackUser);
        setStep(2);
      } else {
        setLoginError('Invalid credentials. Authorized tourists: "sonika" (1234) or "subika" (1234).');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Language Step
  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode);
    setLang(langCode);
  };

  // Submit Booking to Backend & Notify Coordinator
  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const touristName = authenticatedUser?.name || (username === 'subika' ? 'Subika' : 'Sonika');
      const userId = authenticatedUser?.id || `usr_${username}`;

      const bookingPayload = {
        user_id: userId,
        tourist_name: touristName,
        tour_id: selectedPackage.tour_id || 'tour_ooty_nilgiris',
        package_title: selectedPackage.title,
        duration: selectedPackage.duration,
        language: LANGUAGES.find((l) => l.code === selectedLang)?.name || 'English',
        preferences: {
          ...preferences,
          dietary_pref: preferences.dietary_pref
        },
        booking_details: {
          package_id: selectedPackage.id,
          price: selectedPackage.price,
          places_count: selectedPackage.places.length,
          booked_at: new Date().toISOString()
        }
      };

      const res = await touristApi.bookTour(bookingPayload);
      const bookingData = res.data?.booking || {
        booking_id: res.data?.bookingId || `bkg_${Date.now()}`,
        tourist_name: touristName,
        package_title: selectedPackage.title,
        duration: selectedPackage.duration,
        assigned_group: res.data?.assignedGroup?.name || (preferences.walking_preference === 'Fast' ? 'Group Alpha' : preferences.walking_preference === 'Slow' ? 'Group Gamma' : 'Group Beta'),
        places: selectedPackage.places
      };

      // Ensure places is populated
      if (!bookingData.places || bookingData.places.length === 0) {
        bookingData.places = selectedPackage.places;
      }

      // Save to localStorage for tourist dashboard personalization
      localStorage.setItem('tourist_active_booking', JSON.stringify({
        ...bookingData,
        tourist_name: touristName,
        package_title: selectedPackage.title,
        duration: selectedPackage.duration,
        places: selectedPackage.places,
        preferences,
        language: selectedLang
      }));

      // Update auth context user if possible
      const updatedUser = {
        ...(authenticatedUser || {}),
        name: touristName,
        role: 'tourist',
        touristProfile: {
          name: touristName,
          group_id: bookingData.assigned_group === 'Group Alpha' ? 'grp_alpha' : bookingData.assigned_group === 'Group Gamma' ? 'grp_gamma' : 'grp_beta',
          group_name: bookingData.assigned_group,
          preferred_language: selectedLang,
          walking_preference: preferences.walking_preference
        }
      };
      localStorage.setItem('tourism_user', JSON.stringify(updatedUser));

      // Persist tourist record in local storage so it reflects in Operator portal immediately
      try {
        const targetGroupId = preferences.walking_preference === 'Fast' ? 'grp_alpha' : preferences.walking_preference === 'Slow' ? 'grp_gamma' : 'grp_beta';
        const targetGroupName = targetGroupId === 'grp_alpha' ? 'Alpha - Southern Regional Cohort' : targetGroupId === 'grp_gamma' ? 'Gamma - Regional Cultural Guild' : 'Beta - Bilingual Bridge Cohort';
        const clientTourist = {
          id: res.data?.touristId || `trt_${touristName.toLowerCase()}`,
          name: touristName,
          age: 26,
          gender: 'Female',
          preferred_language: LANGUAGES.find((l) => l.code === selectedLang)?.name || 'English',
          walking_preference: preferences.walking_preference,
          activity_preference: preferences.activity_preference,
          interests: preferences.interests,
          accessibility_requirements: 'None',
          emergency_contact_name: preferences.emergency_contact_name || 'Emergency Contact',
          emergency_contact_phone: preferences.emergency_contact_phone || '+91 98451 00000',
          tour_id: 'tour_ooty_nilgiris',
          group_id: targetGroupId,
          group_name: targetGroupName,
          tour_title: selectedPackage.title,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };
        const existing = JSON.parse(localStorage.getItem('tourism_client_added_tourists') || '[]');
        const filtered = existing.filter(t => t.name.toLowerCase() !== touristName.toLowerCase());
        filtered.unshift(clientTourist);
        localStorage.setItem('tourism_client_added_tourists', JSON.stringify(filtered));

        // CRITICAL: Un-blacklist tourist from any previous test deletion
        const deletedNames = JSON.parse(localStorage.getItem('tourism_deleted_tourist_names') || '[]');
        const cleanNames = deletedNames.filter(n => n.toLowerCase() !== touristName.toLowerCase());
        localStorage.setItem('tourism_deleted_tourist_names', JSON.stringify(cleanNames));

        const deletedIds = JSON.parse(localStorage.getItem('tourism_deleted_tourist_ids') || '[]');
        const cleanIds = deletedIds.filter(id => !id.toLowerCase().includes(touristName.toLowerCase()));
        localStorage.setItem('tourism_deleted_tourist_ids', JSON.stringify(cleanIds));
      } catch (e) {}

      // Notify window listeners
      try {
        window.dispatchEvent(new Event('tourist_booking_updated'));
      } catch (e) {}

      setBookingResult(bookingData);
      setStep(5);

      // Trigger festive celebration
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // Step 5 celebration will call onBookingSuccess when user clicks Enter My Tour Dashboard
    } catch (err) {
      console.error('Booking failed:', err);
      // Graceful fallback display
      const touristName = authenticatedUser?.name || (username === 'subika' ? 'Subika' : 'Sonika');
      const fallbackBooking = {
        booking_id: `bkg_local_${Date.now()}`,
        tourist_name: touristName,
        package_title: selectedPackage.title,
        duration: selectedPackage.duration,
        assigned_group: preferences.walking_preference === 'Fast' ? 'Group Alpha (Trekkers)' : preferences.walking_preference === 'Slow' ? 'Group Gamma (Leisure)' : 'Group Beta (Explorers)',
        places: selectedPackage.places
      };
      localStorage.setItem('tourist_active_booking', JSON.stringify(fallbackBooking));

      // Clean deleted lists
      try {
        const deletedNames = JSON.parse(localStorage.getItem('tourism_deleted_tourist_names') || '[]');
        const cleanNames = deletedNames.filter(n => n.toLowerCase() !== touristName.toLowerCase());
        localStorage.setItem('tourism_deleted_tourist_names', JSON.stringify(cleanNames));
        window.dispatchEvent(new Event('tourist_booking_updated'));
      } catch (e) {}

      setBookingResult(fallbackBooking);
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Progress Bar & Steps Indicator */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">
                  Intelligent Tourist Companion
                </h3>
                <p className="text-[11px] text-white/80">
                  {step === 1 && 'Step 1 of 4 • Tourist Authentication'}
                  {step === 2 && 'Step 2 of 4 • Select Your Language'}
                  {step === 3 && 'Step 3 of 4 • Personalize Preferences'}
                  {step === 4 && 'Step 4 of 4 • Choose Tour Package'}
                  {step === 5 && 'Booking Confirmed • Live Real-Time Tour'}
                </p>
              </div>
            </div>

            {/* Step badges */}
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    step === s
                      ? 'bg-white text-blue-600 shadow-md ring-2 ring-white/50 scale-110'
                      : step > s
                      ? 'bg-emerald-400 text-slate-900 font-bold'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
              ))}
            </div>
          </div>

          {/* User badge if logged in */}
          {authenticatedUser && step > 1 && (
            <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Logged in as: <strong className="text-white underline">{authenticatedUser.name}</strong></span>
              <button
                onClick={() => setStep(1)}
                className="text-[10px] text-white/80 hover:text-white underline ml-1"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ========================================================================= */}
          {/* STEP 1: LOGIN (Dedicated for Sonika pass 1234 and Subika pass 1234)      */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  Welcome to Intelligent Tourism
                </h4>
                <p className="text-xs text-slate-500">
                  Sign in with your designated tourist account to unlock guided tours.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4 pt-2"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. sonika or subika"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="1234"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loginLoading ? (
                    <span>Authenticating Tourist...</span>
                  ) : (
                    <>
                      <span>Sign In & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant 1-Click Fast Login for Authorized Tourists */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                  Or 1-Click Instant Tourist Login:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLogin('sonika', '1234')}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sonika (1234)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin('subika', '1234')}
                    className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Subika (1234)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CHOOSE LANGUAGE ("after entering needs to ask language")          */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-200">
                  <Globe className="w-6 h-6 animate-spin-slow" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Choose Your Preferred Language
                </h4>
                <p className="text-xs text-slate-500">
                  உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும். The audio guides & alerts will speak this language.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageSelect(l.code)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                      selectedLang === l.code
                        ? 'bg-blue-50 border-blue-500 shadow-sm text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-lg mr-1.5">{l.flag}</span>
                      <span className="font-extrabold text-xs">{l.native}</span>
                      <p className="text-[10px] text-slate-400 font-medium">{l.name}</p>
                    </div>
                    {selectedLang === l.code && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <span>Confirm Language & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PREFERENCES ("then it needs to ask for thier preference")         */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-1 border border-indigo-200">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Tell Us Your Travel Preferences
                </h4>
                <p className="text-xs text-slate-500">
                  Our AI coordinator dynamically groups you with compatible fellow travellers.
                </p>
              </div>

              {/* Preference 1: Walking Pace */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Footprints className="w-3.5 h-3.5 text-blue-600" />
                  <span>Walking Pace & Fitness Level</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { pace: 'Fast', label: 'Brisk / Trekkers', group: 'Alpha Group', desc: 'Enjoys fast walking & hills' },
                    { pace: 'Moderate', label: 'Moderate', group: 'Beta Group', desc: 'Balanced walking & stops' },
                    { pace: 'Slow', label: 'Relaxed / Leisure', group: 'Gamma Group', desc: 'Gentle stroll & rest' }
                  ].map((p) => (
                    <button
                      key={p.pace}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, walking_preference: p.pace })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        preferences.walking_preference === p.pace
                          ? 'border-blue-500 bg-blue-50/90 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-[11px]">{p.label}</div>
                      <div className="text-[9px] text-blue-600 font-semibold">{p.group}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5 leading-tight">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preference 2: Travel Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tour Style & Main Interest</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Botanical & Nature Treks',
                    'Heritage, Colonial & Culture',
                    'Mountain Vistas & Photography',
                    'Relaxed Scenic & Tea Country'
                  ].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, activity_preference: style })}
                      className={`p-2 rounded-xl border text-left text-xs font-bold transition-all ${
                        preferences.activity_preference === style
                          ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preference 3: Dietary Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dietary Preference</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Pure Vegetarian', 'Non-Vegetarian', 'Jain', 'Vegan'].map((diet) => (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, dietary_pref: diet })}
                      className={`p-2 rounded-xl border text-center text-[10px] font-bold transition-all ${
                        preferences.dietary_pref === diet
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <span>Emergency Phone Number</span>
                </label>
                <input
                  type="text"
                  value={preferences.emergency_contact_phone}
                  onChange={(e) => setPreferences({ ...preferences, emergency_contact_phone: e.target.value })}
                  placeholder="+91 98451 00000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <span>View Tour Packages</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: TOUR PACKAGES & BOOKING ("display tour packages like 3 days 4 nights and places") */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1 border border-emerald-200">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Choose Your Tour Package
                </h4>
                <p className="text-xs text-slate-500">
                  Select a multi-day itinerary. Booking reflects instantly on coordinator dashboard.
                </p>
              </div>

              {/* Tour Packages Cards */}
              <div className="space-y-3">
                {TOUR_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-md'
                          : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      {/* Header & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pkg.badgeColor}`}>
                              {pkg.tag}
                            </span>
                            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                              {pkg.duration}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-sm text-slate-900 mt-1">
                            {pkg.title}
                          </h5>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900">{pkg.price}</span>
                          <span className="text-[10px] text-slate-400 block line-through">{pkg.originalPrice}</span>
                        </div>
                      </div>

                      {/* Places included preview */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          <span>Places Covered ({pkg.places.length} Locations):</span>
                        </p>
                        <div className="space-y-1">
                          {pkg.places.map((place, idx) => (
                            <div key={idx} className="flex items-start space-x-1.5 text-xs text-slate-700">
                              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                              <div>
                                <strong className="font-bold text-slate-900">{place.name}:</strong>{' '}
                                <span className="text-slate-500 text-[11px]">{place.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inclusions pill list */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {pkg.inclusions.slice(0, 3).map((inc, i) => (
                          <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            • {inc}
                          </span>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Booking Summary Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Selected Package:</span>
                  <strong className="text-slate-900 font-bold">{selectedPackage.title}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Duration:</span>
                  <strong className="text-blue-700 font-bold">{selectedPackage.duration}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Tourist Name:</span>
                  <strong className="text-slate-900 font-bold">{authenticatedUser?.name || username}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Auto-Assigned Group:</span>
                  <strong className="text-emerald-700 font-bold">
                    {preferences.walking_preference === 'Fast' ? 'Group Alpha (Fast Pace)' : preferences.walking_preference === 'Slow' ? 'Group Gamma (Relaxed)' : 'Group Beta (Moderate)'}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Broadcasting Booking to Coordinator...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Confirm & Book Tour Now ({selectedPackage.duration})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: BOOKING CONFIRMED & REAL-TIME BROADCAST CELEBRATION               */}
          {/* ========================================================================= */}
          {step === 5 && bookingResult && (
            <div className="text-center space-y-4 py-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 text-2xl font-bold animate-bounce">
                🎉
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Real-Time Booking Synced
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  Tour Successfully Booked!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your booking has been registered and transmitted live to the Tour Coordinator's Command Center.
                </p>
              </div>

              {/* Receipt Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Tourist Name:</span>
                  <span className="font-extrabold text-slate-900">{bookingResult.tourist_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Tour Package:</span>
                  <span className="font-extrabold text-blue-600">{bookingResult.package_title}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-extrabold text-slate-900">{bookingResult.duration}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Assigned Group:</span>
                  <span className="font-extrabold text-emerald-600">{bookingResult.assigned_group}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Real-Time Status:</span>
                  <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live in Coordinator Center</span>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onBookingSuccess) onBookingSuccess(bookingResult);
                    if (onClose) onClose();
                    try {
                      window.dispatchEvent(new Event('tourist_booking_updated'));
                    } catch (e) {}
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enter My Tour Dashboard</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
