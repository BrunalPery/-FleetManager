import React from 'react';
import { 
  Car, 
  KeyRound, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  ShieldAlert, 
  FileText, 
  Receipt, 
  Plus, 
  Phone, 
  Share2, 
  Mail, 
  UserCheck, 
  XCircle
} from 'lucide-react';
import { Vehicle, Rental, Client, Driver, AgencySettings } from '../types';
import { getTranslation } from '../translations';
import { formatCurrency } from '../utils/pdfGenerator';
import { FleetCalendar } from './FleetCalendar';

interface DashboardProps {
  vehicles: Vehicle[];
  rentals: Rental[];
  clients: Client[];
  drivers: Driver[];
  settings: AgencySettings;
  onNavigateTab: (tab: string) => void;
  onOpenNewRental: () => void;
  onOpenShareModal?: () => void;
  onOpenCheckOut: (rental: Rental) => void;
  onOpenCheckIn: (rental: Rental) => void;
  onGenerateContract: (rental: Rental) => void;
  onGenerateInvoice: (rental: Rental) => void;
  onOpenEmailsModal?: (rental: Rental) => void;
  onOpenDriverPortal?: (driverId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  vehicles,
  rentals,
  clients,
  drivers,
  settings,
  onNavigateTab,
  onOpenNewRental,
  onOpenShareModal,
  onOpenCheckOut,
  onOpenCheckIn,
  onGenerateContract,
  onGenerateInvoice,
  onOpenEmailsModal,
  onOpenDriverPortal
}) => {
  const t = getTranslation(settings.language);

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 1. Available vehicles count
  const availableVehiclesCount = vehicles.filter(v => v.status === 'available').length;

  // 2. Currently rented vehicles count
  const rentedVehiclesCount = vehicles.filter(v => v.status === 'rented').length;

  // Maintenance vehicles count
  const maintenanceVehiclesCount = vehicles.filter(v => v.status === 'maintenance').length;

  // Personnel / Drivers stats
  const availableDriversCount = drivers.filter(d => d.available).length;
  const onDutyDriversCount = rentals.filter(r => r.status === 'active' && r.driverId).length;

  // 3. Current month revenue (sum of totalAmount for returned rentals in the current month)
  const currentMonthRevenue = rentals
    .filter(r => {
      if (r.status !== 'returned') return false;
      const refDateStr = r.checkOut?.returnDate || r.invoiceDate || r.endDate;
      if (!refDateStr) return false;
      const refDate = new Date(refDateStr);
      return refDate.getMonth() === currentMonth && refDate.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + r.totalAmount, 0);

  // 4. Active rentals & Overdue detection
  const activeRentals = rentals.filter(r => r.status === 'active');

  // Overdue rentals: active rental whose endDate is strictly before today
  const overdueRentals = activeRentals.filter(r => r.endDate < todayStr);

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);
  const getDriver = (driverId?: string | null) => drivers.find(d => d.id === driverId);

  const calculateDaysOverdue = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date(todayStr);
    const diffTime = now.getTime() - end.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date(todayStr);
    const diffTime = end.getTime() - now.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-container">
      
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {t.dashboard}
            </h1>
            {onOpenShareModal && (
              <button
                id="dash-btn-share-top"
                onClick={onOpenShareModal}
                title="Partager le portail client ou lien d'enrôlement"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600 theme-icon shrink-0" />
                <span>Partager</span>
              </button>
            )}
          </div>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            {settings.agencyName} &bull; {new Date().toLocaleDateString(settings.language === 'ar' ? 'ar-SA' : settings.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="dash-btn-manage-personnel"
            onClick={() => onNavigateTab('drivers')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Gérer le personnel et les chauffeurs"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600 theme-icon shrink-0" />
            <span className="hidden sm:inline">Personnel ({drivers.length})</span>
            <span className="sm:hidden text-xs">Personnel</span>
          </button>
          <button
            id="dash-btn-fleet"
            onClick={() => onNavigateTab('vehicles')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Consulter et gérer la flotte de véhicules"
          >
            <Car className="w-3.5 h-3.5 text-blue-600 theme-icon shrink-0" />
            <span className="hidden sm:inline">Flotte ({vehicles.length})</span>
            <span className="sm:hidden text-xs">Flotte</span>
          </button>
          <button
            id="dash-btn-new-rental"
            onClick={onOpenNewRental}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newRental}</span>
          </button>
        </div>
      </div>

      {/* OVERDUE ALERT BANNER (Alerte ROUGE si la date de fin est dépassée) */}
      {overdueRentals.length > 0 && (
        <div 
          id="overdue-rentals-alert"
          className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-rose-950 flex items-center gap-2">
                  <span>{t.overdueAlertTitle}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                    {overdueRentals.length}
                  </span>
                </h3>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/90 px-2.5 py-1 rounded-lg">
                  Action Requise Immédiate
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-800 mt-1">
                {overdueRentals.length} {t.overdueAlertSubtitle}
              </p>

              {/* Overdue vehicles mini-cards */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {overdueRentals.map((rental) => {
                  const client = getClient(rental.clientId);
                  const vehicle = getVehicle(rental.vehicleId);
                  const daysLate = calculateDaysOverdue(rental.endDate);
                  return (
                    <div 
                      key={`overdue-${rental.id}`}
                      className="bg-white/95 border border-rose-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {vehicle?.licensePlate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{client ? `${client.firstName} ${client.lastName}` : 'Client'}</span>
                          {client?.phone && (
                            <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </a>
                          )}
                        </p>
                        <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Retard: {daysLate} {t.daysOverdue} (fin: {rental.endDate})</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        {onOpenEmailsModal && (
                          <button
                            type="button"
                            title="Historique des emails & relances"
                            onClick={() => onOpenEmailsModal(rental)}
                            className="p-2 text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          id={`btn-checkout-overdue-${rental.id}`}
                          onClick={() => onOpenCheckOut(rental)}
                          className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs text-center"
                        >
                          {t.checkOut}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI METRICS (Compteurs clés - Responsive 2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" id="kpi-cards-grid">
        
        {/* KPI 1: Véhicules Disponibles */}
        <div 
          onClick={() => onNavigateTab('vehicles')} 
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-emerald-300 transition-all cursor-pointer group"
          id="kpi-available-vehicles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.kpiAvailableVehicles}
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{availableVehiclesCount}</span>
            <span className="text-xs text-slate-400 font-medium">/ {vehicles.length}</span>
          </div>
          <div className="mt-2 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md w-fit">
            <span>Disponibles</span>
          </div>
        </div>

        {/* KPI 2: Véhicules En Location */}
        <div 
          onClick={() => onNavigateTab('rentals')} 
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-blue-300 transition-all cursor-pointer group"
          id="kpi-rented-vehicles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.kpiRentedVehicles}
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{rentedVehiclesCount}</span>
            <span className="text-xs text-slate-400 font-medium">loués</span>
          </div>
          <div className="mt-2 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md w-fit">
            <span>{activeRentals.length} en cours</span>
          </div>
        </div>

        {/* KPI 3: Chiffre d'affaires du mois en cours */}
        <div 
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-indigo-300 transition-all group"
          id="kpi-monthly-revenue"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.kpiMonthlyRevenue}
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 truncate">
              {formatCurrency(currentMonthRevenue, settings)}
            </span>
          </div>
          <div className="mt-2 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md w-fit">
            <span>Ce mois</span>
          </div>
        </div>

        {/* KPI 4: Flotte & Maintenance */}
        <div 
          onClick={() => onNavigateTab('vehicles')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-amber-300 transition-all cursor-pointer group"
          id="kpi-maintenance-vehicles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.kpiMaintenanceVehicles}
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{maintenanceVehiclesCount}</span>
            <span className="text-xs text-slate-400 font-medium">atelier</span>
          </div>
          <div className="mt-2 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md w-fit">
            <span>Total: {vehicles.length}</span>
          </div>
        </div>

      </div>

      {/* FLEET CALENDAR & SCHEDULE VIEW (Highlights upcoming start and end dates) */}
      <FleetCalendar
        rentals={rentals}
        vehicles={vehicles}
        clients={clients}
        drivers={drivers}
        settings={settings}
        onOpenCheckOut={onOpenCheckOut}
        onOpenCheckIn={onOpenCheckIn}
        onOpenEmailsModal={onOpenEmailsModal}
        onNavigateTab={onNavigateTab}
      />

      {/* ACTIVE RENTALS LIST (Liste des locations actives avec alerte rouge si dépassée) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="active-rentals-section">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{t.activeRentalsList}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {activeRentals.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Suivi en direct des véhicules actuellement confiés aux clients</p>
          </div>
          
          <button
            id="view-all-rentals-link"
            onClick={() => onNavigateTab('rentals')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>Voir toutes les locations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {activeRentals.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">{t.noActiveRentals}</p>
            <button
              onClick={onOpenNewRental}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une réservation</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View: Clean, soft stacked cards (Touch friendly) */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {activeRentals.map((rental) => {
                const client = getClient(rental.clientId);
                const vehicle = getVehicle(rental.vehicleId);
                const driver = getDriver(rental.driverId);
                const isOverdue = rental.endDate < todayStr;
                const daysRemaining = calculateDaysRemaining(rental.endDate);
                const daysOverdue = calculateDaysOverdue(rental.endDate);

                return (
                  <div 
                    key={`mobile-dash-rental-${rental.id}`}
                    className={`p-4 transition-colors ${isOverdue ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'}
                          </span>
                          <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {vehicle?.licensePlate}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 text-sm block">
                          {formatCurrency(rental.totalAmount, settings)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{rental.rentalNumber}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">
                          {client ? (client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Client'}
                        </span>
                      </div>

                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{daysOverdue}j retard</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {daysRemaining > 0 ? `${daysRemaining}j restants` : "Fin aujourd'hui"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {rental.startDate} &rarr; {rental.endDate}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {!rental.checkIn && (
                          <button
                            onClick={() => onOpenCheckIn(rental)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            {t.checkIn}
                          </button>
                        )}
                        <button
                          onClick={() => onOpenCheckOut(rental)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                        >
                          {t.checkOut}
                        </button>
                        <button
                          onClick={() => onGenerateContract(rental)}
                          title={t.generateContract}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {onOpenEmailsModal && (
                          <button
                            onClick={() => onOpenEmailsModal(rental)}
                            title="Emails & Notifications"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full detailed table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">{t.rentalNumber}</th>
                    <th className="px-6 py-3.5">{t.vehicle}</th>
                    <th className="px-6 py-3.5">{t.client}</th>
                    <th className="px-6 py-3.5">{t.startDate} & {t.endDate}</th>
                    <th className="px-6 py-3.5">{t.totalPrice}</th>
                    <th className="px-6 py-3.5">{t.status}</th>
                    <th className="px-6 py-3.5 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeRentals.map((rental) => {
                    const client = getClient(rental.clientId);
                    const vehicle = getVehicle(rental.vehicleId);
                    const driver = getDriver(rental.driverId);
                    const isOverdue = rental.endDate < todayStr;
                    const daysRemaining = calculateDaysRemaining(rental.endDate);
                    const daysOverdue = calculateDaysOverdue(rental.endDate);

                    return (
                      <tr 
                        key={rental.id} 
                        className={`transition-colors ${isOverdue ? 'bg-rose-50/60 hover:bg-rose-50' : 'hover:bg-slate-50/60'}`}
                        id={`rental-row-${rental.id}`}
                      >
                        {/* Rental ID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900">{rental.rentalNumber}</span>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {rental.totalDays} {t.days}
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {vehicle?.imageUrl && (
                              <img 
                                src={vehicle.imageUrl} 
                                alt={vehicle.model}
                                className="w-12 h-9 object-cover rounded-lg border border-slate-200 hidden sm:block shrink-0" 
                              />
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule inconnu'}
                              </span>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {vehicle?.licensePlate}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {client ? (client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Client inconnu'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {client?.phone || client?.email}
                          </div>
                          {driver && (
                            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                              Chauffeur : {driver.firstName} {driver.lastName}
                            </div>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-800">
                            {rental.startDate} <span className="text-slate-400">&rarr;</span> {rental.endDate}
                          </div>
                          <div className="mt-1">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{daysOverdue} {t.daysOverdue}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                <span>{daysRemaining > 0 ? `${daysRemaining} ${t.daysRemaining}` : "Se termine aujourd'hui"}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Price */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(rental.totalAmount, settings)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOverdue ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                              Retard de retour
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {t.active}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!rental.checkIn && (
                              <button
                                title={t.checkIn}
                                onClick={() => onOpenCheckIn(rental)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                {t.checkIn}
                              </button>
                            )}

                            <button
                              title={t.checkOut}
                              onClick={() => onOpenCheckOut(rental)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                            >
                              {t.checkOut}
                            </button>

                            <button
                              title={t.generateContract}
                              onClick={() => onGenerateContract(rental)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {onOpenEmailsModal && (
                              <button
                                title="Historique des emails & notifications"
                                onClick={() => onOpenEmailsModal(rental)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* SECTION GESTION DU PERSONNEL & CHAUFFEURS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="dashboard-personnel-section">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Gestion du Personnel & Chauffeurs</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {drivers.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statut de l'équipe de conduite, permis et affectations en temps réel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{availableDriversCount} dispo</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/60">
                <Car className="w-3.5 h-3.5 text-blue-600" />
                <span>{onDutyDriversCount} en mission</span>
              </span>
            </div>

            <button
              id="dash-btn-open-drivers-manager"
              type="button"
              onClick={() => onNavigateTab('drivers')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <span>Gérer le personnel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chauffeurs Cards Grid */}
        <div className="p-4 sm:p-6">
          {drivers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">Aucun chauffeur enregistré pour le moment.</p>
              <button
                type="button"
                onClick={() => onNavigateTab('drivers')}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
              >
                + Ajouter un membre du personnel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="dashboard-drivers-grid">
              {drivers.map(driver => {
                const assignedRental = rentals.find(r => r.status === 'active' && r.driverId === driver.id);
                const assignedVehicle = assignedRental ? vehicles.find(v => v.id === assignedRental.vehicleId) : null;
                const isOnMission = !!assignedRental;

                return (
                  <div
                    key={driver.id}
                    id={`dash-driver-card-${driver.id}`}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all bg-slate-50/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center shadow-2xs">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 leading-tight">
                              {driver.firstName} {driver.lastName}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">Permis N° {driver.licenseNumber}</p>
                          </div>
                        </div>

                        {isOnMission ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">
                            <Car className="w-3 h-3 text-blue-600" />
                            <span>En mission</span>
                          </span>
                        ) : driver.available ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disponible</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 shrink-0">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Indisponible</span>
                          </span>
                        )}
                      </div>

                      {/* Mission context or availability info */}
                      <div className="mt-3 text-xs">
                        {isOnMission && assignedVehicle ? (
                          <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/60 text-blue-900 space-y-0.5">
                            <p className="font-semibold text-[11px] flex items-center gap-1">
                              <Car className="w-3 h-3 text-blue-700" />
                              <span>{assignedVehicle.make} {assignedVehicle.model} ({assignedVehicle.licensePlate})</span>
                            </p>
                            <p className="text-[10px] text-blue-700">
                              Contrat #{assignedRental?.rentalNumber} &bull; Retour prévu le {assignedRental?.endDate}
                            </p>
                          </div>
                        ) : driver.available ? (
                          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Prêt pour une nouvelle affectation</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Non disponible pour le moment
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                      <a
                        href={`tel:${driver.phone}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                        title="Appeler le chauffeur"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{driver.phone}</span>
                      </a>

                      <div className="flex items-center gap-2">
                        {onOpenDriverPortal && (
                          <button
                            type="button"
                            onClick={() => onOpenDriverPortal(driver.id)}
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors"
                            title="Connecter et ouvrir le portail pour ce chauffeur"
                          >
                            Espace Chauffeur &rarr;
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigateTab('drivers')}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Gérer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
