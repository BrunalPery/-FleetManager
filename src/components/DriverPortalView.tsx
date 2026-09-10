import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserCheck, 
  Car, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Briefcase, 
  AlertCircle, 
  Navigation, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  FileText,
  MessageCircle,
  ChevronRight,
  User,
  CreditCard,
  Lock,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { Driver, Rental, Vehicle, Client, AgencySettings } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';
import { getThemeClasses, applyThemeCSS } from '../utils/theme';

interface DriverPortalViewProps {
  settings: AgencySettings;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  rentals: Rental[];
  setRentals: React.Dispatch<React.SetStateAction<Rental[]>>;
  vehicles: Vehicle[];
  clients: Client[];
  onBackToAdmin?: () => void;
  onNotifyAgency?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'email', rentalId?: string) => void;
  initialDriverId?: string | null;
}

const LS_ACTIVE_DRIVER_KEY = 'locafleet_active_driver_id';

export const DriverPortalView: React.FC<DriverPortalViewProps> = ({
  settings,
  drivers,
  setDrivers,
  rentals,
  setRentals,
  vehicles,
  clients,
  onBackToAdmin,
  onNotifyAgency,
  initialDriverId
}) => {
  const theme = getThemeClasses(settings.themeColor);

  // Check if opened through public driver link (?driver=true)
  const isPublicDriverUrl = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('driver') === 'true' ||
    window.location.search.includes('driver=true')
  );

  useEffect(() => {
    applyThemeCSS(settings.themeColor || 'blue');
  }, [settings.themeColor]);

  // Read URL query parameters for personal driver links
  const [paramDriverId, setParamDriverId] = useState<string | null>(() => {
    if (initialDriverId) return initialDriverId;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('driverId') || p.get('id') || null;
    }
    return null;
  });

  const [paramToken, setParamToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('token') || null;
    }
    return null;
  });

  // Targeted driver when entering through personal driver link
  const targetedDriver = useMemo(() => {
    if (!paramDriverId && !paramToken) return null;
    return drivers.find(d => 
      (paramDriverId && d.id === paramDriverId) || 
      (paramToken && d.token === paramToken)
    ) || null;
  }, [drivers, paramDriverId, paramToken]);

  // If a personal link was opened but this driver does NOT exist in the agency (e.g. deleted by owner):
  const isTargetedDriverMissing = Boolean((paramDriverId || paramToken) && !targetedDriver);

  // Active connected driver state
  const [activeDriverId, setActiveDriverId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LS_ACTIVE_DRIVER_KEY);
      if (saved && drivers.some(d => d.id === saved)) {
        return saved;
      }
    }
    return null;
  });

  // State when a driver's account is revoked/deleted while connected or during navigation
  const [isDriverRevoked, setIsDriverRevoked] = useState(false);

  // Verification: If the active connected driver is deleted from `drivers` by the agency owner,
  // IMMEDIATELY revoke their session and destroy their workspace access.
  useEffect(() => {
    if (activeDriverId) {
      const driverStillExists = drivers.some(d => d.id === activeDriverId);
      if (!driverStillExists) {
        localStorage.removeItem(LS_ACTIVE_DRIVER_KEY);
        setActiveDriverId(null);
        setIsDriverRevoked(true);
      }
    }
  }, [drivers, activeDriverId]);

  // Save active driver to localStorage
  useEffect(() => {
    if (activeDriverId) {
      localStorage.setItem(LS_ACTIVE_DRIVER_KEY, activeDriverId);
    } else {
      localStorage.removeItem(LS_ACTIVE_DRIVER_KEY);
    }
  }, [activeDriverId]);

  const activeDriver = useMemo(() => {
    return drivers.find(d => d.id === activeDriverId) || null;
  }, [drivers, activeDriverId]);

  // Tabs inside Driver Portal: 'new_missions' | 'active_mission' | 'history'
  const [activeTab, setActiveTab] = useState<'new_missions' | 'active_mission' | 'history'>('new_missions');

  // Input states for secure confidential authentication
  const [loginPhoneInput, setLoginPhoneInput] = useState('');
  const [loginPinInput, setLoginPinInput] = useState('');
  const [targetedPinInput, setTargetedPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Share link feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Helpers
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);
  const getClient = (id: string) => clients.find(c => c.id === id);

  // Compute missions for active driver
  const myActiveMission = useMemo(() => {
    if (!activeDriver) return null;
    return rentals.find(r => r.driverId === activeDriver.id && r.status === 'active') || null;
  }, [rentals, activeDriver]);

  const myUpcomingMissions = useMemo(() => {
    if (!activeDriver) return [];
    return rentals.filter(r => r.driverId === activeDriver.id && r.status === 'pending');
  }, [rentals, activeDriver]);

  const myPastMissions = useMemo(() => {
    if (!activeDriver) return [];
    return rentals.filter(r => r.driverId === activeDriver.id && r.status === 'returned');
  }, [rentals, activeDriver]);

  // Available new missions to accept:
  // 1. Rentals that requested a driver (driverDailyRate > 0 or with driver option) but have no driver assigned yet
  // 2. Or pending rentals with no driver
  const availableMissions = useMemo(() => {
    return rentals.filter(r => {
      // Must not be returned or cancelled
      if (r.status === 'returned' || r.status === 'cancelled') return false;
      // Not assigned to any driver yet
      const isUnassigned = !r.driverId;
      // Has driver daily rate requested OR is pending without driver
      const isDriverRequested = (r.driverDailyRate && r.driverDailyRate > 0) || isUnassigned;
      return isUnassigned && isDriverRequested && r.endDate >= todayStr;
    });
  }, [rentals, todayStr]);

  // Disconnect driver handler
  const handleDisconnect = () => {
    localStorage.removeItem(LS_ACTIVE_DRIVER_KEY);
    setActiveDriverId(null);
    setLoginPhoneInput('');
    setLoginPinInput('');
    setTargetedPinInput('');
    setLoginError('');
    setIsDriverRevoked(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('driverId');
      url.searchParams.delete('id');
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
    setParamDriverId(null);
    setParamToken(null);
  };

  // Direct Driver Portal URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const driverPortalUrl = `${origin}${pathname}?driver=true`;

  const handleCopyDriverLink = async () => {
    try {
      await navigator.clipboard.writeText(driverPortalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Bonjour ! Voici le portail d'accès aux missions pour les chauffeurs agréés chez ${settings.agencyName} : ${driverPortalUrl}`
  )}`;

  // Handle Targeted Driver PIN Unlock (when using a personal link)
  const handleTargetedUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!targetedDriver) return;

    const entered = targetedPinInput.trim();
    if (!entered) {
      setLoginError('Veuillez saisir votre code PIN secret à 4 chiffres.');
      return;
    }

    const expected = targetedDriver.accessPin || '1234';
    if (entered === expected) {
      setActiveDriverId(targetedDriver.id);
      setTargetedPinInput('');
      setLoginError('');
    } else {
      setLoginError('Code PIN secret incorrect. Ce code est personnel et confidentiel.');
    }
  };

  // Handle Driver Login by phone or license + secret PIN (generic portal link)
  const handleGeneralLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = loginPhoneInput.trim().replace(/\s+/g, '');
    const cleanPin = loginPinInput.trim();

    if (!cleanPhone || !cleanPin) {
      setLoginError('Veuillez renseigner votre numéro de téléphone (ou de permis) ainsi que votre code PIN secret.');
      return;
    }

    const matched = drivers.find(d => {
      const dPhone = d.phone.replace(/\s+/g, '');
      const dLicense = d.licenseNumber.trim().toLowerCase();
      return dPhone.includes(cleanPhone) || dLicense.includes(cleanPhone.toLowerCase());
    });

    if (!matched) {
      setLoginError('Aucun profil chauffeur actif trouvé avec ces identifiants. Si votre compte a été retiré de l\'agence par le propriétaire, votre espace personnel n\'existe plus.');
      return;
    }

    const expectedPin = matched.accessPin || '1234';
    if (cleanPin !== expectedPin) {
      setLoginError('Code PIN secret incorrect pour ce chauffeur. Veuillez saisir votre code confidentiel.');
      return;
    }

    setActiveDriverId(matched.id);
    setLoginPhoneInput('');
    setLoginPinInput('');
    setLoginError('');
  };

  // Toggle Driver Availability
  const handleToggleAvailability = () => {
    if (!activeDriver) return;
    const newStatus = !activeDriver.available;
    setDrivers(prev => prev.map(d => d.id === activeDriver.id ? { ...d, available: newStatus } : d));
    setActionSuccessMessage(`Statut mis à jour : vous êtes désormais ${newStatus ? 'Disponible pour missions' : 'En pause / Indisponible'}.`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  // Accept a new mission
  const handleAcceptMission = (rental: Rental) => {
    if (!activeDriver) return;
    
    // Assign driver to rental
    setRentals(prev => prev.map(r => {
      if (r.id === rental.id) {
        return {
          ...r,
          driverId: activeDriver.id,
          driverDailyRate: r.driverDailyRate || 40,
          totalDriverCost: (r.driverDailyRate || 40) * r.totalDays,
          totalAmount: r.totalVehicleCost + ((r.driverDailyRate || 40) * r.totalDays)
        };
      }
      return r;
    }));

    // Mark driver as busy/unavailable if active
    if (rental.status === 'active') {
      setDrivers(prev => prev.map(d => d.id === activeDriver.id ? { ...d, available: false } : d));
    }

    // Agency notification
    const vehicle = getVehicle(rental.vehicleId);
    const client = getClient(rental.clientId);
    if (onNotifyAgency) {
      onNotifyAgency(
        'Nouvelle mission acceptée par un chauffeur !',
        `${activeDriver.firstName} ${activeDriver.lastName} a accepté la mission sur le véhicule ${vehicle?.make} ${vehicle?.model} (${rental.startDate} au ${rental.endDate}).`,
        'success',
        rental.id
      );
    }

    setActionSuccessMessage(`Félicitations ! Vous avez accepté la mission pour le véhicule ${vehicle ? `${vehicle.make} ${vehicle.model}` : 'affecté'}.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
    setActiveTab('active_mission');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 animate-fade-in" id="driver-portal-view">
      
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          
          {/* Logo & Agency Info */}
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: 'var(--theme-color)', boxShadow: `0 3px 10px ${theme.primaryHex}40` }}
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold shrink-0 shadow-xs"
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Espace Chauffeur
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {settings.agencyName}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Connexion, suivi d'activité et acceptation de nouvelles missions
              </p>
            </div>
          </div>

          {/* Top Actions: Copy link + Back to Admin */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="driver-btn-copy-link"
              onClick={handleCopyDriverLink}
              title="Copier le lien permanent de l'espace chauffeur"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all shadow-2xs active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-bold hidden sm:inline">Lien copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="hidden sm:inline">Lien Chauffeur</span>
                </>
              )}
            </button>

            {!isPublicDriverUrl && onBackToAdmin && (
              <button
                type="button"
                id="driver-btn-back-admin"
                onClick={onBackToAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Retourner au tableau de bord administrateur"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tableau de bord</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        
        {/* Success / Feedback notification */}
        {actionSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button type="button" onClick={() => setActionSuccessMessage(null)} className="p-1 hover:opacity-75">
              &times;
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* CASE 0: DRIVER ACCOUNT WAS REMOVED / REVOKED / NOT FOUND   */}
        {/* ========================================================= */}
        {(isTargetedDriverMissing || isDriverRevoked) ? (
          <div className="space-y-6 max-w-lg mx-auto py-8 text-center animate-fade-in">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-rose-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Espace Chauffeur Inexistant</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Accès Chauffeur Révoqué ou Supprimé
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  Le propriétaire de l'agence a retiré ce chauffeur de son agence. L'espace chauffeur personnel correspondant <span className="font-bold text-rose-700">n'existe plus</span> et l'ensemble de ses accès a été immédiatement révoqué.
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  id="btn-return-admin-revoked"
                  onClick={() => {
                    setIsDriverRevoked(false);
                    setParamDriverId(null);
                    setParamToken(null);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('driverId');
                      url.searchParams.delete('id');
                      url.searchParams.delete('token');
                      window.history.replaceState({}, '', url.toString());
                    }
                    onBackToAdmin();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Retour à l'accueil de l'agence
                </button>
              </div>
            </div>
          </div>
        ) : !activeDriver ? (
          /* ========================================================= */
          /* CASE 1: NO DRIVER CONNECTED - PRIVATE AUTHENTICATION      */
          /* ========================================================= */
          <div className="space-y-6 max-w-lg mx-auto py-4">
            
            {targetedDriver ? (
              /* A. TARGETED PERSONAL LINK: PIN UNLOCK FOR THIS DRIVER */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
                <div 
                  style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}40` }}
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xs text-xl font-black"
                >
                  {targetedDriver.firstName[0]}{targetedDriver.lastName[0]}
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Espace Chauffeur Personnel</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {targetedDriver.firstName} {targetedDriver.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {settings.agencyName} &bull; Permis N° <span className="font-mono font-semibold text-slate-700">{targetedDriver.licenseNumber}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Veuillez entrer votre <strong className="text-slate-900">code PIN secret</strong> à 4 chiffres pour déverrouiller votre espace privé.
                </p>

                <form onSubmit={handleTargetedUnlock} className="space-y-3 pt-2 text-left">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Code PIN Secret (4 chiffres) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={6}
                        autoFocus
                        placeholder="••••"
                        value={targetedPinInput}
                        onChange={(e) => setTargetedPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-9 pr-10 py-2.5 text-center tracking-widest text-base font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        title={showPin ? "Masquer" : "Afficher"}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-shake">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` }}
                    className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Déverrouiller mon Espace</span>
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setParamDriverId(null);
                      setParamToken(null);
                      setLoginError('');
                      if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('driverId');
                        url.searchParams.delete('id');
                        url.searchParams.delete('token');
                        window.history.replaceState({}, '', url.toString());
                      }
                    }}
                    className="text-slate-500 hover:text-slate-800 underline cursor-pointer text-[11px]"
                  >
                    Changer de compte
                  </button>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Accès strictement isolé</span>
                  </span>
                </div>
              </div>
            ) : (
              /* B. GENERIC SECURE LOGIN: PHONE/LICENSE + CONFIDENTIAL PIN */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
                <div 
                  style={{ backgroundColor: 'var(--theme-color-light)', color: 'var(--theme-color)' }}
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
                >
                  <Lock className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Espace Chauffeur Sécurisé
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Identifiez-vous à l'aide de vos identifiants confidentiels pour consulter votre planning chez <strong className="text-slate-900">{settings.agencyName}</strong>.
                  </p>
                </div>

                <form onSubmit={handleGeneralLogin} className="pt-2 text-left space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Numéro de téléphone ou N° de permis *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="driver-login-input"
                        placeholder="ex: +33 6 12 34 56 78 ou FR-9482..."
                        value={loginPhoneInput}
                        onChange={(e) => setLoginPhoneInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Code secret PIN (4 chiffres) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={6}
                        placeholder="••••"
                        value={loginPinInput}
                        onChange={(e) => setLoginPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm font-mono font-bold tracking-widest bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        title={showPin ? "Masquer" : "Afficher"}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-shake">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` }}
                    className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 mt-1"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Se connecter à mon Espace</span>
                  </button>
                </form>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 text-left flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Accès strictement cloisonné :</strong> Un chauffeur ne peut pas accéder aux espaces des autres chauffeurs. Vos courses et vos informations restent strictement privées.
                  </span>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ========================================================= */
          /* CASE 2: DRIVER IS CONNECTED - WORKSPACE */
          /* ========================================================= */
          <div className="space-y-6">
            
            {/* Connected Driver Profile Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div 
                  style={{ backgroundColor: 'var(--theme-color)', boxShadow: `0 4px 12px ${theme.primaryHex}40` }}
                  className="w-12 h-12 rounded-2xl text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs"
                >
                  {activeDriver.firstName[0]}{activeDriver.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {activeDriver.firstName} {activeDriver.lastName}
                    </h2>
                    {myActiveMission ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <Car className="w-3 h-3 text-blue-600" />
                        <span>En mission active</span>
                      </span>
                    ) : activeDriver.available ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Disponible</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-slate-500" />
                        <span>Indisponible</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                      <span>Espace Privé</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Permis N° <span className="font-mono font-semibold text-slate-700">{activeDriver.licenseNumber}</span></span>
                    <span>&bull;</span>
                    <a href={`tel:${activeDriver.phone}`} className="hover:underline text-blue-600">
                      {activeDriver.phone}
                    </a>
                  </p>
                </div>
              </div>

              {/* Status toggle & Disconnect button */}
              <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  id="btn-toggle-driver-avail"
                  onClick={handleToggleAvailability}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                    activeDriver.available 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeDriver.available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{activeDriver.available ? 'Statut : Disponible' : 'Statut : En pause'}</span>
                </button>

                <button
                  type="button"
                  id="btn-disconnect-driver"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Se déconnecter de cet espace chauffeur"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                id="tab-new-missions"
                onClick={() => setActiveTab('new_missions')}
                style={activeTab === 'new_missions' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'new_missions'
                    ? 'text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Nouvelles Missions ({availableMissions.length})</span>
              </button>

              <button
                type="button"
                id="tab-active-mission"
                onClick={() => setActiveTab('active_mission')}
                style={activeTab === 'active_mission' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap relative ${
                  activeTab === 'active_mission'
                    ? 'text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Mission en cours</span>
                {myActiveMission && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                id="tab-missions-history"
                onClick={() => setActiveTab('history')}
                style={activeTab === 'history' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Historique ({myPastMissions.length})</span>
              </button>
            </div>

            {/* TAB 1: NOUVELLES MISSIONS (LOOK FOR A NEW MISSION) */}
            {activeTab === 'new_missions' && (
              <div className="space-y-4 animate-fade-in" id="driver-available-missions-list">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Missions & Courses Disponibles
                    </h3>
                    <p className="text-xs text-slate-500">
                      Consultez les demandes de location avec option chauffeur et postulez directement
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {availableMissions.length} disponible{availableMissions.length > 1 ? 's' : ''}
                  </span>
                </div>

                {availableMissions.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      Aucune nouvelle mission en attente pour le moment
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      Toutes les missions actuelles ont été attribuées ou ne requièrent pas de chauffeur. Restez connecté et vérifiez régulièrement cette page !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableMissions.map((rental) => {
                      const vehicle = getVehicle(rental.vehicleId);
                      const client = getClient(rental.clientId);
                      const estimatedDriverFee = (rental.driverDailyRate || 40) * rental.totalDays;

                      return (
                        <div
                          key={`avail-mission-${rental.id}`}
                          id={`mission-card-${rental.id}`}
                          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                        >
                          <div>
                            {/* Top row: Vehicle & fee badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
                                  <Car className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                                    {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'}
                                  </h4>
                                  <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 mt-0.5">
                                    {vehicle?.licensePlate}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 block">Indemnité estimée :</span>
                                <span className="text-sm font-extrabold text-emerald-700">
                                  {formatCurrency(estimatedDriverFee, settings)}
                                </span>
                              </div>
                            </div>

                            {/* Dates & duration */}
                            <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs text-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Période de mission :</span>
                                </span>
                                <span className="font-bold text-slate-900">
                                  {rental.startDate} &rarr; {rental.endDate}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Durée totale :</span>
                                <span className="font-bold text-slate-900">{rental.totalDays} jour(s)</span>
                              </div>
                            </div>

                            {/* Client & destination context */}
                            <div className="mt-3 text-xs text-slate-600 space-y-1">
                              <p className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-800">
                                  Client : {client ? (client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Client officiel'}
                                </span>
                              </p>
                              {client?.address && (
                                <p className="text-[11px] text-slate-500 pl-5 line-clamp-1">
                                  Prise en charge : {client.address}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Accept Action Button */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Réf: #{rental.rentalNumber}
                            </span>
                            <button
                              type="button"
                              id={`btn-accept-mission-${rental.id}`}
                              onClick={() => handleAcceptMission(rental)}
                              style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 10px ${theme.primaryHex}35` }}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accepter cette mission</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MISSION EN COURS (ACTIVE MISSION) */}
            {activeTab === 'active_mission' && (
              <div className="space-y-5 animate-fade-in" id="driver-active-mission-view">
                {myActiveMission ? (
                  (() => {
                    const vehicle = getVehicle(myActiveMission.vehicleId);
                    const client = getClient(myActiveMission.clientId);

                    return (
                      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                        
                        {/* Status Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                              <Car className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                                Mission Active en Cours
                              </span>
                              <h3 className="text-base sm:text-lg font-black text-slate-900">
                                {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 'Véhicule'}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Contrat #{myActiveMission.rentalNumber}
                            </span>
                          </div>
                        </div>

                        {/* Vehicle & Client Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          
                          {/* Left: Vehicle Specs */}
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-xs">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <Car className="w-4 h-4 text-slate-600" />
                              <span>Véhicule assigné</span>
                            </h4>
                            <div className="space-y-1.5 text-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Immatriculation :</span>
                                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {vehicle?.licensePlate}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Compteur actuel :</span>
                                <span className="font-bold text-slate-900">{vehicle?.currentMileage.toLocaleString()} km</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Transmission / Carburant :</span>
                                <span className="font-medium text-slate-900">{vehicle?.transmission || 'Manuelle'} &bull; {vehicle?.fuelType || 'Essence'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Départ - Fin :</span>
                                <span className="font-bold text-slate-900">{myActiveMission.startDate} au {myActiveMission.endDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Client Contact */}
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-xs">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-600" />
                              <span>Client & Contact direct</span>
                            </h4>
                            <div className="space-y-1.5 text-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Nom du client :</span>
                                <span className="font-bold text-slate-900">
                                  {client ? (client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Client'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Adresse de contact :</span>
                                <span className="font-medium text-slate-900 truncate max-w-[180px]">
                                  {client?.address || 'Non spécifiée'}
                                </span>
                              </div>
                            </div>

                            {/* Direct Call Button */}
                            {client?.phone && (
                              <div className="pt-2 flex items-center gap-2">
                                <a
                                  href={`tel:${client.phone}`}
                                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Appeler le client ({client.phone})</span>
                                </a>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Agency Contact & Emergency Box */}
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="font-bold">Consignes de l'agence ({settings.agencyName})</p>
                            <p className="text-[11px] text-amber-800">
                              En cas de retard client, d'incident ou de prolongation de mission, contactez immédiatement l'agence au <a href={`tel:${settings.phone}`} className="font-bold underline">{settings.phone}</a>.
                            </p>
                          </div>
                        </div>

                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Car className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      Vous n'avez pas de mission active aujourd'hui
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      Consultez l'onglet « Nouvelles Missions » pour postuler à des courses disponibles auprès de notre agence.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('new_missions')}
                      style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff' }}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Voir les missions disponibles</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HISTORIQUE DES MISSIONS */}
            {activeTab === 'history' && (
              <div className="space-y-4 animate-fade-in" id="driver-history-view">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Historique de vos courses terminées ({myPastMissions.length})
                  </h3>
                </div>

                {myPastMissions.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-600">Aucune mission terminée enregistrée pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myPastMissions.map((rental) => {
                      const vehicle = getVehicle(rental.vehicleId);
                      const client = getClient(rental.clientId);

                      return (
                        <div
                          key={`past-mission-${rental.id}`}
                          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                              <Car className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">
                                {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'} ({rental.totalDays}j)
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                Client : {client ? `${client.firstName} ${client.lastName}` : 'Client'} &bull; {rental.startDate} au {rental.endDate}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Terminée
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-1">
                              #{rental.rentalNumber}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
};
