import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Car, 
  User, 
  UserCheck, 
  LogIn, 
  LogOut, 
  Receipt, 
  Calendar,
  Phone,
  Eye,
  Filter,
  Mail,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Tag,
  Coins
} from 'lucide-react';
import { Rental, Vehicle, Client, Driver, AgencySettings, RentalStatus } from '../types';
import { getTranslation } from '../translations';
import { formatCurrency } from '../utils/pdfGenerator';

interface RentalsManagerProps {
  rentals: Rental[];
  setRentals: React.Dispatch<React.SetStateAction<Rental[]>>;
  vehicles: Vehicle[];
  clients: Client[];
  drivers: Driver[];
  settings: AgencySettings;
  onOpenNewRental: () => void;
  onOpenCheckIn: (rental: Rental) => void;
  onOpenCheckOut: (rental: Rental) => void;
  onGenerateContract: (rental: Rental) => void;
  onGenerateInvoice: (rental: Rental) => void;
  onOpenEmailsModal: (rental: Rental) => void;
}

export const RentalsManager: React.FC<RentalsManagerProps> = ({
  rentals,
  setRentals,
  vehicles,
  clients,
  drivers,
  settings,
  onOpenNewRental,
  onOpenCheckIn,
  onOpenCheckOut,
  onGenerateContract,
  onGenerateInvoice,
  onOpenEmailsModal
}) => {
  const t = getTranslation(settings.language);
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7); // 'YYYY-MM'

  // Search & Multi-criteria filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned' | 'overdue'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<'all' | 'with_driver' | 'without_driver'>('all');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'upcoming' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'start_desc' | 'start_asc' | 'end_asc' | 'amount_desc' | 'amount_asc'>('start_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);
  const getDriver = (driverId?: string | null) => drivers.find(d => d.id === driverId);

  const calculateDaysOverdue = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date(todayStr);
    const diffTime = now.getTime() - end.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  };

  // Sorted lists for dropdowns
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const nameA = a.type === 'company' && a.companyName ? a.companyName : `${a.lastName} ${a.firstName}`;
      const nameB = b.type === 'company' && b.companyName ? b.companyName : `${b.lastName} ${b.firstName}`;
      return nameA.localeCompare(nameB);
    });
  }, [clients]);

  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));
  }, [vehicles]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim() !== '') count++;
    if (statusFilter !== 'all') count++;
    if (clientFilter !== 'all') count++;
    if (vehicleFilter !== 'all') count++;
    if (driverFilter !== 'all') count++;
    if (dateFilterMode !== 'all') count++;
    if (customStartDate || customEndDate) count++;
    return count;
  }, [searchTerm, statusFilter, clientFilter, vehicleFilter, driverFilter, dateFilterMode, customStartDate, customEndDate]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setClientFilter('all');
    setVehicleFilter('all');
    setDriverFilter('all');
    setDateFilterMode('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('start_desc');
  };

  // Filtered and sorted rentals
  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const client = getClient(rental.clientId);
      const vehicle = getVehicle(rental.vehicleId);
      const driver = getDriver(rental.driverId);
      const isOverdue = rental.status === 'active' && rental.endDate < todayStr;

      // 1. Text Search Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const clientName = client ? `${client.firstName} ${client.lastName} ${client.companyName || ''} ${client.phone} ${client.email} ${client.driverLicenseNumber || ''}`.toLowerCase() : '';
        const vehicleInfo = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate} ${vehicle.category || ''}`.toLowerCase() : '';
        const driverInfo = driver ? `${driver.firstName} ${driver.lastName} ${driver.phone}`.toLowerCase() : '';
        const refNumbers = `${rental.rentalNumber} ${rental.contractNumber || ''} ${rental.invoiceNumber || ''}`.toLowerCase();

        const matchesSearch = 
          refNumbers.includes(query) ||
          clientName.includes(query) ||
          vehicleInfo.includes(query) ||
          driverInfo.includes(query);

        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'active' && (rental.status !== 'active' || isOverdue)) return false;
      if (statusFilter === 'overdue' && !isOverdue) return false;
      if (statusFilter === 'returned' && rental.status !== 'returned') return false;

      // 3. Client Filter
      if (clientFilter !== 'all' && rental.clientId !== clientFilter) return false;

      // 4. Vehicle Filter
      if (vehicleFilter !== 'all' && rental.vehicleId !== vehicleFilter) return false;

      // 5. Driver Filter
      const hasDriver = rental.driverDailyRate > 0 || !!rental.driverId;
      if (driverFilter === 'with_driver' && !hasDriver) return false;
      if (driverFilter === 'without_driver' && hasDriver) return false;

      // 6. Date Filter
      if (dateFilterMode === 'today') {
        // Active today
        if (!(rental.startDate <= todayStr && rental.endDate >= todayStr)) return false;
      } else if (dateFilterMode === 'upcoming') {
        // Starts in the future
        if (!(rental.startDate > todayStr)) return false;
      } else if (dateFilterMode === 'this_month') {
        // Active at any point in current month
        const inMonth = rental.startDate.startsWith(currentMonthStr) || rental.endDate.startsWith(currentMonthStr);
        if (!inMonth) return false;
      } else if (dateFilterMode === 'custom') {
        if (customStartDate && rental.endDate < customStartDate) return false;
        if (customEndDate && rental.startDate > customEndDate) return false;
      }

      // Independent custom start/end date overrides
      if (customStartDate && dateFilterMode !== 'custom' && rental.endDate < customStartDate) return false;
      if (customEndDate && dateFilterMode !== 'custom' && rental.startDate > customEndDate) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'start_asc':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'end_asc':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'amount_desc':
          return b.totalAmount - a.totalAmount;
        case 'amount_asc':
          return a.totalAmount - b.totalAmount;
        case 'start_desc':
        default:
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
    });
  }, [
    rentals, 
    clients, 
    vehicles, 
    drivers, 
    searchTerm, 
    statusFilter, 
    clientFilter, 
    vehicleFilter, 
    driverFilter, 
    dateFilterMode, 
    customStartDate, 
    customEndDate, 
    sortBy, 
    todayStr, 
    currentMonthStr
  ]);

  // Statistics for quick status buttons
  const countAll = rentals.length;
  const countActive = rentals.filter(r => r.status === 'active' && r.endDate >= todayStr).length;
  const countOverdue = rentals.filter(r => r.status === 'active' && r.endDate < todayStr).length;
  const countReturned = rentals.filter(r => r.status === 'returned').length;

  // Total financial sum of displayed rentals
  const totalFilteredAmount = useMemo(() => {
    return filteredRentals.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [filteredRentals]);

  const selectedClientObj = clientFilter !== 'all' ? getClient(clientFilter) : null;
  const selectedVehicleObj = vehicleFilter !== 'all' ? getVehicle(vehicleFilter) : null;

  return (
    <div className="space-y-6" id="rentals-manager-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <span>{t.rentals}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {rentals.length}
            </span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Cycle complet de location : réservation, état des lieux (Check-in/out), contrats et facturation
          </p>
        </div>

        <button
          id="btn-rentals-new"
          onClick={onOpenNewRental}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newRental}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SEARCH BAR & MULTI-CRITERIA FILTERS CARD */}
      {/* ========================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
        
        {/* Top Control Bar: Search Input + Status Pills + Filter Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="rental-search-input"
              type="text"
              placeholder="Rechercher par n° de location, contrat, client, immatriculation, chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/70"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <button
              type="button"
              id="filter-status-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Toutes ({countAll})
            </button>

            <button
              type="button"
              id="filter-status-active"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'active' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-blue-50/80 text-blue-800 hover:bg-blue-100/70'
              }`}
            >
              En cours ({countActive})
            </button>

            <button
              type="button"
              id="filter-status-overdue"
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'overdue' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-rose-50/80 text-rose-800 hover:bg-rose-100/70'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>En retard ({countOverdue})</span>
            </button>

            <button
              type="button"
              id="filter-status-returned"
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'returned' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/70'
              }`}
            >
              Retournées ({countReturned})
            </button>

            {/* Advanced Filters Button */}
            <button
              type="button"
              id="btn-toggle-advanced-filters"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                showAdvancedFilters || (activeFiltersCount > 0 && statusFilter === 'all' && !searchTerm)
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Filtres multi-critères avancés"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filtres</span>
              {activeFiltersCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  showAdvancedFilters ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                }`}>
                  {activeFiltersCount}
                </span>
              )}
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* EXPANDABLE MULTI-CRITERIA FILTERS PANEL */}
        {/* ========================================================= */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 animate-fade-in space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* 1. Filter by Client */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Filtrer par Client</span>
                </label>
                <select
                  id="filter-select-client"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="all">Tous les clients ({clients.length})</option>
                  {sortedClients.map(client => {
                    const displayName = client.type === 'company' && client.companyName 
                      ? `${client.companyName} (${client.firstName} ${client.lastName})`
                      : `${client.lastName} ${client.firstName}`;
                    return (
                      <option key={client.id} value={client.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Filter by Date Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Période / Date</span>
                </label>
                <select
                  id="filter-select-date-mode"
                  value={dateFilterMode}
                  onChange={(e) => setDateFilterMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">En cours aujourd'hui</option>
                  <option value="upcoming">Départs futurs (à venir)</option>
                  <option value="this_month">Mois en cours ({todayStr.slice(0, 7)})</option>
                  <option value="custom">Période personnalisée...</option>
                </select>
              </div>

              {/* 3. Filter by Vehicle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Car className="w-3 h-3 text-slate-400" />
                  <span>Véhicule de Flotte</span>
                </label>
                <select
                  id="filter-select-vehicle"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="all">Tous les véhicules ({vehicles.length})</option>
                  {sortedVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Filter by Driving Mode (Chauffeur) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  <span>Mode de conduite</span>
                </label>
                <select
                  id="filter-select-driver-mode"
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="all">Tous les modes</option>
                  <option value="without_driver">Sans chauffeur (conduite autonome)</option>
                  <option value="with_driver">Avec chauffeur privé dédié</option>
                </select>
              </div>

            </div>

            {/* Custom Date Inputs (if custom is chosen or quick selection) */}
            {dateFilterMode === 'custom' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Date de début (Du...)
                  </label>
                  <input
                    type="date"
                    id="filter-custom-start-date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Date de fin (Au...)
                  </label>
                  <input
                    type="date"
                    id="filter-custom-end-date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Secondary Controls: Sorting & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Trier par :</span>
                <select
                  id="filter-select-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="start_desc">Date de début (Plus récent d'abord)</option>
                  <option value="start_asc">Date de début (Plus ancien d'abord)</option>
                  <option value="end_asc">Date de fin (Prochaine échéance)</option>
                  <option value="amount_desc">Montant total (€ Décroissant)</option>
                  <option value="amount_asc">Montant total (€ Croissant)</option>
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVE FILTER CHIPS & SUMMARY ROW */}
        {/* ========================================================= */}
        {(activeFiltersCount > 0 || searchTerm) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filtres actifs :
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                <span>Recherche: &quot;{searchTerm}&quot;</span>
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-medium border border-blue-200">
                <span>Statut: {statusFilter === 'active' ? 'En cours' : statusFilter === 'overdue' ? 'En retard' : 'Retournées'}</span>
                <button 
                  type="button" 
                  onClick={() => setStatusFilter('all')} 
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {clientFilter !== 'all' && selectedClientObj && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-medium border border-indigo-200">
                <span>Client: {selectedClientObj.companyName || `${selectedClientObj.firstName} ${selectedClientObj.lastName}`}</span>
                <button 
                  type="button" 
                  onClick={() => setClientFilter('all')} 
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dateFilterMode !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                <span>
                  Date: {
                    dateFilterMode === 'today' ? 'Aujourd\'hui' : 
                    dateFilterMode === 'upcoming' ? 'Départs futurs' : 
                    dateFilterMode === 'this_month' ? 'Ce mois-ci' : 
                    `${customStartDate || '...'} au ${customEndDate || '...'}`
                  }
                </span>
                <button 
                  type="button" 
                  onClick={() => {
                    setDateFilterMode('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }} 
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {vehicleFilter !== 'all' && selectedVehicleObj && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                <span>Véhicule: {selectedVehicleObj.make} {selectedVehicleObj.model} ({selectedVehicleObj.licensePlate})</span>
                <button 
                  type="button" 
                  onClick={() => setVehicleFilter('all')} 
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {driverFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[11px] font-medium border border-purple-200">
                <span>{driverFilter === 'with_driver' ? 'Avec chauffeur' : 'Sans chauffeur'}</span>
                <button 
                  type="button" 
                  onClick={() => setDriverFilter('all')} 
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:underline ml-auto cursor-pointer"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Results Count & Financial Volume Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Affichage de <strong className="text-slate-900 font-bold">{filteredRentals.length}</strong> location(s) sur <strong className="text-slate-900">{rentals.length}</strong>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Coins className="w-3.5 h-3.5 text-slate-400" />
            <span>Volume contractuel filtré :</span>
            <strong className="text-slate-900 font-bold">{formatCurrency(totalFilteredAmount, settings)}</strong>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* RENTALS LIST CARDS */}
      {/* ========================================================= */}
      <div className="space-y-4" id="rentals-list-cards">
        {filteredRentals.map((rental) => {
          const client = getClient(rental.clientId);
          const vehicle = getVehicle(rental.vehicleId);
          const driver = getDriver(rental.driverId);
          const isOverdue = rental.status === 'active' && rental.endDate < todayStr;
          const isReturned = rental.status === 'returned';

          return (
            <div
              key={rental.id}
              id={`rental-card-${rental.id}`}
              className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] ${
                isOverdue 
                  ? 'border-rose-200/90 bg-rose-50/30' 
                  : isReturned 
                  ? 'border-slate-200/70' 
                  : 'border-blue-200/70'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                
                {/* Left block: Reference, Dates, Status */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900 font-mono">
                      {rental.rentalNumber}
                    </span>

                    {/* Status Badge */}
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Retard: {calculateDaysOverdue(rental.endDate)} {t.daysOverdue}</span>
                      </span>
                    ) : isReturned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.returned}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.active}</span>
                      </span>
                    )}

                    {/* Check-in badge */}
                    {rental.checkIn ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                        Check-in ({rental.checkIn.mileage} km)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                        Check-in en attente
                      </span>
                    )}

                    {rental.checkOut && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Restitué ({rental.checkOut.mileage} km)
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Du <strong className="text-slate-800 font-semibold">{rental.startDate}</strong> au <strong className="text-slate-800 font-semibold">{rental.endDate}</strong> ({rental.totalDays} {t.days})</span>
                  </div>
                </div>

                {/* Center block: Vehicle & Client Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-100 text-xs">
                  {/* Vehicle */}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.vehicle}</span>
                    <span className="font-bold text-slate-900 block">
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'}
                    </span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {vehicle?.licensePlate} &bull; {formatCurrency(rental.vehicleDailyRate, settings)}/j
                    </span>
                  </div>

                  {/* Client */}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.client}</span>
                    <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                      {client ? (client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Client'}
                    </span>
                    <span className="text-slate-500 truncate block">
                      {client?.phone}
                    </span>
                  </div>

                  {/* Driver option if applicable */}
                  {driver && (
                    <div className="col-span-1 sm:col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-blue-700">
                      <span className="flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Chauffeur : {driver.firstName} {driver.lastName}</span>
                      </span>
                      <span className="font-semibold">+{formatCurrency(rental.totalDriverCost, settings)}</span>
                    </div>
                  )}
                </div>

                {/* Right block: Total & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block lg:text-right">
                      {t.totalPrice}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {formatCurrency(rental.totalAmount, settings)}
                    </span>
                  </div>

                  {/* Action Buttons (Check-in, Check-out, Contract PDF, Invoice PDF) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Check-in Button */}
                    {!isReturned && (
                      <button
                        type="button"
                        id={`btn-checkin-${rental.id}`}
                        onClick={() => onOpenCheckIn(rental)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer ${
                          rental.checkIn
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={rental.checkIn ? 'Modifier l\'état de départ' : 'Enregistrer l\'état de départ'}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{rental.checkIn ? 'Check-in OK' : t.checkIn}</span>
                      </button>
                    )}

                    {/* Check-out Button */}
                    {!isReturned && (
                      <button
                        type="button"
                        id={`btn-checkout-${rental.id}`}
                        onClick={() => onOpenCheckOut(rental)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer ${
                          isOverdue
                            ? 'bg-rose-600 text-white hover:bg-rose-700 animate-bounce-subtle'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                        title="Enregistrer le retour du véhicule"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.checkOut}</span>
                      </button>
                    )}

                    {/* Contract PDF Generator Button */}
                    <button
                      type="button"
                      id={`btn-contract-${rental.id}`}
                      onClick={() => onGenerateContract(rental)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title={t.generateContract}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">{t.generateContract}</span>
                      <span className="sm:hidden">Contrat</span>
                    </button>

                    {/* Invoice PDF Generator Button */}
                    <button
                      type="button"
                      id={`btn-invoice-${rental.id}`}
                      onClick={() => onGenerateInvoice(rental)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title={t.generateInvoice}
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">{t.generateInvoice}</span>
                      <span className="sm:hidden">Facture</span>
                    </button>

                    {/* Emails & Notifications History Button */}
                    <button
                      type="button"
                      id={`btn-emails-${rental.id}`}
                      onClick={() => onOpenEmailsModal(rental)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer"
                      title="Voir l'historique des emails et simuler l'envoi"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Emails ({rental.emailLogs?.length || 0})</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state when no rental matches criteria */}
      {filteredRentals.length === 0 && (
        <div className="bg-white p-10 sm:p-14 text-center rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Aucune location ne correspond à vos critères
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Essayez de modifier ou de réinitialiser vos filtres (recherche, statut, client, véhicule ou période sélectionnée).
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              id="btn-empty-reset-filters"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser tous les filtres</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
};
