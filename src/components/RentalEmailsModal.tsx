import React, { useState } from 'react';
import { 
  Mail, 
  X, 
  Send, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Receipt, 
  AlertTriangle, 
  Paperclip, 
  User, 
  Eye, 
  RefreshCw, 
  Plus, 
  Check, 
  ChevronRight,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Rental, Client, Vehicle, AgencySettings, SentEmailLog } from '../types';
import { 
  createBookingConfirmationEmail, 
  createInvoiceEmail, 
  createReturnReminderEmail, 
  createCustomEmail 
} from '../utils/emailSimulator';
import { formatCurrency, generateContractPdf, generateInvoicePdf } from '../utils/pdfGenerator';

interface RentalEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  client: Client;
  vehicle: Vehicle;
  settings: AgencySettings;
  onUpdateRentalEmailLogs: (rentalId: string, updatedLogs: SentEmailLog[]) => void;
  onTriggerNotification: (title: string, message: string, type: 'email' | 'success' | 'warning') => void;
}

export const RentalEmailsModal: React.FC<RentalEmailsModalProps> = ({
  isOpen,
  onClose,
  rental,
  client,
  vehicle,
  settings,
  onUpdateRentalEmailLogs,
  onTriggerNotification
}) => {
  const [selectedEmail, setSelectedEmail] = useState<SentEmailLog | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'compose'>('history');
  const [mobileView, setMobileView] = useState<'list' | 'preview'>('list');

  // Custom email form state
  const [customSubject, setCustomSubject] = useState(`Information concernant votre location #${rental.rentalNumber}`);
  const [customBody, setCustomBody] = useState('');

  if (!isOpen) return null;

  const emailLogs: SentEmailLog[] = rental.emailLogs || [];

  const handleSimulateSend = (type: 'confirmation' | 'invoice' | 'reminder') => {
    setIsSending(true);

    setTimeout(() => {
      let newLog: SentEmailLog;

      if (type === 'confirmation') {
        newLog = createBookingConfirmationEmail(rental, client, vehicle, settings);
        onTriggerNotification(
          'Email de confirmation envoyé',
          `Le contrat officiel #${rental.rentalNumber} a été transmis à ${client.email}`,
          'email'
        );
      } else if (type === 'invoice') {
        newLog = createInvoiceEmail(rental, client, vehicle, settings);
        onTriggerNotification(
          'Facture envoyée par email',
          `La facture acquittée #${rental.invoiceNumber || rental.rentalNumber} a été transmise à ${client.email}`,
          'email'
        );
      } else {
        newLog = createReturnReminderEmail(rental, client, vehicle, settings);
        onTriggerNotification(
          'Rappel de restitution envoyé',
          `Un rappel a été envoyé au client ${client.firstName} ${client.lastName}`,
          'email'
        );
      }

      const updated = [newLog, ...emailLogs];
      onUpdateRentalEmailLogs(rental.id, updated);
      setSelectedEmail(newLog);
      setIsSending(false);
      setActiveTab('history');
    }, 600);
  };

  const handleSendCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBody.trim()) return;

    setIsSending(true);

    setTimeout(() => {
      const newLog = createCustomEmail(rental, client, customSubject, customBody, settings);
      const updated = [newLog, ...emailLogs];
      onUpdateRentalEmailLogs(rental.id, updated);
      setSelectedEmail(newLog);
      setIsSending(false);
      setCustomBody('');
      setActiveTab('history');
      onTriggerNotification(
        'Email personnalisé envoyé',
        `Votre message a été transmis à ${client.email}`,
        'email'
      );
    }, 600);
  };

  const handleDownloadAttachment = (log: SentEmailLog) => {
    if (log.attachmentType === 'contract') {
      generateContractPdf(rental, client, vehicle, null, settings, true);
    } else if (log.attachmentType === 'invoice') {
      generateInvoicePdf(rental, client, vehicle, null, settings, true);
    }
  };

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        id="rental-emails-modal-container"
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/80 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Historique des Emails & Notifications
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white">
                  {rental.rentalNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi des emails automatiques envoyés au client pour cette réservation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client & Rental Context Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Destinataire :</span>
              <span className="font-bold text-slate-900">
                {client.firstName} {client.lastName}
              </span>
              <span className="text-slate-500 ml-1.5 font-mono">
                ({client.email})
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Véhicule :</span>
              <span className="font-semibold text-slate-800">
                {vehicle.make} {vehicle.model} &bull; {vehicle.licensePlate}
              </span>
            </div>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSimulateSend('confirmation')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirmation</span>
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSimulateSend('invoice')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors disabled:opacity-50"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Facture</span>
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSimulateSend('reminder')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 transition-colors disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Rappel</span>
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Emails envoyés ({emailLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'compose'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Rédiger un email personnalisé</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'history' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
              
              {/* Left Column: Email List */}
              <div className={`lg:col-span-5 space-y-3 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Historique des envois ({emailLogs.length})
                  </span>
                  {isSending && (
                    <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Envoi en cours...
                    </span>
                  )}
                </div>

                {emailLogs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">Aucun email envoyé pour l'instant</p>
                    <p className="text-[11px] text-slate-400">
                      Cliquez sur l'un des boutons ci-dessus pour simuler un envoi automatique.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                    {emailLogs.map((log) => {
                      const isSelected = selectedEmail?.id === log.id;
                      return (
                        <div
                          key={log.id}
                          onClick={() => {
                            setSelectedEmail(log);
                            setMobileView('preview');
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-2 relative ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.type === 'booking_confirmation'
                                ? 'bg-blue-100 text-blue-800'
                                : log.type === 'invoice'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.type === 'return_reminder'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {log.type === 'booking_confirmation' ? 'Confirmation' : log.type === 'invoice' ? 'Facture' : log.type === 'return_reminder' ? 'Rappel' : 'Message'}
                            </span>

                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{log.status === 'opened' ? 'Ouvert par le client' : 'Délivré'}</span>
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {log.subject}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              À : {log.recipient}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>{formatLogDate(log.sentAt)}</span>
                            {log.attachmentName && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <Paperclip className="w-3 h-3 text-blue-500" />
                                <span className="truncate max-w-[100px]">{log.attachmentName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Realistic Email Reader Preview */}
              <div className={`lg:col-span-7 bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between ${
                mobileView === 'list' ? 'hidden lg:flex' : 'flex'
              }`}>
                {/* Mobile Back Button */}
                <div className="lg:hidden pb-3 border-b border-slate-200 mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                    <span>Retour aux emails</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium">Aperçu mobile</span>
                </div>

                {selectedEmail ? (
                  <div className="space-y-4">
                    {/* Simulated Mail Client Header */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Aperçu de l'email reçu par le client
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {formatLogDate(selectedEmail.sentAt)}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-400 font-medium w-16">De :</span>
                          <span className="font-semibold text-slate-900">
                            {settings.agencyName} &lt;{settings.email}&gt;
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-400 font-medium w-16">À :</span>
                          <span className="font-semibold text-slate-900">
                            {selectedEmail.recipientName} &lt;{selectedEmail.recipient}&gt;
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-400 font-medium w-16">Objet :</span>
                          <span className="font-bold text-slate-900">
                            {selectedEmail.subject}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                        {selectedEmail.body}
                      </div>

                      {/* Simulated Attachment Card */}
                      {selectedEmail.attachmentName && (
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Pièce jointe (1 fichier PDF)
                          </span>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
                                PDF
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">
                                  {selectedEmail.attachmentName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Document officiel généré &bull; Valide
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(selectedEmail)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ouvrir PDF</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
                    <Mail className="w-10 h-10 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-700">Sélectionnez un email</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Cliquez sur un message dans la liste à gauche pour prévisualiser son contenu et ses pièces jointes.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Compose Tab */
            <form onSubmit={handleSendCustomEmail} className="max-w-2xl mx-auto space-y-4 py-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Destinataire
                </label>
                <input
                  type="text"
                  disabled
                  value={`${client.firstName} ${client.lastName} <${client.email}>`}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Objet du message
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  required
                  placeholder="Objet de l'email..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contenu de votre message
                </label>
                <textarea
                  rows={6}
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  required
                  placeholder="Saisissez votre message au client (ex: confirmation d'un horaire, informations de rendez-vous)..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSending || !customBody.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Envoi en cours...' : 'Envoyer l\'email au client'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Serveur d'envoi SMTP simulé opérationnel</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
