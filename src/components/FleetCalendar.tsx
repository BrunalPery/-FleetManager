import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Car, 
  User, 
  Phone, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ListFilter,
  CalendarDays,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Rental, Vehicle, Client, Driver, AgencySettings } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';
import { getThemeClasses } from '../utils/theme';

interface FleetCalendarProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  clients: Client[];
  drivers: Driver[];
  settings: AgencySettings;
  onOpenCheckOut?: (rental: Rental) => void;
  onOpenCheckIn?: (rental: Rental) => void;
  onOpenEmailsModal?: (rental: Rental) => void;
  onNavigateTab?: (tab: string) => void;
}

export const FleetCalendar: React.FC<FleetCalendarProps> = ({
  rentals,
  vehicles,
  clients,
  drivers,
  settings,
  onOpenCheckOut,
  onOpenCheckIn,
  onNavigateTab
}) => {
  const theme = getThemeClasses(settings.themeColor);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Current displayed month & year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // Selected day for the detailed side/drawer inspection (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  // View mode: 'month' (calendar grid) or 'schedule' (upcoming chronological list)
  const [viewMode, setViewMode] = useState<'month' | 'schedule'>('month');
  // Schedule filter: 'all' | 'starts' | 'ends'
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'starts' | 'ends'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper lookups
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);
  const getClient = (id: string) => clients.find(c => c.id === id);
  const getDriver = (id?: string | null) => drivers.find(d => d.id === id);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(todayStr);
  };

  // Month name formatting
  const monthName = useMemo(() => {
    const locale = settings.language === 'ar' ? 'ar-SA' : settings.language === 'en' ? 'en-US' : 'fr-FR';
    return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [currentDate, settings.language]);

  // Calendar grid computation
  const { calendarDays, monthStarts, monthEnds } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as first day of week (0 = Sun, 1 = Mon ... 6 = Sat)
    // Convert so Monday = 0, Sunday = 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to fill a complete 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Count starts and ends in this calendar month
    let starts = 0;
    let ends = 0;
    rentals.forEach(r => {
      if (r.status === 'cancelled') return;
      if (r.startDate) {
        const d = new Date(r.startDate);
        if (d.getMonth() === month && d.getFullYear() === year) starts++;
      }
      if (r.endDate) {
        const d = new Date(r.endDate);
        if (d.getMonth() === month && d.getFullYear() === year) ends++;
      }
    });

    return { calendarDays: days, monthStarts: starts, monthEnds: ends };
  }, [year, month, todayStr, rentals]);

  // Map rentals by start date and end date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { starts: Rental[]; ends: Rental[]; ongoing: Rental[] }>();

    rentals.forEach(rental => {
      if (rental.status === 'cancelled') return;

      // Start date event
      if (rental.startDate) {
        const existing = map.get(rental.startDate) || { starts: [], ends: [], ongoing: [] };
        existing.starts.push(rental);
        map.set(rental.startDate, existing);
      }

      // End date event
      if (rental.endDate) {
        const existing = map.get(rental.endDate) || { starts: [], ends: [], ongoing: [] };
        existing.ends.push(rental);
        map.set(rental.endDate, existing);
      }
    });

    return map;
  }, [rentals]);

  // Selected date details
  const selectedDayEvents = useMemo(() => {
    const events = eventsByDate.get(selectedDateStr) || { starts: [], ends: [], ongoing: [] };
    
    // Also compute ongoing rentals on this selected date
    const ongoing = rentals.filter(r => {
      if (r.status === 'cancelled') return false;
      return r.startDate <= selectedDateStr && r.endDate >= selectedDateStr && r.startDate !== selectedDateStr && r.endDate !== selectedDateStr;
    });

    return {
      starts: events.starts,
      ends: events.ends,
      ongoing
    };
  }, [eventsByDate, rentals, selectedDateStr]);

  // Upcoming rentals for the next 30 days (for schedule view or summary stats)
  const upcomingEvents = useMemo(() => {
    const list: {
      type: 'start' | 'end';
      date: string;
      rental: Rental;
      vehicle?: Vehicle;
      client?: Client;
      driver?: Driver;
      isOverdue?: boolean;
    }[] = [];

    const minDate = todayStr;
    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + 30);
    const maxDate = maxDateObj.toISOString().split('T')[0];

    rentals.forEach(rental => {
      if (rental.status === 'cancelled') return;
      const vehicle = getVehicle(rental.vehicleId);
      const client = getClient(rental.clientId);
      const driver = getDriver(rental.driverId);

      // Start date within range
      if (rental.startDate >= minDate && rental.startDate <= maxDate && rental.status !== 'returned') {
        list.push({
          type: 'start',
          date: rental.startDate,
          rental,
          vehicle,
          client,
          driver
        });
      }

      // End date within range or overdue
      if (rental.status === 'active') {
        const isOverdue = rental.endDate < todayStr;
        if (isOverdue || (rental.endDate >= minDate && rental.endDate <= maxDate)) {
          list.push({
            type: 'end',
            date: rental.endDate,
            rental,
            vehicle,
            client,
            driver,
            isOverdue
          });
        }
      }
    });

    // Sort chronologically (overdue first, then by date)
    return list.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.date.localeCompare(b.date);
    });
  }, [rentals, todayStr, vehicles, clients, drivers]);

  // Quick next 7 days stats
  const next7DaysStats = useMemo(() => {
    const nextWeekObj = new Date();
    nextWeekObj.setDate(nextWeekObj.getDate() + 7);
    const nextWeekStr = nextWeekObj.toISOString().split('T')[0];

    let upcomingStarts = 0;
    let upcomingEnds = 0;

    rentals.forEach(r => {
      if (r.status === 'cancelled') return;
      if (r.startDate >= todayStr && r.startDate <= nextWeekStr) {
        upcomingStarts++;
      }
      if (r.status === 'active' && r.endDate >= todayStr && r.endDate <= nextWeekStr) {
        upcomingEnds++;
      }
    });

    return { upcomingStarts, upcomingEnds };
  }, [rentals, todayStr]);

  const weekDayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div 
      id="fleet-calendar-schedule-card" 
      className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] overflow-hidden transition-all"
    >
      {/* Top Header & View Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div 
              style={{ backgroundColor: 'var(--theme-color-light)', color: 'var(--theme-color-dark)' }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            >
              <CalendarIcon className="w-4 h-4" style={{ color: 'var(--theme-color)' }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Planning & Calendrier de la Flotte</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Départs & Retours
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualisez les départs (prises en charge) et retours (restitutions) prévus pour chaque véhicule
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Quick stats & View mode toggles */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* 7-day highlight pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {next7DaysStats.upcomingStarts} départs (7j)
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {next7DaysStats.upcomingEnds} retours (7j)
            </span>
          </div>

          {/* Mode switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              id="calendar-toggle-month"
              onClick={() => setViewMode('month')}
              style={viewMode === 'month' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 6px ${theme.primaryHex}35` } : {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Grille Mois</span>
            </button>
            <button
              type="button"
              id="calendar-toggle-schedule"
              onClick={() => setViewMode('schedule')}
              style={viewMode === 'schedule' ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 6px ${theme.primaryHex}35` } : {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'schedule'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Chronologie ({upcomingEvents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MONTH GRID VIEW */}
      {/* ========================================================= */}
      {viewMode === 'month' && (
        <div className="p-4 sm:p-5">
          
          {/* Calendar Month Navigation Bar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
                {monthName}
              </h3>
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  id="calendar-prev-month"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="calendar-next-month"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="calendar-go-today"
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              >
                Aujourd'hui
              </button>
              
              {/* Legend Badges */}
              <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-500 font-medium ml-2">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Départ</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Retour</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Retard</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid + Inspector Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Calendar Grid (8 cols on large screens) */}
            <div className="lg:col-span-8 bg-slate-50/50 p-2 sm:p-3 rounded-2xl border border-slate-200/80">
              
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {weekDayLabels.map(day => (
                  <div key={day} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5" id="calendar-days-grid">
                {calendarDays.map((cell) => {
                  const dayEvents = eventsByDate.get(cell.dateStr);
                  const startsCount = dayEvents?.starts.length || 0;
                  const endsCount = dayEvents?.ends.length || 0;
                  const hasEvents = startsCount > 0 || endsCount > 0;
                  const isSelected = cell.dateStr === selectedDateStr;

                  // Check if any end event is overdue
                  const hasOverdueEnd = dayEvents?.ends.some(r => r.status === 'active' && r.endDate < todayStr);

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      id={`calendar-cell-${cell.dateStr}`}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      style={isSelected ? { borderColor: 'var(--theme-color)', boxShadow: `0 0 0 2px ${theme.primaryHex}40` } : {}}
                      className={`min-h-[58px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                        isSelected 
                          ? 'bg-white shadow-sm ring-1 ring-slate-900/10'
                          : cell.isCurrentMonth 
                          ? 'bg-white hover:bg-slate-100/70 border border-slate-200/70' 
                          : 'bg-slate-100/40 text-slate-400 border border-transparent'
                      }`}
                    >
                      {/* Top: Day number + Today pill */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${
                          cell.isToday 
                            ? 'w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold' 
                            : isSelected
                            ? 'text-slate-900 font-extrabold'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}>
                          {cell.dayNum}
                        </span>

                        {cell.isToday && (
                          <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Auj.
                          </span>
                        )}
                      </div>

                      {/* Event indicators / pills */}
                      <div className="space-y-0.5 mt-1 w-full">
                        {startsCount > 0 && (
                          <div 
                            title={`${startsCount} départ(s) le ${cell.dateStr}`}
                            className="flex items-center gap-1 px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-bold leading-tight truncate"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{startsCount} départ{startsCount > 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {endsCount > 0 && (
                          <div 
                            title={`${endsCount} retour(s) le ${cell.dateStr}`}
                            className={`flex items-center gap-1 px-1 py-0.2 rounded border text-[10px] font-bold leading-tight truncate ${
                              hasOverdueEnd 
                                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                                : 'bg-amber-50 text-amber-800 border-amber-200/70'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasOverdueEnd ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className="truncate">{endsCount} retour{endsCount > 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {!hasEvents && cell.isToday && (
                          <span className="text-[9px] text-slate-400 italic block truncate">
                            Aucun mouvement
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Events Inspector Panel (4 cols on large screens) */}
            <div className="lg:col-span-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col justify-between" id="calendar-day-inspector">
              <div>
                {/* Inspector Header */}
                <div className="pb-3 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Événements du jour sélectionné
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {new Date(selectedDateStr).toLocaleDateString(settings.language === 'ar' ? 'ar-SA' : settings.language === 'en' ? 'en-US' : 'fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h4>
                  </div>

                  {selectedDateStr === todayStr && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white">
                      Aujourd'hui
                    </span>
                  )}
                </div>

                {/* Content: Starts & Ends */}
                <div className="mt-3 space-y-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                  
                  {/* 1. Départs prévus */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Départs & Prises en charge ({selectedDayEvents.starts.length})</span>
                    </h5>

                    {selectedDayEvents.starts.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic bg-white/70 p-2 rounded-xl border border-slate-200/60">
                        Aucun départ prévu à cette date.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayEvents.starts.map(rental => {
                          const vehicle = getVehicle(rental.vehicleId);
                          const client = getClient(rental.clientId);
                          const driver = getDriver(rental.driverId);

                          return (
                            <div 
                              key={`start-${rental.id}`}
                              className="bg-white p-2.5 rounded-xl border border-emerald-200/70 shadow-2xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'}
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                  {vehicle?.licensePlate}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-600">
                                <span className="truncate flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{client ? (client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Client'}</span>
                                </span>
                                <span className="text-slate-400 shrink-0">
                                  Durée : {rental.totalDays}j
                                </span>
                              </div>

                              {driver && (
                                <p className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 pt-0.5">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Chauffeur : {driver.firstName} {driver.lastName}</span>
                                </p>
                              )}

                              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                                <span>Fin prévue : {rental.endDate}</span>
                                <span className="font-semibold text-slate-800">#{rental.rentalNumber}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. Retours attendus */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Retours & Restitutions ({selectedDayEvents.ends.length})</span>
                    </h5>

                    {selectedDayEvents.ends.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic bg-white/70 p-2 rounded-xl border border-slate-200/60">
                        Aucune restitution prévue à cette date.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayEvents.ends.map(rental => {
                          const vehicle = getVehicle(rental.vehicleId);
                          const client = getClient(rental.clientId);
                          const isOverdue = rental.status === 'active' && rental.endDate < todayStr;
                          const isReturned = rental.status === 'returned';

                          return (
                            <div 
                              key={`end-${rental.id}`}
                              className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-1.5 ${
                                isOverdue 
                                  ? 'border-rose-300 bg-rose-50/40' 
                                  : isReturned 
                                  ? 'border-emerald-200/60 bg-emerald-50/20' 
                                  : 'border-amber-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'}
                                </span>
                                {isReturned ? (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                                    Restitué
                                  </span>
                                ) : isOverdue ? (
                                  <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>En retard</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                    {vehicle?.licensePlate}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-600">
                                <span className="truncate flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{client ? `${client.firstName} ${client.lastName}` : 'Client'}</span>
                                </span>
                                {client?.phone && (
                                  <a 
                                    href={`tel:${client.phone}`}
                                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>Appeler</span>
                                  </a>
                                )}
                              </div>

                              {rental.status === 'active' && onOpenCheckOut && (
                                <button
                                  type="button"
                                  onClick={() => onOpenCheckOut(rental)}
                                  className="w-full mt-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-2xs transition-colors flex items-center justify-center gap-1"
                                >
                                  <span>Effectuer le Check-Out</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. Véhicules en circulation */}
                  {selectedDayEvents.ongoing.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <p className="text-[11px] text-slate-500 font-medium">
                        &bull; {selectedDayEvents.ongoing.length} autre(s) véhicule(s) en circulation durant cette journée.
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Bottom helper */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Total événements : {selectedDayEvents.starts.length + selectedDayEvents.ends.length}</span>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('rentals')}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Voir toutes les locations &rarr;
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CHRONOLOGICAL SCHEDULE LIST VIEW */}
      {/* ========================================================= */}
      {viewMode === 'schedule' && (
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Sub-filter tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScheduleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                scheduleFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({upcomingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter('starts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                scheduleFilter === 'starts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Départs prévus ({upcomingEvents.filter(e => e.type === 'start').length})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter('ends')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                scheduleFilter === 'ends'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Retours prévus ({upcomingEvents.filter(e => e.type === 'end').length})
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">Aucun départ ni retour dans les 30 prochains jours.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {upcomingEvents
                .filter(item => {
                  if (scheduleFilter === 'starts') return item.type === 'start';
                  if (scheduleFilter === 'ends') return item.type === 'end';
                  return true;
                })
                .map((event, idx) => {
                  const isToday = event.date === todayStr;

                  return (
                    <div 
                      key={`timeline-${event.type}-${event.rental.id}-${idx}`}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        event.isOverdue
                          ? 'bg-rose-50/50 hover:bg-rose-50'
                          : isToday
                          ? 'bg-blue-50/40 hover:bg-blue-50/70'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Left: Date & Type Badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${
                          event.type === 'start'
                            ? 'bg-emerald-100 text-emerald-800'
                            : event.isOverdue
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <span className="text-[10px] uppercase leading-none">
                            {event.type === 'start' ? 'Départ' : 'Retour'}
                          </span>
                          <span className="text-xs font-extrabold mt-0.5">
                            {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {event.vehicle ? `${event.vehicle.make} ${event.vehicle.model}` : 'Véhicule'}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                              {event.vehicle?.licensePlate}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                                Aujourd'hui
                              </span>
                            )}
                            {event.isOverdue && (
                              <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Retard de retour</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium text-slate-800">
                                {event.client ? `${event.client.firstName} ${event.client.lastName}` : 'Client'}
                              </span>
                            </span>

                            {event.driver && (
                              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Chauffeur : {event.driver.firstName} {event.driver.lastName}</span>
                              </span>
                            )}

                            <span className="text-slate-400">
                              Contrat #{event.rental.rentalNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Dates & Action */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {event.client?.phone && (
                          <a
                            href={`tel:${event.client.phone}`}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title={`Appeler ${event.client.firstName} (${event.client.phone})`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {event.type === 'end' && event.rental.status === 'active' && onOpenCheckOut && (
                          <button
                            type="button"
                            onClick={() => onOpenCheckOut(event.rental)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                          >
                            Check-Out
                          </button>
                        )}

                        {event.type === 'start' && onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('rentals')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                          >
                            Voir contrat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
