import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Car, 
  User, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Clock, 
  ShieldCheck,
  Coins
} from 'lucide-react';
import { Vehicle, Driver, Client, Rental, AgencySettings } from '../types';
import { getTranslation } from '../translations';
import { formatCurrency } from '../utils/pdfGenerator';

interface NewRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  clients: Client[];
  rentals: Rental[];
  settings: AgencySettings;
  onConfirmRental: (newRental: Rental) => void;
}

export const NewRentalModal: React.FC<NewRentalModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  drivers,
  clients,
  rentals,
  settings,
  onConfirmRental
}) => {
  const t = getTranslation(settings.language);

  // Today & Tomorrow default dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles.find(v => v.status === 'available')?.id || vehicles[0]?.id || ''
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>(''); // empty string = no driver
  const [startDate, setStartDate] = useState<string>(formatDate(today));
  const [endDate, setEndDate] = useState<string>(formatDate(tomorrow));
  const [customNotes, setCustomNotes] = useState<string>('');

  // Selected entities
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
  const selectedDriver = useMemo(() => drivers.find(d => d.id === selectedDriverId), [drivers, selectedDriverId]);
  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  // Duration calculation in days
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) return 0;
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [startDate, endDate]);

  // Pricing calculation
  const vehicleDailyRate = selectedVehicle?.dailyRate || 0;
  const driverDailyRate = selectedDriverId ? (selectedVehicle?.driverSupplement || 0) : 0;
  
  const totalVehicleCost = totalDays * vehicleDailyRate;
  const totalDriverCost = totalDays * driverDailyRate;
  const grandTotal = totalVehicleCost + totalDriverCost;

  // CRITICAL BUSINESS RULE: Collision Check
  // Check if the selected vehicle is already rented during the requested period
  const vehicleCollision = useMemo(() => {
    if (!selectedVehicleId || !startDate || !endDate) return null;

    const conflictingRental = rentals.find(r => {
      // Ignore returned or cancelled rentals
      if (r.status === 'returned' || r.status === 'cancelled') return false;
      if (r.vehicleId !== selectedVehicleId) return false;

      // Two intervals [startA, endA] and [startB, endB] overlap if startA <= endB && endA >= startB
      const overlap = startDate <= r.endDate && endDate >= r.startDate;
      return overlap;
    });

    return conflictingRental || null;
  }, [selectedVehicleId, startDate, endDate, rentals]);

  // Driver collision check
  const driverCollision = useMemo(() => {
    if (!selectedDriverId || !startDate || !endDate) return null;

    const conflictingRental = rentals.find(r => {
      if (r.status === 'returned' || r.status === 'cancelled') return false;
      if (r.driverId !== selectedDriverId) return false;
      return startDate <= r.endDate && endDate >= r.startDate;
    });

    return conflictingRental || null;
  }, [selectedDriverId, startDate, endDate, rentals]);

  // Is vehicle in maintenance?
  const isVehicleInMaintenance = selectedVehicle?.status === 'maintenance';

  // Submission validation
  const isValid = 
    selectedClientId &&
    selectedVehicleId &&
    startDate &&
    endDate &&
    endDate >= startDate &&
    totalDays > 0 &&
    !vehicleCollision &&
    !isVehicleInMaintenance &&
    !driverCollision;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const rentalCount = rentals.length + 1;
    const rentalNumber = `LOC-${new Date().getFullYear()}-${String(rentalCount).padStart(3, '0')}`;
    const contractNumber = `CTR-${new Date().getFullYear()}-${String(rentalCount).padStart(3, '0')}`;

    const newRental: Rental = {
      id: `rent-${Date.now()}`,
      rentalNumber,
      contractNumber,
      clientId: selectedClientId,
      vehicleId: selectedVehicleId,
      driverId: selectedDriverId || null,
      startDate,
      endDate,
      totalDays,
      vehicleDailyRate,
      driverDailyRate,
      totalVehicleCost,
      totalDriverCost,
      totalAmount: grandTotal,
      status: 'active', // Becomes active immediately
      notes: customNotes,
      createdAt: new Date().toISOString()
    };

    onConfirmRental(newRental);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-7 shadow-xl border border-slate-200/80 my-auto max-h-[92vh] overflow-y-auto no-scrollbar animate-scale-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>{t.newRental}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Réservation immédiate avec vérification de collision et calcul automatique du tarif
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          
          {/* Client Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.client} *</span>
            </label>
            <select
              id="select-rental-client"
              required
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium text-slate-800"
            >
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.type === 'company' && client.companyName
                    ? `${client.companyName} (${client.firstName} ${client.lastName}) - ${client.idNumber}`
                    : `${client.firstName} ${client.lastName} - ${client.phone}`}
                </option>
              ))}
            </select>
          </div>

          {/* Dates: Start and End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.startDate} *</span>
              </label>
              <input
                id="input-rental-start-date"
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.endDate} *</span>
              </label>
              <input
                id="input-rental-end-date"
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.duration} calculée :</span>
              </span>
              <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                {totalDays} {t.days}
              </span>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.vehicle} *</span>
              </span>
              {selectedVehicle && (
                <span className="text-[11px] text-slate-500 font-normal">
                  Tarif : {formatCurrency(selectedVehicle.dailyRate, settings)} / jour
                </span>
              )}
            </label>
            <select
              id="select-rental-vehicle"
              required
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium text-slate-800"
            >
              {vehicles.map(v => {
                const isRented = v.status === 'rented';
                const isMaint = v.status === 'maintenance';
                const statusSuffix = isMaint ? ' [En maintenance]' : isRented ? ' [Actuellement en location]' : ' [Disponible]';
                return (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.licensePlate}) - {formatCurrency(v.dailyRate, settings)}/j {statusSuffix}
                  </option>
                );
              })}
            </select>

            {/* COLLISION ERROR BANNER (CRITICAL REQUIREMENT) */}
            {vehicleCollision && (
              <div 
                id="vehicle-collision-error-banner"
                className="mt-2 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium animate-shake"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">{t.collisionError}</p>
                  <p className="mt-0.5">
                    Ce véhicule est déjà réservé du <strong>{vehicleCollision.startDate}</strong> au <strong>{vehicleCollision.endDate}</strong> (Location #{vehicleCollision.rentalNumber}). Choisissez un autre véhicule ou modifiez les dates.
                  </p>
                </div>
              </div>
            )}

            {isVehicleInMaintenance && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ce véhicule est actuellement en maintenance à l'atelier.</span>
              </div>
            )}
          </div>

          {/* Optional Driver Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.optionalDriver}</span>
              </span>
              {selectedVehicle && (
                <span className="text-[11px] text-blue-700 font-semibold">
                  Supplément : +{formatCurrency(selectedVehicle.driverSupplement, settings)} / jour
                </span>
              )}
            </label>
            <select
              id="select-rental-driver"
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium text-slate-800"
            >
              <option value="">{t.noDriver}</option>
              {drivers.map(d => {
                const isAvail = d.available;
                return (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} (Permis {d.licenseNumber}) {isAvail ? '[Disponible]' : '[Indisponible]'}
                  </option>
                );
              })}
            </select>

            {driverCollision && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Attention : ce chauffeur est déjà assigné sur une mission durant cette période.</span>
              </div>
            )}
          </div>

          {/* CALCUL ET GESTION DU PRIX (AFFICHAGE AVANT VALIDATION) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md" id="rental-price-summary-box">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.calculationSummary}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {totalDays} {t.days}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {/* Vehicle breakdown */}
              <div className="flex items-center justify-between text-slate-300">
                <span>
                  {t.vehicleCost} ({formatCurrency(vehicleDailyRate, settings)} &times; {totalDays} {t.days})
                </span>
                <span className="font-semibold text-white">
                  {formatCurrency(totalVehicleCost, settings)}
                </span>
              </div>

              {/* Driver breakdown if selected */}
              {selectedDriverId ? (
                <div className="flex items-center justify-between text-blue-300">
                  <span>
                    {t.driverCost} ({formatCurrency(driverDailyRate, settings)} &times; {totalDays} {t.days})
                  </span>
                  <span className="font-semibold text-blue-200">
                    +{formatCurrency(totalDriverCost, settings)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-400 italic">
                  <span>Option chauffeur</span>
                  <span>0.00 {settings.currencySymbol} (Sans chauffeur)</span>
                </div>
              )}
            </div>

            {/* GRAND TOTAL */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-baseline justify-between">
              <div>
                <span className="text-sm font-bold text-white block">{t.totalPrice}</span>
                <span className="text-[10px] text-slate-400">Calculé en direct avant confirmation</span>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight" id="rental-grand-total-display">
                {formatCurrency(grandTotal, settings)}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              id="btn-confirm-validate-rental"
              disabled={!isValid}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.validateRental}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
