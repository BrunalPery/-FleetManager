import jsPDF from 'jspdf';
import { Rental, Client, Vehicle, Driver, AgencySettings } from '../types';

export function formatCurrency(amount: number, settings: AgencySettings): string {
  const symbol = settings.currencySymbol || '€';
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

export function generateContractPdf(
  rental: Rental,
  client: Client,
  vehicle: Vehicle,
  driver: Driver | null,
  settings: AgencySettings,
  autoDownload: boolean = true
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header - Agency brand banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.agencyName.toUpperCase(), 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(settings.slogan, 14, 16);
  doc.text(`Tél: ${settings.phone} | Email: ${settings.email}`, 14, 21);

  // Document Title badge
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(pageWidth - 92, 6, 78, 16, 2, 2, 'FD');
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('CONTRAT FLOTTE & CLIENT', pageWidth - 88, 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf: ${rental.contractNumber || 'CTR-' + rental.rentalNumber}`, pageWidth - 88, 16.5);
  doc.text(`Date d'effet: ${rental.startDate}`, pageWidth - 88, 20.5);

  y = 34;

  // Legal intro banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 7, 1.5, 1.5, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONTRAT DE MISE À DISPOSITION DE VÉHICULE DE FLOTTE AUTOMOBILE', 17, y + 4.8);

  y += 11;

  // Section 1: Identification des Parties Contractantes (Soussignés)
  // Left col: Le Propriétaire de la Flotte (Loueur)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 88, 46, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LE PROPRIÉTAIRE DE FLOTTE (LOUEUR)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Société : ${settings.agencyName}`, 18, y + 12);
  doc.text(`Siège : ${settings.address}, ${settings.city}`, 18, y + 17);
  doc.text(`SIRET : ${settings.registrationNumber}`, 18, y + 22);
  doc.text(`N° TVA : ${settings.taxNumber}`, 18, y + 27);
  doc.text(`Assistance flotte : ${settings.phone}`, 18, y + 32);
  doc.text(`Email pro : ${settings.email}`, 18, y + 37);
  doc.setTextColor(100, 116, 139);
  doc.text(`Garantit l'assurance flotte tous risques et l'entretien.`, 18, y + 42);

  // Right col: Le Locataire Enrôlé (Client)
  doc.setDrawColor(191, 219, 254);
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(108, y, 88, 46, 2, 2, 'FD');

  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LE LOCATAIRE ENRÔLÉ (LE CLIENT)', 112, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const clientHeader = client.type === 'company' && client.companyName
    ? `${client.companyName} (${client.firstName} ${client.lastName})`
    : `${client.firstName} ${client.lastName}`;
  doc.text(`Nom : ${clientHeader}`, 112, y + 12);

  const enrollmentDateStr = client.createdAt 
    ? (client.createdAt.includes('T') ? new Date(client.createdAt).toLocaleDateString('fr-FR') : client.createdAt)
    : 'Registre client actif';
  doc.text(`Date d'enrôlement au fichier : ${enrollmentDateStr}`, 112, y + 17);

  doc.text(`Pièce ID / SIRET : ${client.idNumber}`, 112, y + 22);
  
  const licenseInfo = client.driverLicenseNumber 
    ? `${client.driverLicenseNumber}${client.driverLicenseDate ? ' (' + client.driverLicenseDate + ')' : ''}`
    : (driver ? 'Non requis (Formule avec chauffeur)' : 'Permis de conduire certifié conforme');
  doc.text(`Permis conduire : ${licenseInfo}`, 112, y + 27);

  if (client.driverLicensePhoto) {
    doc.text(`Justificatif permis : Téléversé & certifié`, 112, y + 32);
  } else if (client.nationality) {
    doc.text(`Nationalité : ${client.nationality}`, 112, y + 32);
  } else {
    doc.text(`Nationalité : Conforme dossier client`, 112, y + 32);
  }

  doc.text(`Adresse : ${client.address}`, 112, y + 37);
  doc.text(`Contact : ${client.phone} | ${client.email}`, 112, y + 42);

  y += 51;

  // Section 2: Désignation du Véhicule de Flotte Confié
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ARTICLE 1 : DÉSIGNATION DU VÉHICULE DE FLOTTE & ÉTAT CONSTATÉ', 17, y + 4.5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text(`• Véhicule confié : ${vehicle.make} ${vehicle.model} (${vehicle.year})`, 18, y);
  doc.text(`• Immatriculation : ${vehicle.licensePlate}`, 112, y);
  y += 5;
  doc.text(`• Catégorie & Énergie : ${vehicle.category || 'Véhicule de tourisme'} / ${vehicle.fuelType || 'Essence'}`, 18, y);
  doc.text(`• Boîte de vitesse : ${vehicle.transmission || 'Automatique'}`, 112, y);
  y += 5;
  doc.text(`• Compteur au départ : ${rental.checkIn ? rental.checkIn.mileage + ' km' : vehicle.currentMileage + ' km'}`, 18, y);
  doc.text(`• Carburant départ : ${rental.checkIn?.fuelLevel || '100%'}`, 112, y);
  y += 5;

  if (driver) {
    doc.text(`• Modalité d'exploitation : Chauffeur dédié de flotte (${driver.firstName} ${driver.lastName} - Permis ${driver.licenseNumber})`, 18, y);
  } else {
    doc.text(`• Modalité d'exploitation : Conduite autonome exclusive sous la responsabilité du locataire enrôlé`, 18, y);
  }

  y += 9;

  // Section 3: Durée & Tarification de la mise à disposition
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ARTICLE 2 : DURÉE DE LA MISE À DISPOSITION & CONDITIONS FINANCIÈRES', 17, y + 4.5);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Période contractuelle : du ${rental.startDate} au ${rental.endDate} (${rental.totalDays} jours) | Prise en charge à ${settings.city}`, 18, y);

  y += 5;

  // Financial summary table
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(18, y, 174, 6.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Désignation de la mise à disposition', 22, y + 4.5);
  doc.text('Tarif / Jour HT', 110, y + 4.5);
  doc.text('Durée', 140, y + 4.5);
  doc.text('Total HT', 168, y + 4.5);

  y += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.rect(18, y, 174, 6);
  doc.text(`Mise à disposition véhicule ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`, 22, y + 4.2);
  doc.text(formatCurrency(rental.vehicleDailyRate, settings), 110, y + 4.2);
  doc.text(`${rental.totalDays} j`, 140, y + 4.2);
  doc.text(formatCurrency(rental.totalVehicleCost, settings), 168, y + 4.2);

  if (rental.driverDailyRate > 0) {
    y += 6;
    doc.rect(18, y, 174, 6);
    doc.text(`Prestation chauffeur professionnel dédié de flotte`, 22, y + 4.2);
    doc.text(formatCurrency(rental.driverDailyRate, settings), 110, y + 4.2);
    doc.text(`${rental.totalDays} j`, 140, y + 4.2);
    doc.text(formatCurrency(rental.totalDriverCost, settings), 168, y + 4.2);
  }

  y += 6;
  doc.setFillColor(239, 246, 255);
  doc.rect(18, y, 174, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175);
  doc.text('TOTAL CONTRACTUEL DE LA MISE À DISPOSITION (TTC)', 22, y + 4.8);
  doc.text(formatCurrency(rental.totalAmount, settings), 160, y + 4.8);

  y += 12;

  // Section 4: Obligations Réciproques Propriétaire de Flotte / Client Enrôlé
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ARTICLE 3 : ENGAGEMENTS RÉCIPROQUES DU PROPRIÉTAIRE ET DU CLIENT', 17, y + 4.5);

  y += 8.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  doc.text('1. Propriétaire de Flotte : s\'engage à délivrer un véhicule révisé, conforme aux règles de sécurité, avec assurance flotte tous risques.', 18, y);
  y += 4;
  doc.text('2. Client Enrôlé : s\'engage à conduire avec prudence (« bon père de famille ») dans le strict respect du code de la route.', 18, y);
  y += 4;
  doc.text('3. Interdiction de sous-location : le véhicule est strictement réservé au locataire enrôlé. Aucun tiers non agréé ne peut conduire.', 18, y);
  y += 4;
  doc.text('4. Responsabilité & Restitution : les amendes et infractions sont à la charge exclusive du locataire. Restitution aux date et carburant initiaux.', 18, y);

  y += 7;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 88, 28);
  doc.rect(108, y, 88, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Pour le Propriétaire de Flotte (Loueur) :", 18, y + 5);
  doc.text("Pour le Locataire Enrôlé (Le Client) :", 112, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("« Bon pour mise à disposition de véhicule de flotte »", 18, y + 9);
  doc.text("Mention : « Lu et approuvé, bon pour accord contractuel »", 112, y + 9);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7);
  doc.text(`Cachet de ${settings.agencyName}`, 18, y + 20);
  doc.text(`Signature : ${client.type === 'company' && client.companyName ? client.companyName : client.firstName + ' ' + client.lastName}`, 112, y + 20);

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Fait à ${settings.city}, le ${rental.startDate}`, 18, y + 25);
  doc.text(`Date et signature du preneur :`, 112, y + 25);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Contrat de flotte généré par LocaFleet | ${settings.agencyName} - SIRET: ${settings.registrationNumber} - Tous droits réservés`,
    pageWidth / 2,
    291,
    { align: 'center' }
  );

  if (autoDownload) {
    doc.save(`Contrat_Flotte_${rental.rentalNumber}_${client.lastName}.pdf`);
  }

  return doc;
}

export function generateInvoicePdf(
  rental: Rental,
  client: Client,
  vehicle: Vehicle,
  driver: Driver | null,
  settings: AgencySettings,
  autoDownload: boolean = true
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header - Agency brand banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.agencyName.toUpperCase(), 15, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(settings.slogan, 15, 18);
  doc.text(`${settings.address}, ${settings.city} | SIRET: ${settings.registrationNumber}`, 15, 23);

  // Invoice title badge
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(pageWidth - 85, 8, 70, 15, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FACTURE ACQUITTÉE', pageWidth - 80, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const invoiceNum = rental.invoiceNumber || `FAC-${rental.rentalNumber.replace('LOC-', '')}`;
  const invoiceDate = rental.invoiceDate || rental.endDate;
  doc.text(`N°: ${invoiceNum} | Date: ${invoiceDate}`, pageWidth - 80, 20);

  y = 38;

  // Client Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 32, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FACTURÉ À :', 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const clientName = client.type === 'company' && client.companyName
    ? `${client.companyName} - Attn: ${client.firstName} ${client.lastName}`
    : `${client.firstName} ${client.lastName}`;
  doc.text(clientName, 20, y + 14);
  doc.text(`Adresse : ${client.address}`, 20, y + 20);
  doc.text(`Identifiant : ${client.idNumber} | Email : ${client.email} | Tél : ${client.phone}`, 20, y + 26);

  y += 40;

  // Rental Mission Details
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`DÉTAIL DE LA MISSION - LOCATION RÉFÉRENCE : ${rental.rentalNumber}`, 20, y + 5);

  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Véhicule : ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`, 20, y);
  doc.text(`• Période : du ${rental.startDate} au ${rental.endDate} (${rental.totalDays} jours)`, 115, y);
  y += 5.5;

  if (rental.checkIn && rental.checkOut) {
    doc.text(`• Compteur départ : ${rental.checkIn.mileage} km | Compteur retour : ${rental.checkOut.mileage} km`, 20, y);
    doc.text(`• Distance totale parcourue : ${rental.checkOut.distanceTraveled || (rental.checkOut.mileage - rental.checkIn.mileage)} km`, 115, y);
    y += 5.5;
  }

  if (driver) {
    doc.text(`• Service chauffeur : ${driver.firstName} ${driver.lastName} (Permis ${driver.licenseNumber})`, 20, y);
    y += 5.5;
  }

  y += 8;

  // Line items table
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Description', 20, y + 5.5);
  doc.text('Quantité', 105, y + 5.5);
  doc.text('P.U. HT', 135, y + 5.5);
  doc.text('Montant Total HT', 165, y + 5.5);

  // Line 1: Vehicle
  y += 8;
  doc.rect(15, y, 180, 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Location journalière ${vehicle.make} ${vehicle.model}`, 20, y + 5.5);
  doc.text(`${rental.totalDays} jours`, 105, y + 5.5);
  doc.text(formatCurrency(rental.vehicleDailyRate, settings), 135, y + 5.5);
  doc.text(formatCurrency(rental.totalVehicleCost, settings), 165, y + 5.5);

  // Line 2: Driver (if selected)
  if (rental.driverDailyRate > 0) {
    y += 8;
    doc.rect(15, y, 180, 8);
    doc.text(`Option chauffeur de transport dédié`, 20, y + 5.5);
    doc.text(`${rental.totalDays} jours`, 105, y + 5.5);
    doc.text(formatCurrency(rental.driverDailyRate, settings), 135, y + 5.5);
    doc.text(formatCurrency(rental.totalDriverCost, settings), 165, y + 5.5);
  }

  // Totals Breakdown
  y += 12;
  const vatRate = settings.vatRate || 20;
  const totalHT = rental.totalAmount / (1 + vatRate / 100);
  const totalVAT = rental.totalAmount - totalHT;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(110, y, 85, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Hors Taxes (HT) :', 115, y + 7);
  doc.text(formatCurrency(totalHT, settings), 170, y + 7);

  doc.text(`TVA (${vatRate}%) :`, 115, y + 14);
  doc.text(formatCurrency(totalVAT, settings), 170, y + 14);

  doc.setDrawColor(203, 213, 225);
  doc.line(115, y + 18, 190, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Total TTC Payé :', 115, y + 26);
  doc.text(formatCurrency(rental.totalAmount, settings), 165, y + 26);

  y += 45;

  // Payment method & confirmation notice
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('MODALITÉS ET MENTIONS LÉGALES', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Facture acquittée en totalité. Modalité de règlement : Carte bancaire / Virement.`, 20, y + 11);
  doc.text(`Pas d'escompte pour paiement anticipé. En cas de retard, pénalités au taux légal en vigueur.`, 20, y + 15);
  doc.text(`N° TVA Intracommunautaire : ${settings.taxNumber} - SIRET : ${settings.registrationNumber}`, 20, y + 19);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `LocaFleet Manager - Logiciel de gestion sous licence perpétuelle auto-hébergée | ${settings.agencyName}`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  if (autoDownload) {
    doc.save(`Facture_${invoiceNum}_${client.lastName}.pdf`);
  }

  return doc;
}
