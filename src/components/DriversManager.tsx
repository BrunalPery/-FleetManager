import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  CreditCard, 
  X, 
  CheckCircle2, 
  XCircle,
  Briefcase,
  Share2,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  ShieldAlert,
  MessageCircle
} from 'lucide-react';
import { Driver, AgencySettings } from '../types';
import { getTranslation } from '../translations';

interface DriversManagerProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  settings: AgencySettings;
  onOpenDriverPortal?: (driverId?: string) => void;
}

export const DriversManager: React.FC<DriversManagerProps> = ({
  drivers,
  setDrivers,
  settings,
  onOpenDriverPortal
}) => {
  const t = getTranslation(settings.language);

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDriverId, setCopiedDriverId] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showFeedback = (message: string, type: 'error' | 'success' = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    available: true,
    accessPin: '',
    notes: ''
  });

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      licenseNumber: '',
      available: true,
      accessPin: String(Math.floor(1000 + Math.random() * 9000)),
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      available: driver.available,
      accessPin: driver.accessPin || '1234',
      notes: driver.notes || ''
    });
    setIsModalOpen(true);
  };

  const confirmDeleteDriver = () => {
    if (!driverToDelete) return;
    const deletedId = driverToDelete.id;
    const deletedName = `${driverToDelete.firstName} ${driverToDelete.lastName}`;

    // Immediately purge active driver session if saved on this machine
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('locafleet_active_driver_id');
      if (active === deletedId) {
        localStorage.removeItem('locafleet_active_driver_id');
      }
    }

    setDrivers(prev => prev.filter(d => d.id !== deletedId));
    setDriverToDelete(null);
    showFeedback(`Le chauffeur ${deletedName} a été retiré de l'agence. Son espace personnel a été immédiatement et définitivement détruit.`, 'success');
  };

  const handleToggleAvailable = (driverId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, available: !d.available } : d));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.licenseNumber) {
      showFeedback('Veuillez remplir tous les champs obligatoires (nom, prénom, téléphone, numéro de permis).', 'error');
      return;
    }

    const pin = formData.accessPin.trim() || '1234';

    if (editingDriver) {
      setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { 
        ...formData, 
        id: editingDriver.id,
        accessPin: pin,
        token: editingDriver.token || `tok_${formData.firstName.toLowerCase()}_${formData.licenseNumber.slice(-4) || 'auth'}`
      } : d));
      showFeedback(`Chauffeur ${formData.firstName} ${formData.lastName} mis à jour.`, 'success');
    } else {
      const newId = `drv-${Date.now()}`;
      const newDriver: Driver = {
        ...formData,
        id: newId,
        accessPin: pin,
        token: `tok_${formData.firstName.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`
      };
      setDrivers(prev => [newDriver, ...prev]);
      showFeedback(`Chauffeur ${formData.firstName} ${formData.lastName} ajouté. Son espace personnel sécurisé a été créé.`, 'success');
    }

    setIsModalOpen(false);
  };

  const filteredDrivers = drivers.filter(d => {
    const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          d.phone.includes(searchTerm) || 
                          d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterAvailability === 'available') return matchesSearch && d.available;
    if (filterAvailability === 'unavailable') return matchesSearch && !d.available;
    return matchesSearch;
  });

  const getDriverPersonalUrl = (driver: Driver) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const token = driver.token || `tok_${driver.id}`;
    return `${origin}${pathname}?driver=true&token=${token}&driverId=${driver.id}`;
  };

  return (
    <div className="space-y-6" id="drivers-manager-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <span>{t.drivers}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {drivers.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Chauffeurs professionnels, numéro de permis et disponibilité pour les missions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-copy-driver-portal-link"
            type="button"
            onClick={async () => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
              const url = `${origin}${pathname}?driver=true`;
              try {
                await navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              } catch {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 shadow-2xs transition-colors"
            title="Copier le lien permanent de l'espace chauffeur"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Copier lien Chauffeur</span>
              </>
            )}
          </button>

          {onOpenDriverPortal && (
            <button
              id="btn-open-driver-portal-manager"
              type="button"
              onClick={() => onOpenDriverPortal()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-2xs transition-colors"
              title="Ouvrir la page chauffeur pour se connecter et chercher une mission"
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Ouvrir Espace Chauffeur</span>
            </button>
          )}

          <button
            id="btn-add-driver"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addDriver}</span>
          </button>
        </div>
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

      {/* Search & Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="driver-search-input"
            type="text"
            placeholder={t.searchDriver}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/60 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
          <button
            onClick={() => setFilterAvailability('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterAvailability === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Tous ({drivers.length})
          </button>
          <button
            onClick={() => setFilterAvailability('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterAvailability === 'available' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/70'
            }`}
          >
            Disponibles ({drivers.filter(d => d.available).length})
          </button>
          <button
            onClick={() => setFilterAvailability('unavailable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterAvailability === 'unavailable' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            En mission ({drivers.filter(d => !d.available).length})
          </button>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" id="drivers-card-grid">
        {filteredDrivers.map((driver) => (
          <div
            key={driver.id}
            id={`driver-card-${driver.id}`}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header card with avatar and status pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-base flex items-center justify-center border border-slate-200">
                    {driver.firstName[0]}{driver.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Chauffeur professionnel</p>
                  </div>
                </div>

                {/* Availability status badge */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailable(driver.id)}
                  title="Cliquer pour basculer la disponibilité"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-transform active:scale-95 ${
                    driver.available
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {driver.available ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.available}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.unavailable}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info Items */}
              <div className="mt-4 space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone} :</span>
                  </span>
                  <a href={`tel:${driver.phone}`} className="font-semibold text-blue-600 hover:underline">
                    {driver.phone}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>N° Permis :</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {driver.licenseNumber}
                  </span>
                </div>
              </div>

              {driver.notes && (
                <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic">
                  {driver.notes}
                </p>
              )}

              {/* Secure Access & Personal Link Box */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium">Code PIN Secret :</span>
                    <span className="font-mono font-bold text-slate-900 ml-1">
                      {revealedPins[driver.id] ? (driver.accessPin || '1234') : '••••'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevealedPins(prev => ({ ...prev, [driver.id]: !prev[driver.id] }))}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    {revealedPins[driver.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{revealedPins[driver.id] ? 'Masquer' : 'Voir'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const url = getDriverPersonalUrl(driver);
                      try {
                        await navigator.clipboard.writeText(url);
                        setCopiedDriverId(driver.id);
                        setTimeout(() => setCopiedDriverId(null), 2500);
                      } catch {
                        setCopiedDriverId(driver.id);
                        setTimeout(() => setCopiedDriverId(null), 2500);
                      }
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Copier le lien d'accès personnel sécurisé de ce chauffeur"
                  >
                    {copiedDriverId === driver.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copier Lien Personnel</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Bonjour ${driver.firstName} ! Voici votre lien d'accès personnel et confidentiel à votre Espace Chauffeur chez ${settings.agencyName} : ${getDriverPersonalUrl(driver)}\n\nVotre code PIN secret d'accès est : ${driver.accessPin || '1234'}.\nNe communiquez pas ce code secret aux autres chauffeurs.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors"
                    title="Transmettre le lien personnel et le code PIN par WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer with Edit & Delete & Driver Portal */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              {/* Quick toggle check indicator */}
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={driver.available}
                  onChange={() => handleToggleAvailable(driver.id)}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <span>{t.isAvailable}</span>
              </label>

              <div className="flex items-center gap-1.5">
                {onOpenDriverPortal && (
                  <button
                    type="button"
                    id={`btn-portal-driver-${driver.id}`}
                    onClick={() => onOpenDriverPortal(driver.id)}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Tester l'accès à cet espace chauffeur"
                  >
                    <span>Tester Espace</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                <button
                  type="button"
                  id={`btn-edit-driver-${driver.id}`}
                  onClick={() => openEditModal(driver)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title={t.edit}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id={`btn-delete-driver-${driver.id}`}
                  onClick={() => setDriverToDelete(driver)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Retirer le chauffeur et détruire son espace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucun chauffeur trouvé pour cette recherche.</p>
        </div>
      )}

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDriver ? 'Modifier le Chauffeur' : t.addDriver}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.firstName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.lastName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.phone} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.licenseNumber} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: FR-9482017401"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Code PIN secret pour l'isolation chauffeur */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                    <span>Code PIN secret (4 chiffres) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessPin: String(Math.floor(1000 + Math.random() * 9000)) })}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Générer au hasard
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="1234"
                  value={formData.accessPin}
                  onChange={e => setFormData({ ...formData, accessPin: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-3 py-2 text-sm font-mono font-bold tracking-widest bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                  🔒 Garantit la confidentialité : chaque chauffeur utilise son propre code PIN et ne peut pas accéder aux espaces des autres chauffeurs.
                </p>
              </div>

              {/* Case à cocher "Disponible" requise */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{t.isAvailable}</span>
                  <span className="text-[11px] text-slate-500">Actif pour être assigné à une location</span>
                </div>
                <input
                  type="checkbox"
                  id="driver-available-checkbox"
                  checked={formData.available}
                  onChange={e => setFormData({ ...formData, available: e.target.checked })}
                  className="h-5 w-5 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Langues parlées
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: VTC expérimenté, bilingue anglais..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

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
                  id="btn-save-driver"
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation & Space Destruction Modal */}
      {driverToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Retirer ce chauffeur de l'agence ?
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Destruction immédiate de son espace personnel
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200/80 text-xs text-rose-950 space-y-2 leading-relaxed">
              <p>
                Vous êtes sur le point de retirer définitivement <strong>{driverToDelete.firstName} {driverToDelete.lastName}</strong> de votre agence.
              </p>
              <p className="font-bold text-rose-900">
                ⚠️ Conséquence immédiate : son espace chauffeur personnel n'existera plus.
              </p>
              <p className="text-slate-600">
                Si ce chauffeur possède le lien ou tente d'y accéder, l'accès lui sera formellement refusé et un écran d'espace révoqué s'affichera.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-delete-driver"
                onClick={confirmDeleteDriver}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer le retrait et détruire l'espace</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
