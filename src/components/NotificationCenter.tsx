import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  Send, 
  AlertTriangle, 
  Info, 
  Mail, 
  Calendar, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onTriggerTestNotification: (type: 'booking' | 'email_confirmation' | 'invoice' | 'overdue') => void;
  onOpenRentalDetails?: (rentalId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onTriggerTestNotification,
  onOpenRentalDetails
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTester, setShowTester] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getBgColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'email':
        return 'bg-blue-50 border-blue-100';
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-indigo-50 border-indigo-100';
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / (1000 * 60));
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-block text-left" id="notification-center-widget">
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-toggle-notifications"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-all active:scale-95"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop for easy closing */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          <div 
            className="absolute right-0 sm:right-0 mt-2.5 w-[330px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-scale-in"
            style={{ maxWidth: 'calc(100vw - 20px)' }}
          >
            {/* Panel Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowTester(!showTester)}
                  title="Tester le système de notifications"
                  className="px-2 py-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 rounded-lg transition-colors text-white flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Tester</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification System Quick Tester Panel */}
            {showTester && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Tester le système de notifications :
                  </span>
                  <button 
                    onClick={() => setShowTester(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onTriggerTestNotification('booking')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-left transition-colors"
                  >
                    <span className="font-semibold text-slate-900 block text-[11px]">Nouvelle réservation</span>
                    <span className="text-[10px] text-slate-500">Arrivée d'un client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerTestNotification('email_confirmation')}
                    className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-left transition-colors"
                  >
                    <span className="font-semibold text-slate-900 block text-[11px]">Email confirmation</span>
                    <span className="text-[10px] text-slate-500">Envoi contrat PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerTestNotification('invoice')}
                    className="p-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-left transition-colors"
                  >
                    <span className="font-semibold text-slate-900 block text-[11px]">Facture envoyée</span>
                    <span className="text-[10px] text-slate-500">Paiement acquitté</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerTestNotification('overdue')}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 text-left transition-colors"
                  >
                    <span className="font-semibold text-rose-700 block text-[11px]">Alerte retard</span>
                    <span className="text-[10px] text-rose-500">Restitution dépassée</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500 text-[11px]">
                {notifications.length} message{notifications.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="hover:text-blue-600 font-semibold transition-colors text-[11px]"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="hover:text-rose-600 font-semibold transition-colors text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Effacer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-600">Aucune notification pour le moment</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Utilisez le bouton "Tester" ci-dessus pour simuler des alertes en temps réel.
                  </p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => onMarkAsRead(n.id)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      n.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${getBgColor(n.type)}`}>
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold truncate ${n.read ? 'text-slate-800' : 'text-slate-900'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimestamp(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      {n.rentalId && onOpenRentalDetails && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onOpenRentalDetails(n.rentalId!);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                        >
                          <span>Voir le dossier</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => setShowTester(true)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Simuler des flux d'emails et alertes</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface NotificationToastsProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToasts: React.FC<NotificationToastsProps> = ({
  toasts,
  onDismiss
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map(toast => {
        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 flex items-start gap-3 animate-slide-in relative overflow-hidden"
          >
            {/* Color indicator bar */}
            <span className={`absolute left-0 inset-y-0 w-1 ${
              toast.type === 'email' ? 'bg-blue-400' : toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'warning' ? 'bg-rose-400' : 'bg-slate-400'
            }`} />

            <div className="p-1.5 rounded-xl bg-white/10 shrink-0">
              {toast.type === 'email' && <Mail className="w-4 h-4 text-blue-300" />}
              {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-300" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-rose-300" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-300" />}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h5 className="text-xs font-bold text-white tracking-tight">{toast.title}</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
