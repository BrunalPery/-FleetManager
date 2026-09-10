import { Rental, Client, Vehicle, AgencySettings, SentEmailLog } from '../types';
import { formatCurrency } from './pdfGenerator';

export function createBookingConfirmationEmail(
  rental: Rental,
  client: Client,
  vehicle: Vehicle,
  settings: AgencySettings
): SentEmailLog {
  const clientName = client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`;
  const subject = `Confirmation de réservation #${rental.rentalNumber} - ${settings.agencyName}`;

  const body = `Bonjour ${clientName},

Nous avons le plaisir de vous confirmer la prise en compte de votre réservation auprès de ${settings.agencyName}.

RÉCAPITULATIF DE VOTRE LOCATION :
--------------------------------------------------
• Référence : ${rental.rentalNumber}
• Véhicule : ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})
• Période : Du ${rental.startDate} au ${rental.endDate} (${rental.totalDays} jour${rental.totalDays > 1 ? 's' : ''})
• Option chauffeur : ${rental.driverId ? 'Oui (Chauffeur privé assigné)' : 'Sans chauffeur'}
• Tarif journalier : ${formatCurrency(rental.vehicleDailyRate, settings)}/jour
• Montant total TTC : ${formatCurrency(rental.totalAmount, settings)}

Veuillez trouver ci-joint votre contrat de location officiel.
Lors de la prise en charge du véhicule, merci de vous munir de votre pièce d'identité et de votre permis de conduire original en cours de validité.

Notre équipe reste à votre entière disposition au ${settings.phone} ou par retour de courriel à ${settings.email}.

Cordialement,
L'équipe ${settings.agencyName}
${settings.address}, ${settings.city}`;

  return {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    rentalId: rental.id,
    type: 'booking_confirmation',
    recipient: client.email || 'client@email.fr',
    recipientName: clientName,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    attachmentName: `Contrat_${rental.contractNumber || rental.rentalNumber}.pdf`,
    attachmentType: 'contract'
  };
}

export function createInvoiceEmail(
  rental: Rental,
  client: Client,
  vehicle: Vehicle,
  settings: AgencySettings
): SentEmailLog {
  const clientName = client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`;
  const invoiceNum = rental.invoiceNumber || `FAC-${new Date().getFullYear()}-001`;
  const subject = `Facture ${invoiceNum} acquittée - ${settings.agencyName}`;

  const body = `Bonjour ${clientName},

Nous vous remercions de votre confiance accordée à ${settings.agencyName}.

Vous trouverez ci-joint la facture définitive n° ${invoiceNum} relative à votre location ${rental.rentalNumber} pour le véhicule ${vehicle.make} ${vehicle.model}.

DÉTAILS DU RÈGLEMENT :
--------------------------------------------------
• Numéro de Facture : ${invoiceNum}
• Date : ${rental.invoiceDate || new Date().toISOString().split('T')[0]}
• Montant Total TTC : ${formatCurrency(rental.totalAmount, settings)}
• Statut du règlement : Facture acquittée

Ce document au format PDF certifié fait office de justificatif comptable officiel.

Pour toute question concernant cette facture ou votre dossier, n'hésitez pas à contacter notre service comptabilité au ${settings.phone}.

Cordialement,
Service Comptabilité - ${settings.agencyName}`;

  return {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    rentalId: rental.id,
    type: 'invoice',
    recipient: client.email || 'client@email.fr',
    recipientName: clientName,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'opened',
    attachmentName: `Facture_${invoiceNum}.pdf`,
    attachmentType: 'invoice'
  };
}

export function createReturnReminderEmail(
  rental: Rental,
  client: Client,
  vehicle: Vehicle,
  settings: AgencySettings
): SentEmailLog {
  const clientName = client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`;
  const subject = `Rappel restitution de votre véhicule #${rental.rentalNumber} - ${settings.agencyName}`;

  const body = `Bonjour ${clientName},

Ceci est un rappel automatique concernant la fin programmée de votre location n° ${rental.rentalNumber}.

MODALITÉS DE RESTITUTION :
--------------------------------------------------
• Véhicule à restituer : ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})
• Date et heure limite : ${rental.endDate} avant 18:00
• Lieu de restitution : Agence ${settings.agencyName}, ${settings.address}, ${settings.city}

Rappels importants pour le check-out :
1. Le véhicule doit être restitué avec le même niveau de carburant qu'au départ (${rental.checkIn?.fuelLevel || '100%'}).
2. Un état des lieux de retour contradictoire sera réalisé sur place avec notre agent.
3. En cas de besoin de prolongation, merci de nous contacter au plus vite au ${settings.phone}.

À très bientôt,
L'équipe ${settings.agencyName}`;

  return {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    rentalId: rental.id,
    type: 'return_reminder',
    recipient: client.email || 'client@email.fr',
    recipientName: clientName,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    attachmentName: undefined,
    attachmentType: 'none'
  };
}

export function createCustomEmail(
  rental: Rental,
  client: Client,
  subject: string,
  message: string,
  settings: AgencySettings
): SentEmailLog {
  const clientName = client.type === 'company' && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`;

  const fullBody = `Bonjour ${clientName},

${message}

--------------------------------------------------
Dossier location n° ${rental.rentalNumber}
${settings.agencyName} - Tél : ${settings.phone}
${settings.address}, ${settings.city}`;

  return {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    rentalId: rental.id,
    type: 'custom',
    recipient: client.email || 'client@email.fr',
    recipientName: clientName,
    subject,
    body: fullBody,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    attachmentName: undefined,
    attachmentType: 'none'
  };
}
