import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  UserCheck, 
  FileText, 
  Settings, 
  PlusCircle, 
  Plus,
  Globe, 
  Coins, 
  Share2
} from 'lucide-react';
import { AgencySettings, SupportedLanguage, AppNotification } from '../types';
import { getTranslation } from '../translations';
import { NotificationCenter } from './NotificationCenter';
import { getThemeClasses } from '../utils/theme';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings: AgencySettings;
  setSettings: React.Dispatch<React.SetStateAction<AgencySettings>>;
  onOpenNewRental: () => void;
  onOpenShareModal: () => void;
  overdueCount: number;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  onTriggerTestNotification: (type: 'booking' | 'email_confirmation' | 'invoice' | 'overdue') => void;
  onOpenRentalDetails?: (rentalId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  setSettings,
  onOpenNewRental,
  onOpenShareModal,
  overdueCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
  onTriggerTestNotification,
  onOpenRentalDetails
}) => {
  const t = getTranslation(settings.language);
  const theme = getThemeClasses(settings.themeColor);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, badge: overdueCount > 0 ? overdueCount : null },
    { id: 'rentals', label: t.rentals, icon: FileText, badge: overdueCount > 0 ? `${overdueCount}` : null },
    { id: 'vehicles', label: t.vehicles, icon: Car },
    { id: 'drivers', label: t.drivers, icon: UserCheck },
    { id: 'clients', label: t.clients, icon: Users },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSettings(prev => ({
      ...prev,
      language: lang
    }));
  };

  const getThemeGradient = () => {
    switch (settings.themeColor) {
      case 'emerald': return 'from-emerald-600 to-teal-700';
      case 'amber': return 'from-amber-600 to-yellow-700';
      case 'rose': return 'from-rose-600 to-pink-700';
      case 'slate': return 'from-slate-700 to-slate-900';
      case 'indigo': return 'from-indigo-600 to-blue-700';
      case 'blue':
      default: return 'from-blue-600 to-indigo-700';
    }
  };

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* TOP HEADER (DESKTOP, TABLET & MOBILE) */}
      {/* Clean on mobile: NO hamburger button next to logo */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
            
            {/* Left: Logo & Agency Name (Pure & Épuré, no redundant mobile menu button) */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div 
                onClick={() => handleSelectTab('dashboard')} 
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
                id="agency-branding-header"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-br ${getThemeGradient()} flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105`}>
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight flex items-center">
                      {settings.agencyName}
                    </span>
                    <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                      Auto-hébergé
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal line-clamp-1 max-w-[120px] sm:max-w-xs">{settings.slogan}</p>
                </div>
              </div>
            </div>

            {/* Center: Desktop & Tablet Navigation (Visible on tablets and desktops, hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    style={isActive ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 2px 8px ${theme.primaryHex}35` } : {}}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all relative ${
                      isActive
                        ? 'text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Right: Actions & Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Notification Center (Ready to use & with test trigger) */}
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onClearAll={onClearAllNotifications}
                onTriggerTestNotification={onTriggerTestNotification}
                onOpenRentalDetails={onOpenRentalDetails}
              />

              {/* Client Portal Link & Software Customization Button (Hidden on Mobile) */}
              <button
                type="button"
                id="btn-header-client-portal"
                onClick={onOpenShareModal}
                title="Partager le lien client ou personnaliser le logiciel"
                className="hidden sm:flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 text-slate-800 font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-colors shadow-xs"
              >
                <Share2 className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
                <span className="hidden sm:inline">Lien & Personnalisation</span>
              </button>

              {/* Quick Language Switcher (Desktop & Tablet) */}
              <div className="relative hidden sm:flex items-center bg-slate-100/70 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-2 py-1 text-xs text-slate-700 transition-colors">
                <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                <select
                  id="language-quick-select"
                  aria-label={t.language}
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-1 text-slate-700"
                >
                  <option value="fr">FR</option>
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                  <option value="ar">AR</option>
                </select>
              </div>

              {/* Quick Currency Indicator (Desktop & Tablet) */}
              <button
                type="button"
                onClick={() => handleSelectTab('settings')}
                title={`${t.currency}: ${settings.currency} (${settings.currencySymbol})`}
                className="hidden sm:flex items-center gap-1 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
                id="currency-quick-pill"
              >
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{settings.currencySymbol}</span>
              </button>

              {/* Primary CTA: Nouvelle Location (Hidden on Mobile per user request) */}
              <button
                id="btn-quick-new-rental"
                onClick={onOpenNewRental}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-linear-to-r ${getThemeGradient()} hover:opacity-95 shadow-xs transition-all transform active:scale-95`}
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{t.newRental}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) */}
      {/* Épuré, aucun libellé textuel sous les icônes (Pure Icons) */}
      {/* Touch targets confortables (>= 44px) avec retour visuel actif */}
      {/* Accès direct à toutes les sections : Dashboard, Véhicules, */}
      {/* PERSONNEL (CHAUFFEURS), Locations, Clients, Partage/Réglages */}
      {/* ========================================================= */}
      <nav 
        id="mobile-bottom-navigation"
        aria-label="Navigation mobile"
        className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] px-3 py-2 flex items-center justify-around"
      >
        {/* 1. Dashboard (Accueil) */}
        <button
          type="button"
          id="mobile-nav-dashboard"
          onClick={() => handleSelectTab('dashboard')}
          aria-label={t.dashboard}
          title={t.dashboard}
          style={currentTab === 'dashboard' 
            ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}45` } 
            : { color: 'var(--theme-color)' }
          }
          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
            currentTab === 'dashboard' 
              ? 'text-white shadow-xs scale-105' 
              : 'hover:bg-slate-100/80 opacity-75 hover:opacity-100'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 transition-transform" />
        </button>

        {/* 2. Flotte Véhicules */}
        <button
          type="button"
          id="mobile-nav-vehicles"
          onClick={() => handleSelectTab('vehicles')}
          aria-label={t.vehicles}
          title={t.vehicles}
          style={currentTab === 'vehicles' 
            ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}45` } 
            : { color: 'var(--theme-color)' }
          }
          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
            currentTab === 'vehicles' 
              ? 'text-white shadow-xs scale-105' 
              : 'hover:bg-slate-100/80 opacity-75 hover:opacity-100'
          }`}
        >
          <Car className="w-5 h-5 transition-transform" />
        </button>

        {/* 3. Personnel / Chauffeurs */}
        <button
          type="button"
          id="mobile-nav-drivers"
          onClick={() => handleSelectTab('drivers')}
          aria-label="Personnel & Chauffeurs"
          title="Personnel & Chauffeurs"
          style={currentTab === 'drivers' 
            ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}45` } 
            : { color: 'var(--theme-color)' }
          }
          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
            currentTab === 'drivers' 
              ? 'text-white shadow-xs scale-105' 
              : 'hover:bg-slate-100/80 opacity-75 hover:opacity-100'
          }`}
        >
          <UserCheck className="w-5 h-5 transition-transform" />
        </button>

        {/* 4. Locations & Contrats */}
        <button
          type="button"
          id="mobile-nav-rentals"
          onClick={() => handleSelectTab('rentals')}
          aria-label={t.rentals}
          title={t.rentals}
          style={currentTab === 'rentals' 
            ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}45` } 
            : { color: 'var(--theme-color)' }
          }
          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all relative ${
            currentTab === 'rentals' 
              ? 'text-white shadow-xs scale-105' 
              : 'hover:bg-slate-100/80 opacity-75 hover:opacity-100'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5 transition-transform" />
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </div>
        </button>

        {/* 5. Fichier Clients */}
        <button
          type="button"
          id="mobile-nav-clients"
          onClick={() => handleSelectTab('clients')}
          aria-label={t.clients}
          title={t.clients}
          style={currentTab === 'clients' 
            ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}45` } 
            : { color: 'var(--theme-color)' }
          }
          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
            currentTab === 'clients' 
              ? 'text-white shadow-xs scale-105' 
              : 'hover:bg-slate-100/80 opacity-75 hover:opacity-100'
          }`}
        >
          <Users className="w-5 h-5 transition-transform" />
        </button>

        {/* 6. Lien Client / Personnalisation du Logiciel */}
        <button
          type="button"
          id="mobile-nav-share-portal"
          onClick={onOpenShareModal}
          aria-label="Partage & Personnalisation"
          title="Partage & Personnalisation"
          style={currentTab === 'portal' || currentTab === 'settings'
            ? { backgroundColor: 'var(--theme-color)', color: '#ffffff', boxShadow: `0 4px 14px ${theme.primaryHex}45` } 
            : { color: 'var(--theme-color)' }
          }
          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
            currentTab === 'portal' || currentTab === 'settings'
              ? 'text-white shadow-xs scale-105' 
              : 'hover:bg-slate-100/80 opacity-75 hover:opacity-100'
          }`}
        >
          <Share2 className="w-5 h-5 transition-transform" />
        </button>
      </nav>
    </>
  );
};
