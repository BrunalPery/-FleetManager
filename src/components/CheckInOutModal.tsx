import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  LogOut, 
  Gauge, 
  Fuel, 
  ClipboardCheck, 
  AlertCircle, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { Rental, Vehicle, Client, Driver, CheckInDetails, CheckOutDetails, AgencySettings } from '../types';
import { getTranslation } from '../translations';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'check-in' | 'check-out';
  rental: Rental;
  vehicle: Vehicle;
  client: Client;
  driver?: Driver | null;
  settings: AgencySettings;
  onConfirmCheckIn: (rentalId: string, details: CheckInDetails) => void;
  onConfirmCheckOut: (rentalId: string, details: CheckOutDetails) => void;
}

export const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  isOpen,
  onClose,
  type,
  rental,
  vehicle,
  client,
  driver,
  settings,
  onConfirmCheckIn,
  onConfirmCheckOut
}) => {
  const t = getTranslation(settings.language);

  // Initial values
  const defaultStartMileage = rental.checkIn?.mileage || vehicle.currentMileage || 0;
  const [mileage, setMileage] = useState<number>(
    type === 'check-in' ? defaultStartMileage : defaultStartMileage + 150
  );
  const [fuelLevel, setFuelLevel] = useState<string>(
    type === 'check-in' ? (rental.checkIn?.fuelLevel || '100%') : '100%'
  );
  const [notes, setNotes] = useState<string>(
    type === 'check-in' 
      ? (rental.checkIn?.vehicleConditionNotes || 'Véhicule propre, aucun dommage apparent.') 
      : 'Restitution en parfait état, véhicule lavé.'
  );
  const [operatorName, setOperatorName] = useState<string>('Agent Accueil');
  const [validationError, setValidationError] = useState<string | null>(null);

  const nowDateTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

  // Validate check-out mileage >= departure mileage
  const startMileage = rental.checkIn ? rental.checkIn.mileage : vehicle.currentMileage;
  const isCheckOutMileageValid = type === 'check-out' ? mileage >= startMileage : true;
  const distanceTraveled = Math.max(0, mileage - startMileage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (type === 'check-in') {
      const details: CheckInDetails = {
        mileage,
        fuelLevel,
        vehicleConditionNotes: notes,
        date: nowDateTime,
        operatorName
      };
      onConfirmCheckIn(rental.id, details);
    } else {
      if (!isCheckOutMileageValid) {
        setValidationError(t.mileageWarning);
        return;
      }
      const details: CheckOutDetails = {
        mileage,
        fuelLevel,
        vehicleConditionNotes: notes,
        returnDate: nowDateTime,
        distanceTraveled,
        operatorName
      };
      onConfirmCheckOut(rental.id, details);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200/80 my-auto max-h-[92vh] overflow-y-auto no-scrollbar animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'check-in' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {type === 'check-in' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {type === 'check-in' ? t.checkIn : t.checkOut}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {rental.rentalNumber} &bull; {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client & Vehicle Mini-recap */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-500 block">Client locataire</span>
            <span className="font-bold text-slate-800">
              {client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Période convenue</span>
            <span className="font-semibold text-slate-800">
              {rental.startDate} &rarr; {rental.endDate}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Mileage Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>{type === 'check-in' ? t.startMileage : t.returnMileage} (km) *</span>
              </span>
              {type === 'check-out' && (
                <span className="text-[11px] text-slate-500 font-normal">
                  Départ : {startMileage.toLocaleString()} km
                </span>
              )}
            </label>
            <input
              id="input-check-mileage"
              type="number"
              required
              min={type === 'check-out' ? startMileage : 0}
              value={mileage}
              onChange={e => setMileage(Number(e.target.value))}
              className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />

            {type === 'check-out' && (
              <div className="mt-1.5 flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">{t.distanceTraveled} :</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  +{distanceTraveled.toLocaleString()} km
                </span>
              </div>
            )}

            {(!isCheckOutMileageValid || validationError) && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationError || t.mileageWarning}</span>
              </p>
            )}
          </div>

          {/* Fuel Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.fuelLevel}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['100%', '75%', '50%', '25%'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFuelLevel(lvl)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    fuelLevel === lvl
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Condition Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.conditionNotes} *</span>
            </label>
            <textarea
              id="input-condition-notes"
              rows={3}
              required
              placeholder="État de la carrosserie, propreté intérieure, accessoires, documents de bord..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Inspector name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.operator} *</span>
            </label>
            <input
              type="text"
              required
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Info Notice for Check-out */}
          {type === 'check-out' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Règle métier automatique :</span>
              </p>
              <p className="mt-0.5 text-emerald-800">
                La location passera au statut <strong>"Retournée"</strong>, le véhicule redeviendra immédiatement <strong>"Disponible"</strong>, et le chauffeur (le cas échéant) redeviendra <strong>"Disponible"</strong>.
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="btn-confirm-checkinout"
              disabled={!isCheckOutMileageValid}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                type === 'check-in' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{type === 'check-in' ? t.confirmCheckIn : t.confirmCheckOut}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
