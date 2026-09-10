import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Smartphone, 
  MessageCircle, 
  Mail, 
  Globe, 
  Eye, 
  ShieldCheck,
  Palette,
  SlidersHorizontal,
  Coins,
  Building2,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { AgencySettings, SupportedLanguage, SupportedCurrency, ThemeColorKey } from '../types';
import { applyThemeCSS } from '../utils/theme';
import { UserCheck } from 'lucide-react';

interface SharePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AgencySettings;
  setSettings?: React.Dispatch<React.SetStateAction<AgencySettings>>;
  onOpenPortalPreview: () => void;
  onOpenDriverPortal?: () => void;
  onNavigateToFullSettings?: () => void;
  initialTab?: 'share' | 'customization';
}

export const SharePortalModal: React.FC<SharePortalModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  onOpenPortalPreview,
  onOpenDriverPortal,
  onNavigateToFullSettings,
  initialTab = 'share'
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'customization'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [copiedDriver, setCopiedDriver] = useState(false);
  
  // Customization Form State
  const [formData, setFormData] = useState<AgencySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize when settings change
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  // Build the public client portal link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const portalUrl = `${origin}${pathname}?portal=true`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour ! Retrouvez les véhicules disponibles à la location chez ${settings.agencyName} et réservez directement en ligne sur notre portail : ${portalUrl}`
  );

  const emailSubject = encodeURIComponent(`Réservation de véhicule - ${settings.agencyName}`);
  const emailBody = encodeURIComponent(
    `Bonjour,\n\nVous pouvez consulter notre flotte de véhicules disponibles et réserver votre location directement sur notre lien client officiel :\n${portalUrl}\n\nCordialement,\n${settings.agencyName}\n${settings.phone}`
  );

  const currencies: { code: SupportedCurrency; symbol: string; label: string }[] = [
    { code: 'EUR', symbol: '€', label: 'Euro (€ EUR)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($ USD)' },
    { code: 'GBP', symbol: '£', label: 'Livre Sterling (£ GBP)' },
    { code: 'MAD', symbol: 'MAD', label: 'Dirham Marocain (MAD)' },
    { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse (CHF)' },
    { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (FCFA)' },
  ];

  const themeColors: { key: ThemeColorKey; label: string; bgClass: string; borderClass: string }[] = [
    { key: 'blue', label: 'Bleu Royal', bgClass: 'bg-blue-600', borderClass: 'border-blue-600' },
    { key: 'indigo', label: 'Indigo Nuit', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-600' },
    { key: 'emerald', label: 'Émeraude Luxe', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-600' },
    { key: 'amber', label: 'Or Prestige', bgClass: 'bg-amber-600', borderClass: 'border-amber-600' },
    { key: 'rose', label: 'Rouge Racing', bgClass: 'bg-rose-600', borderClass: 'border-rose-600' },
    { key: 'slate', label: 'Titane Slate', bgClass: 'bg-slate-800', borderClass: 'border-slate-800' },
  ];

  const handleCurrencyChange = (currencyCode: SupportedCurrency) => {
    const found = currencies.find(c => c.code === currencyCode);
    setFormData(prev => ({
      ...prev,
      currency: currencyCode,
      currencySymbol: found ? found.symbol : '€'
    }));
  };

  const handleSaveCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (setSettings) {
      setSettings(formData);
    }
    applyThemeCSS(formData.themeColor || 'blue');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200/80 my-auto max-h-[92vh] overflow-y-auto no-scrollbar animate-scale-in flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              {activeTab === 'share' ? (
                <Share2 className="w-5 h-5" />
              ) : (
                <Palette className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {activeTab === 'share' ? 'Lien Client Propriétaire' : 'Personnalisation du Logiciel'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {activeTab === 'share' 
                  ? 'Partagez votre portail et recevez les réservations directes' 
                  : 'Nom, logo, thème, devise et coordonnées de votre agence'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Navigation Tabs: Partage du Lien vs Personnalisation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl mt-4 border border-slate-200/60">
          <button
            type="button"
            id="tab-btn-share-link"
            onClick={() => setActiveTab('share')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'share'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Partager le Lien Client</span>
          </button>

          <button
            type="button"
            id="tab-btn-customize-software"
            onClick={() => setActiveTab('customization')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'customization'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            <span>Personnalisation</span>
          </button>
        </div>

        {/* Modal Body: TAB 1 - SHARE LINK */}
        {activeTab === 'share' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Explanatory Banner */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 sm:p-4 flex items-start gap-3 text-xs text-slate-600">
              <Smartphone className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">
                  Votre portail client dédié & auto-hébergé
                </p>
                <p className="mt-0.5 text-slate-500 leading-relaxed text-[11px] sm:text-xs">
                  Vos clients peuvent parcourir les véhicules disponibles, réserver immédiatement avec dates & options, et suivre leur réservation en saisissant leur numéro de dossier.
                </p>
              </div>
            </div>

            {/* Direct Link Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Lien public de réservation directe
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 px-2 flex-1 overflow-hidden">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-700 truncate select-all">
                    {portalUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  id="btn-copy-portal-link"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Envoyer à vos clients en un clic
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-xs font-bold text-emerald-800 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* Preview Client Portal Mode Button */}
            <div className="pt-1">
              <button
                type="button"
                id="btn-preview-client-portal"
                onClick={() => {
                  onClose();
                  onOpenPortalPreview();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all active:scale-[0.99]"
              >
                <Eye className="w-4 h-4 text-slate-700" />
                <span>Tester la vue client (Aperçu direct)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>
            </div>

            {/* SEPARATE DRIVER PORTAL LINK BOX */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Lien Espace Chauffeur (Missions & Connexion)</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Accès Chauffeurs
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Transmettez ce lien direct à vos chauffeurs pour qu'ils puissent se connecter sur leur smartphone et postuler aux nouvelles courses.
              </p>

              <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 px-2 flex-1 overflow-hidden">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-700 truncate select-all">
                    {`${origin}${pathname}?driver=true`}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-copy-driver-link-modal"
                  onClick={async () => {
                    const driverUrl = `${origin}${pathname}?driver=true`;
                    try {
                      await navigator.clipboard.writeText(driverUrl);
                      setCopiedDriver(true);
                      setTimeout(() => setCopiedDriver(false), 2500);
                    } catch {
                      setCopiedDriver(true);
                      setTimeout(() => setCopiedDriver(false), 2500);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-2xs"
                >
                  {copiedDriver ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Bonjour ! Voici votre lien d'accès à l'Espace Chauffeur pour vos missions chez ${settings.agencyName} : ${origin}${pathname}?driver=true`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Chauffeur</span>
                </a>

                {onOpenDriverPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDriverPortal();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ouvrir l'Espace</span>
                  </button>
                )}
              </div>
            </div>

            {/* Perpetual license note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 justify-center text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Les réservations et affectations de missions sont synchronisées en temps réel.</span>
            </div>
          </div>
        )}

        {/* Modal Body: TAB 2 - SOFTWARE CUSTOMIZATION */}
        {activeTab === 'customization' && (
          <form onSubmit={handleSaveCustomization} className="mt-4 space-y-4 animate-fade-in" id="quick-customization-form">
            
            {/* Identity Group */}
            <div className="space-y-3 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Identité de votre Agence</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nom de l'agence *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.agencyName}
                    onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="Ex: Prestige Rent Paris"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Slogan / Sous-titre
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="Ex: Location de véhicules & chauffeurs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  URL du Logo (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.logoUrl || ''}
                  onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  placeholder="https://exemple.com/logo.png"
                />
              </div>
            </div>

            {/* Theme & Palette */}
            <div className="space-y-2.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                <span>Thème Visuel & Couleur Principale</span>
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {themeColors.map(color => {
                  const isSelected = formData.themeColor === color.key;
                  return (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, themeColor: color.key }));
                        applyThemeCSS(color.key);
                        if (setSettings) {
                          setSettings(prev => ({ ...prev, themeColor: color.key }));
                        }
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-slate-900 ring-2 ring-slate-900 bg-white shadow-xs' 
                          : 'border-slate-200 bg-white hover:bg-slate-100/60'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full ${color.bgClass} shadow-2xs`} />
                      <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                        {color.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  <span>Devise par défaut</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={e => handleCurrencyChange(e.target.value as SupportedCurrency)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Langue de l'interface</span>
                </label>
                <select
                  value={formData.language}
                  onChange={e => setFormData({ ...formData, language: e.target.value as SupportedLanguage })}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="fr">Français (French)</option>
                  <option value="en">English (Anglais)</option>
                  <option value="es">Español (Espagnol)</option>
                  <option value="ar">العربية (Arabe)</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Téléphone de contact</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  placeholder="+33 1 42 68 55 00"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>Email officiel</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  placeholder="contact@agence.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Adresse postale</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  placeholder="24 Avenue des Champs-Élysées, 75008 Paris"
                />
              </div>
            </div>

            {/* Actions: Save Button & Full Settings Link */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {onNavigateToFullSettings ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToFullSettings();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 transition-colors"
                >
                  <span>Paramètres complets & sauvegardes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enregistré !</span>
                  </span>
                )}

                <button
                  type="submit"
                  id="btn-save-quick-customization"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la personnalisation</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
