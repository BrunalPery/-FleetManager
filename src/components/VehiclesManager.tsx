import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Wrench, 
  CheckCircle2, 
  KeyRound, 
  Gauge, 
  Coins, 
  UserCheck,
  X,
  SlidersHorizontal,
  Fuel
} from 'lucide-react';
import { Vehicle, VehicleStatus, AgencySettings } from '../types';
import { getTranslation } from '../translations';
import { formatCurrency } from '../utils/pdfGenerator';

interface VehiclesManagerProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  settings: AgencySettings;
}

export const VehiclesManager: React.FC<VehiclesManagerProps> = ({
  vehicles,
  setVehicles,
  settings
}) => {
  const t = getTranslation(settings.language);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VehicleStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showFeedback = (message: string, type: 'error' | 'success' = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Form State
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    currentMileage: 0,
    dailyRate: 50,
    driverSupplement: 80,
    status: 'available',
    category: 'Berline',
    fuelType: 'Essence',
    transmission: 'Automatique',
    imageUrl: '',
    notes: ''
  });

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      currentMileage: 0,
      dailyRate: 50,
      driverSupplement: 80,
      status: 'available',
      category: 'Berline',
      fuelType: 'Essence',
      transmission: 'Automatique',
      imageUrl: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      currentMileage: vehicle.currentMileage,
      dailyRate: vehicle.dailyRate,
      driverSupplement: vehicle.driverSupplement,
      status: vehicle.status,
      category: vehicle.category || 'Berline',
      fuelType: vehicle.fuelType || 'Essence',
      transmission: vehicle.transmission || 'Automatique',
      imageUrl: vehicle.imageUrl || '',
      notes: vehicle.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle?.status === 'rented') {
      showFeedback('Impossible de supprimer un véhicule actuellement en location active ! Terminez la location d\'abord.', 'error');
      return;
    }
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    showFeedback('Véhicule supprimé avec succès.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model || !formData.licensePlate) {
      showFeedback('Veuillez renseigner la marque, le modèle et la plaque d\'immatriculation.', 'error');
      return;
    }

    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...formData, id: editingVehicle.id } : v));
      showFeedback(`Véhicule ${formData.make} ${formData.model} mis à jour avec succès.`, 'success');
    } else {
      const newVehicle: Vehicle = {
        ...formData,
        id: `veh-${Date.now()}`
      };
      setVehicles(prev => [newVehicle, ...prev]);
      showFeedback(`Véhicule ${formData.make} ${formData.model} ajouté au parc.`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleToggleMaintenance = (vehicle: Vehicle) => {
    if (vehicle.status === 'rented') {
      showFeedback('Impossible de passer en maintenance un véhicule actuellement en location !', 'error');
      return;
    }
    const newStatus: VehicleStatus = vehicle.status === 'maintenance' ? 'available' : 'maintenance';
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: newStatus } : v));
    showFeedback(
      newStatus === 'maintenance' 
        ? `${vehicle.make} ${vehicle.model} est maintenant en maintenance.` 
        : `${vehicle.make} ${vehicle.model} est de nouveau disponible.`,
      'success'
    );
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' ? true : v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.available}
          </span>
        );
      case 'rented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-xs">
            <KeyRound className="w-3.5 h-3.5" />
            {t.rented}
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-xs">
            <Wrench className="w-3.5 h-3.5" />
            {t.maintenance}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="vehicles-manager-view">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
            <Car className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <span>{t.vehicles}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {vehicles.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Gestion du parc automobile, tarification journalière, kilométrage et disponibilité
          </p>
        </div>

        <button
          id="btn-add-vehicle"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-transform active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addVehicle}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in ${
          feedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{feedback.message}</span>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="p-1 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="vehicle-search-input"
            type="text"
            placeholder={t.searchVehicle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/60 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Pills (Swipeable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
          {(['all', 'available', 'rented', 'maintenance'] as const).map((st) => {
            const isActive = statusFilter === st;
            const count = st === 'all' ? vehicles.length : vehicles.filter(v => v.status === st).length;
            const label = st === 'all' ? 'Tous' : t[st];
            return (
              <button
                key={st}
                id={`filter-vehicle-${st}`}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicles Grid (Responsive: 1 col on mobile, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" id="vehicles-card-grid">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            id={`vehicle-card-${vehicle.id}`}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Image or Vehicle Header banner */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                    <Car className="w-16 h-16 stroke-[1.2]" />
                    <span className="text-xs text-slate-400 mt-1">Photo véhicule</span>
                  </div>
                )}
                
                {/* Status Badge in corner */}
                <div className="absolute top-3 left-3 shadow-sm">
                  {getStatusBadge(vehicle.status)}
                </div>

                {/* License Plate Badge */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-900 border border-slate-300 shadow-xs">
                  {vehicle.licensePlate}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {vehicle.year} &bull; {vehicle.category || 'Véhicule'} &bull; {vehicle.fuelType || 'Essence'}
                    </p>
                  </div>
                </div>

                {/* Rates & Mileage Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                      {t.dailyRate}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(vehicle.dailyRate, settings)}
                      <span className="text-[11px] font-normal text-slate-500"> /j</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                      {t.driverSupplement}
                    </span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      +{formatCurrency(vehicle.driverSupplement, settings)}
                      <span className="text-[11px] font-normal text-slate-500"> /j</span>
                    </span>
                  </div>

                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.mileage} :</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {vehicle.currentMileage.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {vehicle.notes && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-1 italic">
                    {vehicle.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                id={`btn-maintenance-${vehicle.id}`}
                onClick={() => handleToggleMaintenance(vehicle)}
                disabled={vehicle.status === 'rented'}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  vehicle.status === 'maintenance'
                    ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                title="Basculer statut atelier maintenance"
              >
                <Wrench className="w-3 h-3" />
                <span>{vehicle.status === 'maintenance' ? 'Sortir atelier' : 'Atelier'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id={`btn-edit-vehicle-${vehicle.id}`}
                  onClick={() => openEditModal(vehicle)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors"
                  title={t.edit}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id={`btn-delete-vehicle-${vehicle.id}`}
                  onClick={() => handleDelete(vehicle.id)}
                  disabled={vehicle.status === 'rented'}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucun véhicule trouvé pour cette recherche.</p>
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingVehicle ? 'Modifier le Véhicule' : t.addVehicle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Make */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.make} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Peugeot, Renault, BMW"
                    value={formData.make}
                    onChange={e => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.model} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 208 GT, Clio V, Série 3"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* License Plate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.licensePlate} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: AA-123-BB"
                    value={formData.licensePlate}
                    onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono uppercase font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Current Mileage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.mileage} actuel (km) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.currentMileage}
                    onChange={e => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Daily Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.dailyRate} ({settings.currencySymbol} / jour) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={formData.dailyRate}
                    onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Driver Supplement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.driverSupplement} ({settings.currencySymbol} / jour) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.driverSupplement}
                    onChange={e => setFormData({ ...formData, driverSupplement: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.status}
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  >
                    <option value="available">{t.available}</option>
                    <option value="rented">{t.rented}</option>
                    <option value="maintenance">{t.maintenance}</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Citadine, SUV, Berline"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL de l'image (optionnel)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Historique de maintenance
                </label>
                <textarea
                  rows={2}
                  placeholder="Dernier entretien, spécificités..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  id="btn-save-vehicle"
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
