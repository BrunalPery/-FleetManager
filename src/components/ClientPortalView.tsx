import React, { useState, useMemo, useEffect } from 'react';
import { 
  Car, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Download, 
  Share2, 
  Sparkles, 
  Fuel, 
  Users, 
  ShieldCheck, 
  Zap, 
  X,
  FileText,
  Receipt,
  UserCheck,
  Check,
  AlertCircle,
  Upload,
  Camera,
  FileCheck,
  CreditCard
} from 'lucide-react';
import { Vehicle, Rental, Client, Driver, AgencySettings } from '../types';
import { formatCurrency, generateContractPdf, generateInvoicePdf } from '../utils/pdfGenerator';
import { getThemeClasses, applyThemeCSS } from '../utils/theme';

interface ClientPortalViewProps {
  settings: AgencySettings;
  vehicles: Vehicle[];
  rentals: Rental[];
  clients: Client[];
  drivers: Driver[];
  onBackToAdmin?: () => void;
  isPublicView?: boolean;
  onClientSubmitRental: (
    newRental: Rental, 
    clientData: { 
      firstName: string; 
      lastName: string; 
      phone: string; 
      email: string;
      driverLicenseNumber?: string;
      driverLicenseDate?: string;
      driverLicensePhoto?: string;
    }
  ) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  settings,
  vehicles,
  rentals,
  clients,
  drivers,
  onBackToAdmin,
  isPublicView,
  onClientSubmitRental
}) => {
  const theme = getThemeClasses(settings.themeColor);

  // Detect if opened through public showcase link (?portal=true)
  const isPublicUrl = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('portal') === 'true' ||
    window.location.search.includes('portal=true')
  );
  const isPublic = isPublicView ?? isPublicUrl;

  // Automatically adapt and synchronize theme CSS variables
  useEffect(() => {
    applyThemeCSS(settings.themeColor || 'blue');
  }, [settings.themeColor]);

  // Navigation tabs inside portal
  const [activePortalTab, setActivePortalTab] = useState<'catalog' | 'tracking'>('catalog');
  
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Booking modal for client
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  
  // Booking form state
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [bookingStartDate, setBookingStartDate] = useState(todayStr);
  const [bookingEndDate, setBookingEndDate] = useState(tomorrowStr);
  const [withDriver, setWithDriver] = useState(false);
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverLicenseDate, setDriverLicenseDate] = useState('');
  const [driverLicensePhoto, setDriverLicensePhoto] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string>('');
  const [licenseError, setLicenseError] = useState<string>('');
  const [bookingSuccessRental, setBookingSuccessRental] = useState<Rental | null>(null);

  // File upload handler for client driving license
  const handleLicenseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDriverLicensePhoto(event.target.result as string);
        setLicenseError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Tracking tab state
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackedRental, setTrackedRental] = useState<Rental | null>(null);
  const [trackingSearched, setTrackingSearched] = useState(false);

  // Filter available vehicles for client
  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Must be available
      if (v.status !== 'available') return false;

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = (v.category || '').toLowerCase();
        if (selectedCategory === 'suv' && !cat.includes('suv') && !v.model.toLowerCase().includes('suv')) return false;
        if (selectedCategory === 'berline' && !cat.includes('berline') && !v.model.toLowerCase().includes('berline')) return false;
        if (selectedCategory === 'citadine' && !cat.includes('citadine') && !v.model.toLowerCase().includes('208') && !v.model.toLowerCase().includes('clio')) return false;
        if (selectedCategory === 'electric' && !cat.includes('hybride') && !cat.includes('électrique') && !(v.fuelType || '').toLowerCase().includes('hybride') && !(v.fuelType || '').toLowerCase().includes('électrique')) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          (v.category || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [vehicles, selectedCategory, searchTerm]);

  // Pricing calculation for active booking modal
  const bookingDays = useMemo(() => {
    if (!bookingStartDate || !bookingEndDate) return 1;
    const s = new Date(bookingStartDate).getTime();
    const e = new Date(bookingEndDate).getTime();
    if (e < s) return 1;
    return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  }, [bookingStartDate, bookingEndDate]);

  const bookingTotalVehicle = bookingVehicle ? bookingVehicle.dailyRate * bookingDays : 0;
  const bookingTotalDriver = bookingVehicle && withDriver ? bookingVehicle.driverSupplement * bookingDays : 0;
  const bookingGrandTotal = bookingTotalVehicle + bookingTotalDriver;

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVehicle) return;

    // Validation: Driver license is mandatory when renting WITHOUT driver
    if (!withDriver && !driverLicenseNumber.trim()) {
      setLicenseError('Le numéro de permis de conduire est obligatoire pour la réservation sans chauffeur.');
      return;
    }
    setLicenseError('');

    const rentalCount = rentals.length + 1;
    const rentalNumber = `LOC-${new Date().getFullYear()}-${String(rentalCount).padStart(3, '0')}`;
    const contractNumber = `CTR-${new Date().getFullYear()}-${String(rentalCount).padStart(3, '0')}`;
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(rentalCount).padStart(3, '0')}`;

    // Available driver if requested
    const availableDriver = withDriver ? drivers.find(d => d.available) : null;

    const newRental: Rental = {
      id: `rent-${Date.now()}`,
      rentalNumber,
      contractNumber,
      invoiceNumber,
      clientId: `cli-${Date.now()}`, // will be associated or created
      vehicleId: bookingVehicle.id,
      driverId: availableDriver ? availableDriver.id : null,
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      totalDays: bookingDays,
      vehicleDailyRate: bookingVehicle.dailyRate,
      driverDailyRate: withDriver ? bookingVehicle.driverSupplement : 0,
      totalVehicleCost: bookingTotalVehicle,
      totalDriverCost: bookingTotalDriver,
      totalAmount: bookingGrandTotal,
      status: 'active',
      notes: withDriver 
        ? `Réservation vitrine avec chauffeur privé. Client: ${clientFirstName} ${clientLastName} (${clientPhone})`
        : `Réservation vitrine SANS chauffeur (Permis N° ${driverLicenseNumber}). Client: ${clientFirstName} ${clientLastName} (${clientPhone})`,
      createdAt: new Date().toISOString()
    };

    onClientSubmitRental(newRental, {
      firstName: clientFirstName,
      lastName: clientLastName,
      phone: clientPhone,
      email: clientEmail || `${clientFirstName.toLowerCase()}@client.com`,
      driverLicenseNumber: !withDriver ? driverLicenseNumber.trim() : undefined,
      driverLicenseDate: !withDriver ? (driverLicenseDate || undefined) : undefined,
      driverLicensePhoto: !withDriver ? (driverLicensePhoto || undefined) : undefined
    });

    setBookingSuccessRental(newRental);
  };

  // Search rental for tracking
  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingSearched(true);
    const q = trackingQuery.trim().toUpperCase();
    if (!q) {
      setTrackedRental(null);
      return;
    }

    const found = rentals.find(r => 
      r.rentalNumber.toUpperCase() === q ||
      (r.contractNumber && r.contractNumber.toUpperCase() === q) ||
      (r.invoiceNumber && r.invoiceNumber.toUpperCase() === q)
    );

    setTrackedRental(found || null);
  };

  // Download contract or invoice from tracking tab
  const handleDownloadTrackingContract = (rental: Rental) => {
    const v = vehicles.find(item => item.id === rental.vehicleId) || vehicles[0];
    const c = clients.find(item => item.id === rental.clientId) || {
      id: 'c',
      firstName: clientFirstName || 'Client',
      lastName: clientLastName || '',
      email: clientEmail,
      phone: clientPhone,
      address: settings.address,
      idNumber: 'Validée',
      type: 'individual' as const
    };
    const d = rental.driverId ? drivers.find(item => item.id === rental.driverId) || null : null;
    generateContractPdf(rental, c, v, d, settings, true);
  };

  const handleDownloadTrackingInvoice = (rental: Rental) => {
    const v = vehicles.find(item => item.id === rental.vehicleId) || vehicles[0];
    const c = clients.find(item => item.id === rental.clientId) || {
      id: 'c',
      firstName: clientFirstName || 'Client',
      lastName: clientLastName || '',
      email: clientEmail,
      phone: clientPhone,
      address: settings.address,
      idNumber: 'Validée',
      type: 'individual' as const
    };
    const d = rental.driverId ? drivers.find(item => item.id === rental.driverId) || null : null;
    generateInvoicePdf(rental, c, v, d, settings, true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800 p-3.5 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden" id="client-portal-root">
      
      {/* ========================================================= */}
      {/* OWNER ADMIN BANNER: Only shown when owner tests the view internally; COMPLETELY HIDDEN when public link is shared */}
      {/* ========================================================= */}
      {!isPublic && onBackToAdmin && (
        <div className="max-w-4xl mx-auto mb-4 bg-slate-900 text-white px-3.5 sm:px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="font-semibold truncate">Aperçu Interne Propriétaire</span>
            <span className="hidden md:inline text-slate-400">&bull; Non visible sur le lien public partagé aux clients</span>
          </div>
          
          <button
            type="button"
            onClick={onBackToAdmin}
            id="btn-return-admin-dashboard"
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-bold transition-colors active:scale-95 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Fermer l'aperçu</span>
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        
        {/* ========================================================= */}
        {/* AGENCY BRANDED HERO HEADER (Directly inspired by IMG_1446) */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-7 md:p-8 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div 
                  style={{ backgroundColor: 'var(--theme-color)', boxShadow: `0 4px 14px ${theme.primaryHex}40` }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-white flex items-center justify-center shadow-xs shrink-0 transition-transform hover:scale-105"
                >
                  <Car className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                    {settings.agencyName}
                  </h1>
                  <p className="text-xs text-slate-500 truncate">{settings.slogan}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Bonjour !
                </span>
                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Que recherchez-vous ?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Découvrez nos véhicules disponibles immédiatement et réservez en quelques clics.
                </p>
              </div>
            </div>

            {/* Direct Contact Button */}
            <div className="flex items-center sm:items-end justify-between sm:justify-start sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" style={{ color: 'var(--theme-color)' }} />
                <span>{settings.phone}</span>
              </a>
              <span className="text-[11px] text-slate-400 font-medium">
                {settings.city}
              </span>
            </div>
          </div>

          {/* Tab Navigation: Catalog vs Tracking (Fluid grid on mobile) */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl w-full sm:w-fit">
            <button
              type="button"
              id="portal-tab-catalog"
              onClick={() => setActivePortalTab('catalog')}
              style={activePortalTab === 'catalog' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                activePortalTab === 'catalog'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Véhicules ({availableVehicles.length})
            </button>
            <button
              type="button"
              id="portal-tab-tracking"
              onClick={() => setActivePortalTab('tracking')}
              style={activePortalTab === 'tracking' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                activePortalTab === 'tracking'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: activePortalTab === 'tracking' ? '#ffffff' : 'var(--theme-color)' }} />
              <span>Suivre Réservation</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: VEHICLE CATALOG & DIRECT BOOKING */}
        {/* ========================================================= */}
        {activePortalTab === 'catalog' && (
          <div className="space-y-5 sm:space-y-6">
            
            {/* Search and Category Filter (IMG_1446 style pills) */}
            <div className="space-y-2.5">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une marque, un modèle (ex: Peugeot, Golf, SUV)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-white border border-slate-200/80 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Horizontal Category Pills with Icons (Edge-to-edge scroll on mobile) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
                {[
                  { id: 'all', label: 'Toutes', icon: Car },
                  { id: 'suv', label: 'SUV', icon: Car },
                  { id: 'berline', label: 'Berlines', icon: Car },
                  { id: 'citadine', label: 'Citadines', icon: Car },
                  { id: 'electric', label: 'Électriques & Hybrides', icon: Zap },
                ].map(cat => {
                  const Icon = cat.icon;
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={isSel ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
                      className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                        isSel
                          ? 'text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: isSel ? '#ffffff' : 'var(--theme-color)' }} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Grid (Cards directly styled like IMG_1446) */}
            {availableVehicles.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Aucun véhicule disponible</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tous les véhicules de cette catégorie sont actuellement loués ou indisponibles. N'hésitez pas à nous contacter directement par téléphone.
                </p>
                <a
                  href={`tel:${settings.phone}`}
                  style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}30` }}
                  className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contacter l'agence</span>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {availableVehicles.map(vehicle => {
                  return (
                    <div 
                      key={vehicle.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
                    >
                      {/* Vehicle Image */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img 
                          src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'} 
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Status badge */}
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-800 shadow-xs border border-emerald-100 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Disponible</span>
                        </div>

                        {/* Year pill */}
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs">
                          {vehicle.year}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {vehicle.category || 'Véhicule de tourisme'}
                          </p>
                          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {vehicle.make} {vehicle.model}
                          </h3>

                          {/* Feature Badges (IMG_1446 style) */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                              <Fuel className="w-3 h-3 text-slate-400" />
                              <span>{vehicle.fuelType || 'Essence'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                              <Sparkles className="w-3 h-3 text-slate-400" />
                              <span>{vehicle.transmission || 'Automatique'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>5 places</span>
                            </span>
                          </div>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                                {formatCurrency(vehicle.dailyRate, settings)}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">/ jour</span>
                            </div>
                            {vehicle.driverSupplement > 0 && (
                              <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--theme-color)' }}>
                                Option chauffeur : +{formatCurrency(vehicle.driverSupplement, settings)}/j
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setBookingVehicle(vehicle);
                              setBookingSuccessRental(null);
                              setDriverLicenseNumber('');
                              setDriverLicenseDate('');
                              setDriverLicensePhoto(null);
                              setLicenseFileName('');
                              setLicenseError('');
                            }}
                            style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 10px ${theme.primaryHex}35` }}
                            className="hover:opacity-90 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
                          >
                            Réserver
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: TRACK MY RENTAL / DOWNLOAD CONTRACT & INVOICE */}
        {/* ========================================================= */}
        {activePortalTab === 'tracking' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Suivi de Réservation & Documents</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Consultez les détails de votre location et téléchargez votre contrat officiel ou votre facture en format PDF.
              </p>
            </div>

            <form onSubmit={handleSearchTracking} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Entrez votre numéro (ex: LOC-2026-001 ou CTR-2026-001)..."
                value={trackingQuery}
                onChange={e => setTrackingQuery(e.target.value)}
                className="flex-1 px-4 py-3 text-xs sm:text-sm font-mono border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 uppercase"
              />
              <button
                type="submit"
                style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` }}
                className="hover:opacity-90 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-opacity"
              >
                Rechercher
              </button>
            </form>

            {trackingSearched && !trackedRental && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Aucune réservation trouvée pour cette référence. Vérifiez votre numéro de location (ex: LOC-2026-001).</span>
              </div>
            )}

            {trackedRental && (
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Réservation trouvée
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      N° {trackedRental.rentalNumber}
                    </h3>
                  </div>

                  <span 
                    style={trackedRental.status === 'active' ? { backgroundColor: 'var(--theme-color-light)', color: 'var(--theme-color-dark)', borderColor: 'var(--theme-color-border)' } : {}}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto border ${
                    trackedRental.status === 'active' 
                      ? '' 
                      : trackedRental.status === 'returned'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-slate-200 text-slate-800 border-slate-300'
                  }`}>
                    {trackedRental.status === 'active' ? 'Location en cours' : trackedRental.status === 'returned' ? 'Véhicule restitué' : 'Confirmée'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Période :</span>
                    <span className="font-semibold text-slate-800">{trackedRental.startDate} au {trackedRental.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Durée :</span>
                    <span className="font-semibold text-slate-800">{trackedRental.totalDays} jour(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Montant Total :</span>
                    <span className="font-bold text-slate-900">{formatCurrency(trackedRental.totalAmount, settings)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Chauffeur :</span>
                    <span className="font-semibold text-slate-800">{trackedRental.driverId ? 'Avec chauffeur privé' : 'Sans chauffeur'}</span>
                  </div>
                </div>

                {/* PDF Download Buttons */}
                <div className="pt-3 border-t border-slate-200/60 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadTrackingContract(trackedRental)}
                    style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}30` }}
                    className="flex items-center gap-2 hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger le Contrat (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadTrackingInvoice(trackedRental)}
                    className="flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger la Facture (PDF)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* CLIENT BOOKING MODAL */}
      {/* ========================================================= */}
      {bookingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200/80 my-auto max-h-[92vh] overflow-y-auto no-scrollbar animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Réserver {bookingVehicle.make} {bookingVehicle.model}
                </h3>
                <p className="text-xs text-slate-500">
                  Complétez votre demande de réservation en direct
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingVehicle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccessRental ? (
              /* Success Message */
              <div className="mt-5 text-center space-y-4 py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    Réservation Confirmée !
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Votre réservation a bien été transmise à <strong>{settings.agencyName}</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Numéro de réservation :</span>
                    <span className="font-mono font-bold text-slate-900">{bookingSuccessRental.rentalNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Véhicule :</span>
                    <span className="font-semibold text-slate-800">{bookingVehicle.make} {bookingVehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Durée :</span>
                    <span className="font-semibold text-slate-800">{bookingDays} jours ({bookingStartDate} au {bookingEndDate})</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Total estimé :</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(bookingGrandTotal, settings)}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadTrackingContract(bookingSuccessRental)}
                    style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 12px ${theme.primaryHex}35` }}
                    className="w-full flex items-center justify-center gap-2 hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-xs transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger mon Contrat PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingVehicle(null)}
                    className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4">
                
                {/* Dates Selection */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Date départ *</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={bookingStartDate}
                      onChange={e => setBookingStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Date retour *</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={bookingStartDate}
                      value={bookingEndDate}
                      onChange={e => setBookingEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                    <span>Durée totale :</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {bookingDays} jour(s)
                    </span>
                  </div>
                </div>

                {/* Mode de conduite : Sans chauffeur vs Avec chauffeur */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Mode de conduite souhaité *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      id="portal-btn-without-driver"
                      onClick={() => {
                        setWithDriver(false);
                        setLicenseError('');
                      }}
                      style={!withDriver ? { borderColor: 'var(--theme-color)', boxShadow: `0 0 0 2px ${theme.primaryHex}` } : {}}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        !withDriver 
                          ? 'bg-white shadow-xs' 
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="w-4 h-4 shrink-0" style={{ color: !withDriver ? 'var(--theme-color)' : '#64748b' }} />
                        <span className="text-xs font-bold text-slate-900">Sans chauffeur</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Conduite autonome &bull; Permis requis</p>
                    </button>

                    <button
                      type="button"
                      id="portal-btn-with-driver"
                      onClick={() => {
                        setWithDriver(true);
                        setLicenseError('');
                      }}
                      style={withDriver ? { borderColor: 'var(--theme-color)', boxShadow: `0 0 0 2px ${theme.primaryHex}` } : {}}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        withDriver 
                          ? 'bg-white shadow-xs' 
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-4 h-4 shrink-0" style={{ color: withDriver ? 'var(--theme-color)' : '#64748b' }} />
                        <span className="text-xs font-bold text-slate-900">Avec chauffeur</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {bookingVehicle.driverSupplement > 0 
                          ? `+${formatCurrency(bookingVehicle.driverSupplement, settings)} / j`
                          : 'Chauffeur inclus'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Section Permis de Conduire : Requis si SANS chauffeur */}
                {!withDriver ? (
                  <div className="space-y-3 p-3.5 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" style={{ color: 'var(--theme-color)' }} />
                        <span>Permis de Conduire Obligatoire</span>
                      </label>
                      <span 
                        style={{ backgroundColor: 'var(--theme-color-light)', color: 'var(--theme-color-dark)' }}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      >
                        Sans chauffeur
                      </span>
                    </div>

                    {licenseError && (
                      <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{licenseError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Numéro du permis de conduire *
                        </label>
                        <input
                          type="text"
                          required
                          id="portal-input-license-number"
                          placeholder="Ex: 12AB34567 ou 99999999"
                          value={driverLicenseNumber}
                          onChange={e => {
                            setDriverLicenseNumber(e.target.value);
                            if (licenseError) setLicenseError('');
                          }}
                          className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Date de délivrance du permis
                        </label>
                        <input
                          type="date"
                          id="portal-input-license-date"
                          max={todayStr}
                          value={driverLicenseDate}
                          onChange={e => setDriverLicenseDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {/* Zone de téléversement du justificatif de permis */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Photo ou scan du permis de conduire</span>
                        <span className="text-[10px] text-slate-400 font-normal">JPG, PNG ou PDF</span>
                      </label>

                      {driverLicensePhoto ? (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {driverLicensePhoto.startsWith('data:image') ? (
                              <img 
                                src={driverLicensePhoto} 
                                alt="Permis" 
                                className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shrink-0 shadow-2xs" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                <FileCheck className="w-5 h-5" />
                              </div>
                            )}
                            <div className="truncate">
                              <p className="text-xs font-bold text-emerald-900 truncate">
                                {licenseFileName || 'Permis de conduire joint'}
                              </p>
                              <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Document prêt pour le contrat
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDriverLicensePhoto(null);
                              setLicenseFileName('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            title="Supprimer le document"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl cursor-pointer bg-white transition-colors">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Upload className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-color)' }} />
                            <span className="text-xs font-semibold">Téléverser mon permis de conduire</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Prenez une photo ou sélectionnez un fichier (Recto/Verso)
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleLicenseFileUpload}
                            className="hidden"
                            id="portal-license-file-input"
                          />
                        </label>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      * Conformément aux conditions de location autonome de <strong>{settings.agencyName}</strong>, l'original du permis de conduire sera vérifié lors de la remise des clés du véhicule.
                    </p>
                  </div>
                ) : (
                  <div 
                    style={{ backgroundColor: 'var(--theme-color-light)', borderColor: 'var(--theme-color-border)' }}
                    className="p-3 rounded-2xl border flex items-start gap-2.5 animate-fade-in"
                  >
                    <UserCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--theme-color)' }} />
                    <div className="text-xs">
                      <p className="font-bold" style={{ color: 'var(--theme-color-dark)' }}>Chauffeur Privé Inclus</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-color-dark)' }}>
                        Vous avez choisi l'option avec chauffeur privé. Aucun permis de conduire n'est exigé : notre chauffeur professionnel conduit pour vous.
                      </p>
                    </div>
                  </div>
                )}

                {/* Coordonnées Client */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-bold text-slate-900">Vos Coordonnées</p>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Prénom *"
                        value={clientFirstName}
                        onChange={e => setClientFirstName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Nom *"
                        value={clientLastName}
                        onChange={e => setClientLastName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Téléphone *"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (optionnel)"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Summary */}
                <div 
                  style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}35` }}
                  className="p-3.5 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="text-white/80 block text-[10px]">Total de la réservation :</span>
                    <span className="text-base font-extrabold">{formatCurrency(bookingGrandTotal, settings)}</span>
                  </div>
                  <span className="text-[11px] text-white/90">TVA comprise</span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}40` }}
                  className="w-full hover:opacity-90 text-white py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-transform active:scale-[0.99] cursor-pointer"
                >
                  Confirmer la réservation
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
