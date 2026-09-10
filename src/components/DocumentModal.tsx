import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Car, 
  User, 
  Building2,
  Receipt,
  FileBadge,
  CreditCard,
  Calendar,
  Scale,
  Key
} from 'lucide-react';
import { Rental, Vehicle, Client, Driver, AgencySettings } from '../types';
import { getTranslation } from '../translations';
import { formatCurrency, generateContractPdf, generateInvoicePdf } from '../utils/pdfGenerator';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'contract' | 'invoice';
  rental: Rental;
  vehicle: Vehicle;
  client: Client;
  driver?: Driver | null;
  settings: AgencySettings;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documentType,
  rental,
  vehicle,
  client,
  driver,
  settings
}) => {
  const t = getTranslation(settings.language);

  if (!isOpen) return null;

  const isContract = documentType === 'contract';

  const handleDownloadPdf = () => {
    if (isContract) {
      generateContractPdf(rental, client, vehicle, driver || null, settings, true);
    } else {
      generateInvoicePdf(rental, client, vehicle, driver || null, settings, true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = rental.invoiceNumber || `FAC-${rental.rentalNumber.replace('LOC-', '')}`;
  const contractNumber = rental.contractNumber || `CTR-${rental.rentalNumber}`;

  const vatRate = settings.vatRate || 20;
  const totalHT = rental.totalAmount / (1 + vatRate / 100);
  const totalVAT = rental.totalAmount - totalHT;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-7 shadow-xl border border-slate-200/80 my-auto max-h-[92vh] overflow-y-auto no-scrollbar print:shadow-none print:border-none print:m-0 print:max-w-none">
        
        {/* Top Control Bar (hidden on print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isContract ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isContract ? <FileText className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isContract ? t.contractTitle : t.invoiceTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                {isContract ? contractNumber : invoiceNumber} &bull; {rental.rentalNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title={t.printDoc}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t.printDoc}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              id="btn-download-pdf-doc"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadPdf}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper View */}
        <div className="mt-6 border border-slate-200 rounded-xl p-6 sm:p-8 bg-white shadow-xs print:border-none print:p-0" id="printable-doc-content">
          
          {/* Document Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Car className="w-6 h-6 text-slate-800" />
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {settings.agencyName}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">{settings.slogan}</p>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <p>{settings.address}, {settings.city}</p>
                <p>Tél: {settings.phone} &bull; Email: {settings.email}</p>
                <p className="font-mono text-[11px]">SIRET: {settings.registrationNumber} &bull; TVA: {settings.taxNumber}</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase mb-2 ${
                isContract ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}>
                {isContract ? 'Contrat de Mise à Disposition Flotte' : 'Facture Acquittée'}
              </span>
              <p className="text-xs text-slate-500 font-mono">
                Réf : <strong className="text-slate-800">{isContract ? contractNumber : invoiceNumber}</strong>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Date : {rental.checkOut?.returnDate?.split(' ')[0] || rental.startDate}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CASE A: CONTRACT VIEW (Propriétaire de Flotte <-> Client Enrôlé) */}
          {/* ========================================================= */}
          {isContract ? (
            <div className="mt-6 space-y-6">
              {/* Introduction légale du contrat */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-[11px] text-blue-950 flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-blue-900 mb-0.5">
                    CONTRAT DE LOCATION ET DE MISE À DISPOSITION DE VÉHICULE DE FLOTTE AUTOMOBILE
                  </strong>
                  <span>
                    Entre les soussignés, il a été convenu la mise à disposition exclusive du véhicule de flotte désigné ci-après, sous réserve de la pleine acceptation des conditions générales et particulières par le locataire préalablement enrôlé.
                  </span>
                </div>
              </div>

              {/* Identification rigoureuse des Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Le Propriétaire de la Flotte */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Le Propriétaire de Flotte (Loueur)</span>
                  </div>
                  <p className="font-bold text-sm text-slate-900">{settings.agencyName}</p>
                  <p className="text-slate-600">Siège social : {settings.address}, {settings.city}</p>
                  <p className="text-slate-600">Tél. assistance flotte : {settings.phone}</p>
                  <p className="text-slate-600">Email professionnel : {settings.email}</p>
                  <p className="font-mono text-slate-700 pt-1 text-[11px]">
                    SIRET : <strong>{settings.registrationNumber}</strong> &bull; TVA : <strong>{settings.taxNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    Garantit la conformité, l'assurance flotte et l'entretien technique régulier du véhicule.
                  </p>
                </div>

                {/* 2. Le Client Locataire Enrôlé */}
                <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-200/60">
                    <div className="flex items-center gap-1.5 text-blue-950 font-bold uppercase tracking-wider text-[10px]">
                      <User className="w-3.5 h-3.5 text-blue-700" />
                      <span>Le Locataire Enrôlé (Client)</span>
                    </div>
                    {client.createdAt && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Enrôlé le {client.createdAt.includes('T') ? new Date(client.createdAt).toLocaleDateString('fr-FR') : client.createdAt}</span>
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-sm text-slate-900">
                    {client.type === 'company' && client.companyName 
                      ? `${client.companyName}` 
                      : `${client.firstName} ${client.lastName}`}
                  </p>

                  {client.type === 'company' && client.companyName && (
                    <p className="text-slate-700 font-medium">
                      Représenté par : <strong>{client.firstName} {client.lastName}</strong> {client.representativeRole ? `(${client.representativeRole})` : '(Représentant Légal)'}
                    </p>
                  )}

                  <p className="text-slate-600">Adresse légale : {client.address}</p>
                  <p className="text-slate-600">Contact : {client.phone} &bull; {client.email}</p>

                  <div className="pt-1.5 border-t border-blue-200/60 space-y-1">
                    <div className="flex items-center gap-2 text-slate-800">
                      <FileBadge className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Pièce d'identité / SIRET : <strong className="font-mono">{client.idNumber}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        Permis de conduire : {client.driverLicenseNumber ? (
                          <>
                            <strong className="font-mono">{client.driverLicenseNumber}</strong>
                            {client.driverLicenseDate && <span className="text-slate-500 font-normal"> (délivré le {client.driverLicenseDate})</span>}
                          </>
                        ) : driver ? (
                          <span className="text-blue-700 font-semibold italic">Non requis (Avec chauffeur privé)</span>
                        ) : (
                          <strong className="font-mono">Permis certifié conforme</strong>
                        )}
                      </span>
                    </div>

                    {client.driverLicensePhoto && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Justificatif de permis déposé lors de l'enrôlement</span>
                      </div>
                    )}

                    {client.nationality && (
                      <div className="text-[11px] text-slate-600">
                        Nationalité : <strong>{client.nationality}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Article 1 : Véhicule de Flotte & Conditions de mise à disposition */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-slate-700" />
                    <span>Article 1 : Désignation du Véhicule de Flotte Confié</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-white border border-slate-300 rounded-md text-xs">
                    {vehicle.licensePlate}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Modèle & Année</span>
                    <strong className="text-slate-900">{vehicle.make} {vehicle.model}</strong> ({vehicle.year})
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Catégorie & Énergie</span>
                    <span>{vehicle.category || 'Véhicule de tourisme'} &bull; {vehicle.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Transmission</span>
                    <span>{vehicle.transmission}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Km Départ</span>
                    <strong className="font-mono text-slate-900">{rental.checkIn?.mileage || vehicle.currentMileage} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Carburant Départ</span>
                    <strong className="text-slate-900">{rental.checkIn?.fuelLevel || '100%'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Période Convenue</span>
                    <strong className="text-slate-900">{rental.totalDays} jour(s)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Lieu de prise en charge</span>
                    <span className="text-slate-900">{settings.city}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-700">
                    Mode d'exploitation : {driver ? (
                      <strong className="text-blue-900">
                        Chauffeur de flotte dédié mis à disposition : {driver.firstName} {driver.lastName} (Permis {driver.licenseNumber})
                      </strong>
                    ) : (
                      <strong className="text-slate-800">
                        Conduite autonome sous la responsabilité directe et exclusive du locataire enrôlé.
                      </strong>
                    )}
                  </span>
                </div>
              </div>

              {/* Article 2 & 3 : Tableau Financier & Caution */}
              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[440px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Article 2 : Prestation et mise à disposition</th>
                      <th className="px-4 py-2.5 text-center">Durée</th>
                      <th className="px-4 py-2.5 text-right">Tarif journalier HT</th>
                      <th className="px-4 py-2.5 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-4 py-3 font-medium">
                        Mise à disposition du véhicule de flotte : {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </td>
                      <td className="px-4 py-3 text-center">{rental.totalDays} j</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(rental.vehicleDailyRate, settings)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(rental.totalVehicleCost, settings)}</td>
                    </tr>

                    {rental.driverDailyRate > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-blue-700">
                          Prestation chauffeur professionnel dédié
                        </td>
                        <td className="px-4 py-3 text-center">{rental.totalDays} j</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(rental.driverDailyRate, settings)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(rental.totalDriverCost, settings)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Caution */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 max-w-sm space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Assurance Flotte & Dépôt de Garantie :</span>
                  </p>
                  <p>
                    Le véhicule bénéficie d'une assurance flotte professionnelle tous risques. Un dépôt de garantie (caution) a été validé lors de la prise en charge et sera restitué après contrôle contradictoire du véhicule.
                  </p>
                </div>

                <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Montant total HT :</span>
                    <span className="font-semibold">{formatCurrency(totalHT, settings)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA légale ({vatRate}%) :</span>
                    <span className="font-semibold">{formatCurrency(totalVAT, settings)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 text-sm font-bold">
                    <span>Total Contractuel TTC :</span>
                    <span className="text-base text-blue-700">{formatCurrency(rental.totalAmount, settings)}</span>
                  </div>
                </div>
              </div>

              {/* Article 3 : Engagements Réciproques Propriétaire / Client */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Article 3 : Obligations et Engagements Réciproques des Parties
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-600 leading-relaxed">
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Engagements du Propriétaire de la Flotte :</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                      <li>Fourniture d'un véhicule en parfait état de fonctionnement et de propreté.</li>
                      <li>Couverture d'assurance flotte professionnelle à jour.</li>
                      <li>Assistance en cas de panne mécanique durant la période contractuelle.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Engagements du Locataire Enrôlé :</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                      <li>Conduite prudente et respect strict du code de la route (« bon père de famille »).</li>
                      <li>Interdiction absolue de sous-location ou de prêt à un tiers non enrôlé.</li>
                      <li>Restitution aux date et niveau de carburant constatés au départ.</li>
                      <li>Prise en charge intégrale des amendes et infractions encourues.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Signatures juridiques formelles */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 sm:gap-8 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Pour le Propriétaire de Flotte (Loueur) :</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">« Bon pour mise à disposition du véhicule de flotte »</p>
                  <div className="mt-2 h-24 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 bg-slate-50/40">
                    <span className="font-semibold text-slate-700 text-xs">{settings.agencyName}</span>
                    <span className="text-[10px] text-slate-400">Direction de Flotte &bull; {settings.city}</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-1">SIRET : {settings.registrationNumber}</span>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Pour le Locataire Enrôlé (Client) :</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">Mention manuscrite « Lu et approuvé, bon pour accord contractuel »</p>
                  <div className="mt-2 h-24 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 bg-slate-50/40">
                    <span className="font-semibold text-slate-700 text-xs">
                      {client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
                    </span>
                    <span className="text-[10px] text-slate-400 italic">Signature du locataire titulaire</span>
                    <span className="text-[9px] text-slate-400 mt-1">Fait à {settings.city}, le {rental.startDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* CASE B: INVOICE VIEW (Facture acquittée)                  */
            /* ========================================================= */
            <div className="mt-6 space-y-6">
              {/* Client & Rental Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase tracking-wider block text-[10px]">
                    Facturé à
                  </span>
                  <p className="font-bold text-sm text-slate-900">
                    {client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
                  </p>
                  {client.type === 'company' && client.companyName && (
                    <p className="text-slate-600">Attn: {client.firstName} {client.lastName}</p>
                  )}
                  <p className="text-slate-600">{client.address}</p>
                  <p className="text-slate-600">Tél: {client.phone} &bull; {client.email}</p>
                  <p className="font-mono text-slate-700">Pièce ID / SIRET: <strong>{client.idNumber}</strong></p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase tracking-wider block text-[10px]">
                    Détail de la Mission
                  </span>
                  <p className="font-semibold text-slate-800">
                    Véhicule : <span className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</span> ({vehicle.year})
                  </p>
                  <p className="font-mono text-slate-700">
                    Immatriculation : <strong className="px-1.5 py-0.5 bg-white border rounded">{vehicle.licensePlate}</strong>
                  </p>
                  <p className="text-slate-600">
                    Période : du <strong>{rental.startDate}</strong> au <strong>{rental.endDate}</strong> ({rental.totalDays} jours)
                  </p>
                  {driver ? (
                    <p className="text-indigo-700 font-medium">
                      Chauffeur dédié : {driver.firstName} {driver.lastName} (Permis {driver.licenseNumber})
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">Sans chauffeur dédié</p>
                  )}
                </div>
              </div>

              {/* Inspection state if available */}
              {(rental.checkIn || rental.checkOut) && (
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Km Départ</span>
                      <span className="font-mono font-bold text-slate-800">{rental.checkIn?.mileage || vehicle.currentMileage} km</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Km Retour</span>
                      <span className="font-mono font-bold text-slate-800">{rental.checkOut?.mileage ? `${rental.checkOut.mileage} km` : 'En cours'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Distance parcourue</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {rental.checkOut ? `+${rental.checkOut.distanceTraveled} km` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Carburant retour</span>
                      <span className="font-bold text-slate-800">{rental.checkOut?.fuelLevel || rental.checkIn?.fuelLevel || '100%'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[440px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Prestation</th>
                      <th className="px-4 py-2.5 text-center">Durée</th>
                      <th className="px-4 py-2.5 text-right">Tarif unitaire / j</th>
                      <th className="px-4 py-2.5 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-4 py-3 font-medium">
                        Location de véhicule : {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </td>
                      <td className="px-4 py-3 text-center">{rental.totalDays} j</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(rental.vehicleDailyRate, settings)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(rental.totalVehicleCost, settings)}</td>
                    </tr>

                    {rental.driverDailyRate > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-blue-700">
                          Prestation chauffeur professionnel de conduite
                        </td>
                        <td className="px-4 py-3 text-center">{rental.totalDays} j</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(rental.driverDailyRate, settings)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(rental.totalDriverCost, settings)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Box */}
              <div className="flex justify-end">
                <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total HT :</span>
                    <span className="font-semibold">{formatCurrency(totalHT, settings)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA ({vatRate}%) :</span>
                    <span className="font-semibold">{formatCurrency(totalVAT, settings)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 text-sm font-bold">
                    <span>Total TTC :</span>
                    <span className="text-base text-blue-700">{formatCurrency(rental.totalAmount, settings)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice mention */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Facture réglée et acquittée</span>
                </p>
                <p className="mt-0.5 text-slate-600 text-[11px]">
                  Règlement reçu par carte bancaire / virement. Document tenant lieu de quittance définitive.
                </p>
              </div>

              {/* Signatures zone */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Cachet et signature de l'agence :</p>
                  <div className="mt-2 h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 italic text-[11px]">
                    {settings.agencyName}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Signature du client (bon pour accord) :</p>
                  <div className="mt-2 h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 italic text-[11px]">
                    Lu et approuvé
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
