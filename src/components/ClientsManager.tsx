import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  FileBadge, 
  Building2, 
  User, 
  X,
  Calendar,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Client, ClientType, AgencySettings } from '../types';
import { getTranslation } from '../translations';
import { getThemeClasses } from '../utils/theme';

interface ClientsManagerProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  settings: AgencySettings;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  setClients,
  settings
}) => {
  const t = getTranslation(settings.language);
  const theme = getThemeClasses(settings.themeColor);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | ClientType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showFeedback = (message: string, type: 'error' | 'success' = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    type: 'individual',
    firstName: '',
    lastName: '',
    companyName: '',
    representativeRole: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    driverLicenseNumber: '',
    driverLicenseDate: '',
    nationality: 'Française',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      type: 'individual',
      firstName: '',
      lastName: '',
      companyName: '',
      representativeRole: '',
      email: '',
      phone: '',
      address: '',
      idNumber: '',
      driverLicenseNumber: '',
      driverLicenseDate: '',
      nationality: 'Française',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      type: client.type,
      firstName: client.firstName,
      lastName: client.lastName,
      companyName: client.companyName || '',
      representativeRole: client.representativeRole || '',
      email: client.email,
      phone: client.phone,
      address: client.address,
      idNumber: client.idNumber,
      driverLicenseNumber: client.driverLicenseNumber || '',
      driverLicenseDate: client.driverLicenseDate || '',
      nationality: client.nationality || 'Française',
      createdAt: client.createdAt || new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleDelete = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    showFeedback('Fiche client supprimée avec succès.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.idNumber) {
      showFeedback('Veuillez remplir tous les champs obligatoires (nom, prénom, email, téléphone, adresse, pièce d\'identité).', 'error');
      return;
    }

    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...formData, id: editingClient.id } : c));
      showFeedback(`Client ${formData.firstName} ${formData.lastName} mis à jour.`, 'success');
    } else {
      const newClient: Client = {
        ...formData,
        id: `cli-${Date.now()}`
      };
      setClients(prev => [newClient, ...prev]);
      showFeedback(`Nouveau client ${formData.firstName} ${formData.lastName} enregistré.`, 'success');
    }

    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c => {
    const fullName = `${c.firstName} ${c.lastName} ${c.companyName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && c.type === filterType;
  });

  return (
    <div className="space-y-6" id="clients-manager-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
            <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.text}`} />
            <span>{t.clients}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {clients.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Fichier clients, particuliers et comptes entreprises pour facturation et contrats
          </p>
        </div>

        <button
          id="btn-add-client"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-transform active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addClient}</span>
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

      {/* Search & Type filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="client-search-input"
            type="text"
            placeholder={t.searchClient}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/60 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Tous ({clients.length})
          </button>
          <button
            onClick={() => setFilterType('individual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'individual' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50/80 text-blue-800 hover:bg-blue-100/70'
            }`}
          >
            Particuliers ({clients.filter(c => c.type === 'individual').length})
          </button>
          <button
            onClick={() => setFilterType('company')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'company' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100/70'
            }`}
          >
            Entreprises ({clients.filter(c => c.type === 'company').length})
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" id="clients-card-grid">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            id={`client-card-${client.id}`}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    client.type === 'company' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {client.type === 'company' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {client.firstName} {client.lastName}
                    </h3>
                    {client.type === 'company' && client.companyName ? (
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">{client.companyName}</p>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">{t.individual}</p>
                    )}
                  </div>
                </div>

                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  client.type === 'company' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {client.type === 'company' ? t.company : t.individual}
                </span>
              </div>

              {/* Details List */}
              <div className="mt-4 space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">
                    {client.email}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${client.phone}`} className="font-medium hover:underline">
                    {client.phone}
                  </a>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{client.address}</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <FileBadge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] font-bold">
                      {client.idNumber}
                    </span>
                  </div>
                  {client.createdAt && (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      <span>Enrôlé le {client.createdAt.includes('T') ? new Date(client.createdAt).toLocaleDateString('fr-FR') : client.createdAt}</span>
                    </span>
                  )}
                </div>

                {client.driverLicenseNumber && (
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200/40 text-blue-700 text-[11px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Permis : <strong className="font-mono">{client.driverLicenseNumber}</strong></span>
                      {client.driverLicenseDate && (
                        <span className="text-slate-400 text-[10px]">({client.driverLicenseDate})</span>
                      )}
                    </div>
                    {client.driverLicensePhoto && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                        Scan joint
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                type="button"
                id={`btn-edit-client-${client.id}`}
                onClick={() => openEditModal(client)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title={t.edit}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                id={`btn-delete-client-${client.id}`}
                onClick={() => handleDelete(client.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title={t.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucun client trouvé pour cette recherche.</p>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClient ? 'Modifier le Client' : t.addClient}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.clientType} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'individual' })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      formData.type === 'individual'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{t.individual}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'company' })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      formData.type === 'company'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{t.company}</span>
                  </button>
                </div>
              </div>

              {formData.type === 'company' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.companyName} *
                  </label>
                  <input
                    type="text"
                    required={formData.type === 'company'}
                    placeholder="ex: Acme Corp SARL"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.email} *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+33 6 00 00 00 00"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.address} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 12 rue de la Paix, 75001 Paris"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.idNumber} (CNI, Passeport ou SIRET) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: CNI-123456789 ou Passeport ou SIRET"
                  value={formData.idNumber}
                  onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Driver license & enrollment information */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Informations de Conduite & Enrôlement Contractuel</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      N° Permis de Conduire
                    </label>
                    <input
                      type="text"
                      placeholder="ex: PERMIS-14A920419"
                      value={formData.driverLicenseNumber}
                      onChange={e => setFormData({ ...formData, driverLicenseNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Date de délivrance permis
                    </label>
                    <input
                      type="date"
                      value={formData.driverLicenseDate}
                      onChange={e => setFormData({ ...formData, driverLicenseDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nationalité du locataire
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Française, Marocaine..."
                      value={formData.nationality}
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Date d'enrôlement
                    </label>
                    <input
                      type="date"
                      value={formData.createdAt}
                      onChange={e => setFormData({ ...formData, createdAt: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
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
                  id="btn-save-client"
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
