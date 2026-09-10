import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Globe, 
  Coins, 
  Building2, 
  FileText, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  HardDrive,
  Save,
  Sparkles,
  X
} from 'lucide-react';
import { AgencySettings, SupportedLanguage, SupportedCurrency, ThemeColorKey, Vehicle, Driver, Client, Rental } from '../types';
import { getTranslation } from '../translations';
import { initialAgencySettings, initialVehicles, initialDrivers, initialClients, initialRentals } from '../mockData';
import { applyThemeCSS } from '../utils/theme';

interface SettingsManagerProps {
  settings: AgencySettings;
  setSettings: React.Dispatch<React.SetStateAction<AgencySettings>>;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  rentals: Rental[];
  setRentals: React.Dispatch<React.SetStateAction<Rental[]>>;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  setSettings,
  vehicles,
  setVehicles,
  drivers,
  setDrivers,
  clients,
  setClients,
  rentals,
  setRentals
}) => {
  const t = getTranslation(settings.language);
  const [formData, setFormData] = useState<AgencySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationBanner({ message, type });
    setTimeout(() => setNotificationBanner(null), 4000);
  };

  const currencies: { code: SupportedCurrency; symbol: string; label: string }[] = [
    { code: 'EUR', symbol: '€', label: 'Euro (€ EUR)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($ USD)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£ GBP)' },
    { code: 'MAD', symbol: 'MAD', label: 'Dirham Marocain (MAD)' },
    { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse (CHF)' },
    { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (FCFA)' },
  ];

  const themeColors: { key: ThemeColorKey; label: string; bgClass: string }[] = [
    { key: 'blue', label: 'Bleu Royal', bgClass: 'bg-blue-600' },
    { key: 'indigo', label: 'Indigo Nuit', bgClass: 'bg-indigo-600' },
    { key: 'emerald', label: 'Émeraude Luxe', bgClass: 'bg-emerald-600' },
    { key: 'amber', label: 'Or Prestige', bgClass: 'bg-amber-600' },
    { key: 'rose', label: 'Rouge Racing', bgClass: 'bg-rose-600' },
    { key: 'slate', label: 'Titane Slate', bgClass: 'bg-slate-800' },
  ];

  const handleCurrencyChange = (currencyCode: SupportedCurrency) => {
    const found = currencies.find(c => c.code === currencyCode);
    setFormData(prev => ({
      ...prev,
      currency: currencyCode,
      currencySymbol: found ? found.symbol : '€'
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    applyThemeCSS(formData.themeColor || 'blue');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export database backup as JSON file
  const handleExportJson = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      software: 'LocaFleet Manager Perpetual Edition',
      settings,
      vehicles,
      drivers,
      clients,
      rentals
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `LocaFleet_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import database backup from JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) {
          setSettings(parsed.settings);
          setFormData(parsed.settings);
        }
        if (Array.isArray(parsed.vehicles)) setVehicles(parsed.vehicles);
        if (Array.isArray(parsed.drivers)) setDrivers(parsed.drivers);
        if (Array.isArray(parsed.clients)) setClients(parsed.clients);
        if (Array.isArray(parsed.rentals)) setRentals(parsed.rentals);
        showNotification('Sauvegarde restaurée avec succès !', 'success');
      } catch {
        showNotification('Erreur lors de la lecture du fichier de sauvegarde JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset to default demo data
  const handleResetDemo = () => {
    setSettings(initialAgencySettings);
    setFormData(initialAgencySettings);
    setVehicles(initialVehicles);
    setDrivers(initialDrivers);
    setClients(initialClients);
    setRentals(initialRentals);
    showNotification('Données de démonstration réinitialisées avec succès.', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in" id="settings-manager-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <span>{t.agencySettings}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            {t.selfHostedNotice}
          </p>
        </div>

        {/* Perpetual License Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/70 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-emerald-800 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Licence Perpétuelle &bull; Auto-Hébergée</span>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationBanner && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in ${
          notificationBanner.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{notificationBanner.message}</span>
          <button 
            type="button" 
            onClick={() => setNotificationBanner(null)} 
            className="p-1 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
        
        {/* Section 1: Agency Brand & Identity */}
        <div className="bg-white p-4 sm:p-7 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{t.generalInfo}</h2>
              <p className="text-xs text-slate-500">Ces informations apparaissent sur vos contrats et factures PDF</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.agencyName} *
              </label>
              <input
                type="text"
                required
                value={formData.agencyName}
                onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.slogan}
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phone}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.email}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.address}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ville & Code Postal
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.registrationNumber}
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.taxNumber}
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personalization (Language, Currency, Colors) */}
        <div className="bg-white p-4 sm:p-7 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personnalisation de l'Interface (Multi-langue, Devise & Couleurs)
              </h2>
              <p className="text-xs text-slate-500">Configurez l'apparence selon l'identité de votre agence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Multi-language Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{t.language}</span>
              </label>
              <select
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value as SupportedLanguage })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
              >
                <option value="fr">Français (French)</option>
                <option value="en">English (Anglais)</option>
                <option value="es">Español (Espagnol)</option>
                <option value="ar">العربية (Arabe)</option>
              </select>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-500" />
                <span>{t.currency}</span>
              </label>
              <select
                value={formData.currency}
                onChange={e => handleCurrencyChange(e.target.value as SupportedCurrency)}
                className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* VAT Rate */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t.vatRate}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.vatRate}
                onChange={e => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-slate-500" />
              <span>{t.themeColor}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {themeColors.map(color => {
                const isSelected = formData.themeColor === color.key;
                return (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, themeColor: color.key }));
                      applyThemeCSS(color.key);
                      setSettings(prev => ({ ...prev, themeColor: color.key }));
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                      isSelected 
                        ? 'border-slate-900 ring-2 ring-slate-900 bg-slate-50 shadow-xs' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${color.bgClass} shrink-0`} />
                    <span className="truncate">{color.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract Terms */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{t.contractTerms}</span>
            </label>
            <textarea
              rows={4}
              value={formData.contractTerms}
              onChange={e => setFormData({ ...formData, contractTerms: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-sans border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-between">
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.settingsSaved}</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              id="btn-save-settings"
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </div>

      </form>

      {/* Section 3: Backup & Restore for Self-Hosting (Perpetual License) */}
      <div className="bg-white p-4 sm:p-7 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4" id="self-host-backup-box">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">{t.backupAndRestore}</h2>
            <p className="text-xs text-slate-500">
              Garantie d'indépendance : exportez, sauvegardez ou restaurez l'intégralité de vos données locales sans abonnement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 sm:pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJson}
            id="btn-export-database"
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{t.exportData}</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{t.importData}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={handleResetDemo}
            id="btn-reset-demo-data"
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-200/80 hover:bg-rose-50 text-xs font-bold text-rose-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetDemo}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
