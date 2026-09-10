import { Vehicle, Driver, Client, Rental, AgencySettings } from './types';

export const initialAgencySettings: AgencySettings = {
  agencyName: 'LocaFleet Prestige',
  slogan: 'Excellence & Mobilité Automobile',
  phone: '+33 (0)1 42 68 55 00',
  email: 'contact@locafleet-prestige.com',
  address: '24 Avenue des Champs-Élysées',
  city: '75008 Paris, France',
  registrationNumber: 'RCS Paris B 842 901 345 - SIRET 84290134500021',
  taxNumber: 'FR 32 842901345',
  language: 'fr',
  currency: 'EUR',
  currencySymbol: '€',
  themeColor: 'blue',
  vatRate: 20,
  contractTerms: `1. Le locataire s'engage à utiliser le véhicule en bon père de famille et conformément aux lois en vigueur.\n2. Le véhicule est remis avec le plein de carburant et doit être restitué avec le même niveau.\n3. Tout dépassement horaire ou kilométrique non stipulé au contrat fera l'objet d'une facturation complémentaire.\n4. En cas de sinistre ou d'accident, déclaration immédiate obligatoire dans les 24 heures sous peine de déchéance des garanties.`
};

export const initialVehicles: Vehicle[] = [
  {
    id: 'veh-1',
    make: 'Peugeot',
    model: '208 GT PureTech',
    year: 2024,
    licensePlate: 'GB-452-EZ',
    currentMileage: 18450,
    dailyRate: 45,
    driverSupplement: 70,
    status: 'available',
    category: 'Citadine Économique',
    fuelType: 'Essence',
    transmission: 'Manuelle',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    notes: 'Révision des 15 000 km effectuée.'
  },
  {
    id: 'veh-2',
    make: 'Renault',
    model: 'Clio V E-Tech Hybride',
    year: 2023,
    licensePlate: 'FC-891-AA',
    currentMileage: 24300,
    dailyRate: 50,
    driverSupplement: 75,
    status: 'rented',
    category: 'Citadine Hybride',
    fuelType: 'Hybride',
    transmission: 'Automatique',
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    notes: 'En location active (Contrat LOC-2026-001).'
  },
  {
    id: 'veh-3',
    make: 'Volkswagen',
    model: 'Golf 8 R-Line',
    year: 2023,
    licensePlate: 'GF-312-PM',
    currentMileage: 32100,
    dailyRate: 65,
    driverSupplement: 80,
    status: 'rented',
    category: 'Berline Compacte',
    fuelType: 'Diesel',
    transmission: 'Automatique',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    notes: 'En location avec chauffeur - en retard de restitution !'
  },
  {
    id: 'veh-4',
    make: 'BMW',
    model: 'Série 3 320d Touring',
    year: 2024,
    licensePlate: 'EK-778-XR',
    currentMileage: 12800,
    dailyRate: 110,
    driverSupplement: 95,
    status: 'available',
    category: 'Break Routière Premium',
    fuelType: 'Diesel',
    transmission: 'Automatique',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
    notes: 'État impeccable, GPS et pack d\'aides à la conduite.'
  },
  {
    id: 'veh-5',
    make: 'Mercedes-Benz',
    model: 'Classe C 220d AMG Line',
    year: 2024,
    licensePlate: 'HH-554-BC',
    currentMileage: 9400,
    dailyRate: 135,
    driverSupplement: 110,
    status: 'available',
    category: 'Berline Prestige',
    fuelType: 'Diesel',
    transmission: 'Automatique',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    notes: 'Véhicule VIP d\'apparat.'
  },
  {
    id: 'veh-6',
    make: 'Peugeot',
    model: '3008 GT Hybrid',
    year: 2023,
    licensePlate: 'FR-904-KL',
    currentMileage: 41200,
    dailyRate: 75,
    driverSupplement: 85,
    status: 'maintenance',
    category: 'SUV Familial',
    fuelType: 'Hybride Rechargeable',
    transmission: 'Automatique',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    notes: 'Changement des plaquettes et disques de freins au garage.'
  },
  {
    id: 'veh-7',
    make: 'Toyota',
    model: 'RAV4 Hybride 4WD',
    year: 2023,
    licensePlate: 'GH-633-WQ',
    currentMileage: 28900,
    dailyRate: 85,
    driverSupplement: 80,
    status: 'available',
    category: 'SUV Tout-Terrain',
    fuelType: 'Hybride',
    transmission: 'Automatique',
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
    notes: 'Pneus 4 saisons neufs.'
  }
];

export const initialDrivers: Driver[] = [
  {
    id: 'drv-1',
    firstName: 'Alexandre',
    lastName: 'Moreau',
    phone: '+33 6 12 34 56 78',
    licenseNumber: 'FR-9482017401',
    available: true,
    accessPin: '1234',
    token: 'tok_alexandre_9482',
    notes: 'Permis B et VTC - 12 ans d\'expérience.'
  },
  {
    id: 'drv-2',
    firstName: 'Yassine',
    lastName: 'Bennani',
    phone: '+33 6 88 41 23 90',
    licenseNumber: 'FR-8501239854',
    available: false, // Currently on mission with Golf 8
    accessPin: '2468',
    token: 'tok_yassine_8501',
    notes: 'Chauffeur bilingue Français / Anglais / Arabe.'
  },
  {
    id: 'drv-3',
    firstName: 'Sophie',
    lastName: 'Lambert',
    phone: '+33 7 45 19 82 04',
    licenseNumber: 'FR-7129034821',
    available: true,
    accessPin: '4321',
    token: 'tok_sophie_7129',
    notes: 'Chauffeur de direction, conduite éco-responsable.'
  },
  {
    id: 'drv-4',
    firstName: 'David',
    lastName: 'Roche',
    phone: '+33 6 72 09 15 33',
    licenseNumber: 'FR-6309821457',
    available: true,
    accessPin: '9876',
    token: 'tok_david_6309',
    notes: 'Disponible pour trajets longue distance et aéroport.'
  }
];

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    type: 'individual',
    firstName: 'Marc',
    lastName: 'Dupont',
    email: 'm.dupont@email.fr',
    phone: '+33 6 29 45 10 99',
    address: '14 rue Saint-Lazare, 75009 Paris',
    idNumber: 'CNI-190475203912',
    driverLicenseNumber: 'PERMIS-14A920419',
    driverLicenseDate: '2016-04-12',
    birthDate: '1988-09-24',
    nationality: 'Française',
    createdAt: '2025-11-10'
  },
  {
    id: 'cli-2',
    type: 'company',
    firstName: 'Hélène',
    lastName: 'Vidal',
    companyName: 'Groupe Nexis Solutions',
    representativeRole: 'Directrice Générale',
    email: 'direction@nexis-solutions.com',
    phone: '+33 1 45 90 22 10',
    address: '100 Esplanade de la Défense, 92400 Courbevoie',
    idNumber: 'SIRET 512 890 123 00049',
    driverLicenseNumber: 'PERMIS-10B550312',
    driverLicenseDate: '2012-07-19',
    birthDate: '1982-03-15',
    nationality: 'Française',
    createdAt: '2025-08-04'
  },
  {
    id: 'cli-3',
    type: 'individual',
    firstName: 'Camille',
    lastName: 'Laurent',
    email: 'camille.laurent@gmail.com',
    phone: '+33 6 73 88 12 40',
    address: '8 boulevard de la Liberté, 59000 Lille',
    idNumber: 'PASSPORT-21EF89041',
    driverLicenseNumber: 'PERMIS-18C889124',
    driverLicenseDate: '2019-11-05',
    birthDate: '1995-12-01',
    nationality: 'Française',
    createdAt: '2026-01-20'
  },
  {
    id: 'cli-4',
    type: 'company',
    firstName: 'Julien',
    lastName: 'Beaumont',
    companyName: 'Atelier Design & Architecture',
    representativeRole: 'Gérant Associé',
    email: 'contact@atelierdesign.fr',
    phone: '+33 1 40 20 30 40',
    address: '45 rue de Turenne, 75003 Paris',
    idNumber: 'SIRET 803 219 456 00018',
    driverLicenseNumber: 'PERMIS-08A441098',
    driverLicenseDate: '2010-02-28',
    birthDate: '1979-06-18',
    nationality: 'Française',
    createdAt: '2025-09-14'
  },
  {
    id: 'cli-5',
    type: 'individual',
    firstName: 'Sarah',
    lastName: 'Mansouri',
    email: 'sarah.mansouri@outlook.com',
    phone: '+33 6 50 11 94 33',
    address: '22 avenue Victor Hugo, 69002 Lyon',
    idNumber: 'CNI-200569842109',
    driverLicenseNumber: 'PERMIS-21D772091',
    driverLicenseDate: '2021-05-14',
    birthDate: '1998-04-30',
    nationality: 'Française',
    createdAt: '2026-02-01'
  }
];

// Compute date strings for realistic live testing:
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

const dMinus10 = new Date(today);
dMinus10.setDate(today.getDate() - 10);

const dMinus4 = new Date(today);
dMinus4.setDate(today.getDate() - 4);

const dMinus1 = new Date(today);
dMinus1.setDate(today.getDate() - 1);

const dMinus3 = new Date(today);
dMinus3.setDate(today.getDate() - 3);

const dPlus2 = new Date(today);
dPlus2.setDate(today.getDate() + 2);

const dPlus5 = new Date(today);
dPlus5.setDate(today.getDate() + 5);

export const initialRentals: Rental[] = [
  {
    id: 'rent-1',
    rentalNumber: 'LOC-2026-001',
    clientId: 'cli-1',
    vehicleId: 'veh-2', // Clio V
    driverId: null,
    startDate: formatDate(dMinus3),
    endDate: formatDate(dPlus2),
    totalDays: 5,
    vehicleDailyRate: 50,
    driverDailyRate: 0,
    totalVehicleCost: 250,
    totalDriverCost: 0,
    totalAmount: 250,
    status: 'active',
    checkIn: {
      mileage: 24300,
      fuelLevel: '100%',
      vehicleConditionNotes: 'Léger impact gravillon pare-chocs avant droit noté. Véhicule propre.',
      date: `${formatDate(dMinus3)} 09:30`,
      operatorName: 'Jean Vallet'
    },
    contractNumber: 'CTR-2026-001',
    createdAt: `${formatDate(dMinus3)}T09:00:00Z`,
    emailLogs: [
      {
        id: 'email-init-1',
        rentalId: 'rent-1',
        type: 'booking_confirmation',
        recipient: 'm.dupont@email.fr',
        recipientName: 'Marc Dupont',
        subject: 'Confirmation de réservation #LOC-2026-001 - LocaFleet Paris',
        body: 'Bonjour Marc Dupont,\n\nVotre réservation pour la Renault Clio V (ES-492-DM) est confirmée du ' + formatDate(dMinus3) + ' au ' + formatDate(dPlus2) + '.\nMontant total : 250,00 €.\nVotre contrat de location officiel est joint à ce message.\n\nCordialement,\nLocaFleet Paris',
        sentAt: `${formatDate(dMinus3)}T09:05:00Z`,
        status: 'opened',
        attachmentName: 'Contrat_CTR-2026-001.pdf',
        attachmentType: 'contract'
      }
    ]
  },
  {
    id: 'rent-2',
    rentalNumber: 'LOC-2026-002',
    clientId: 'cli-2', // Nexis Solutions
    vehicleId: 'veh-3', // Golf 8
    driverId: 'drv-2', // Yassine Bennani
    startDate: formatDate(dMinus4),
    endDate: formatDate(dMinus1), // OVERDUE by 1 day! Triggering the red alert requirement
    totalDays: 3,
    vehicleDailyRate: 65,
    driverDailyRate: 80,
    totalVehicleCost: 195,
    totalDriverCost: 240,
    totalAmount: 435,
    status: 'active',
    checkIn: {
      mileage: 32100,
      fuelLevel: '100%',
      vehicleConditionNotes: 'Véhicule VIP impeccable, intérieur cuir nettoyé.',
      date: `${formatDate(dMinus4)} 08:00`,
      operatorName: 'Jean Vallet'
    },
    contractNumber: 'CTR-2026-002',
    createdAt: `${formatDate(dMinus4)}T07:45:00Z`,
    emailLogs: [
      {
        id: 'email-init-2a',
        rentalId: 'rent-2',
        type: 'booking_confirmation',
        recipient: 'contact@nexissolutions.fr',
        recipientName: 'Nexis Solutions SARL',
        subject: 'Confirmation de réservation #LOC-2026-002 avec Chauffeur - LocaFleet',
        body: 'Bonjour Nexis Solutions,\n\nVotre réservation avec chauffeur privé (Yassine Bennani) pour la Volkswagen Golf 8 (BT-882-KK) est confirmée.\nMontant total : 435,00 € TTC.\n\nCordialement,\nLocaFleet Paris',
        sentAt: `${formatDate(dMinus4)}T07:50:00Z`,
        status: 'opened',
        attachmentName: 'Contrat_CTR-2026-002.pdf',
        attachmentType: 'contract'
      },
      {
        id: 'email-init-2b',
        rentalId: 'rent-2',
        type: 'return_reminder',
        recipient: 'contact@nexissolutions.fr',
        recipientName: 'Nexis Solutions SARL',
        subject: 'Rappel important : Retard de restitution #LOC-2026-002',
        body: 'Bonjour,\n\nLa fin programmée de votre location était fixée au ' + formatDate(dMinus1) + '.\nMerci de bien vouloir contacter notre agence au 01 42 68 55 00 pour convenir des modalités de restitution.',
        sentAt: `${formatDate(today)}T08:00:00Z`,
        status: 'delivered',
        attachmentType: 'none'
      }
    ]
  },
  {
    id: 'rent-3',
    rentalNumber: 'LOC-2026-003',
    clientId: 'cli-3', // Camille Laurent
    vehicleId: 'veh-1', // 208 GT
    driverId: null,
    startDate: formatDate(dMinus10),
    endDate: formatDate(dMinus4),
    totalDays: 6,
    vehicleDailyRate: 45,
    driverDailyRate: 0,
    totalVehicleCost: 270,
    totalDriverCost: 0,
    totalAmount: 270,
    status: 'returned',
    checkIn: {
      mileage: 17820,
      fuelLevel: '100%',
      vehicleConditionNotes: 'État conforme, zéro rayure.',
      date: `${formatDate(dMinus10)} 10:00`,
      operatorName: 'Jean Vallet'
    },
    checkOut: {
      mileage: 18450,
      fuelLevel: '100%',
      vehicleConditionNotes: 'Retour parfait, lavage extérieur effectué par le client.',
      returnDate: `${formatDate(dMinus4)} 16:30`,
      distanceTraveled: 630,
      operatorName: 'Jean Vallet'
    },
    contractNumber: 'CTR-2026-003',
    invoiceNumber: 'FAC-2026-089',
    invoiceDate: formatDate(dMinus4),
    createdAt: `${formatDate(dMinus10)}T09:15:00Z`,
    emailLogs: [
      {
        id: 'email-init-3a',
        rentalId: 'rent-3',
        type: 'booking_confirmation',
        recipient: 'camille.laurent@gmail.com',
        recipientName: 'Camille Laurent',
        subject: 'Confirmation de réservation #LOC-2026-003 - LocaFleet',
        body: 'Bonjour Camille Laurent,\n\nVotre réservation pour la Peugeot 208 GT est confirmée.\n\nCordialement,\nLocaFleet Paris',
        sentAt: `${formatDate(dMinus10)}T09:20:00Z`,
        status: 'opened',
        attachmentName: 'Contrat_CTR-2026-003.pdf',
        attachmentType: 'contract'
      },
      {
        id: 'email-init-3b',
        rentalId: 'rent-3',
        type: 'invoice',
        recipient: 'camille.laurent@gmail.com',
        recipientName: 'Camille Laurent',
        subject: 'Facture acquittée FAC-2026-089 - LocaFleet Paris',
        body: 'Bonjour Camille Laurent,\n\nVéhicule bien restitué. Vous trouverez ci-joint votre facture acquittée d\'un montant de 270,00 € TTC.\n\nÀ bientôt chez LocaFleet Paris !',
        sentAt: `${formatDate(dMinus4)}T16:45:00Z`,
        status: 'opened',
        attachmentName: 'Facture_FAC-2026-089.pdf',
        attachmentType: 'invoice'
      }
    ]
  },
  {
    id: 'rent-4',
    rentalNumber: 'LOC-2026-004',
    clientId: 'cli-4', // Atelier Design
    vehicleId: 'veh-5', // Mercedes Classe C
    driverId: 'drv-1', // Alexandre Moreau
    startDate: formatDate(dMinus10),
    endDate: formatDate(dMinus3),
    totalDays: 7,
    vehicleDailyRate: 135,
    driverDailyRate: 110,
    totalVehicleCost: 945,
    totalDriverCost: 770,
    totalAmount: 1715,
    status: 'returned',
    checkIn: {
      mileage: 8250,
      fuelLevel: '100%',
      vehicleConditionNotes: 'Véhicule de prestige neuf, contrôle minutieux effectué.',
      date: `${formatDate(dMinus10)} 08:30`,
      operatorName: 'Pauline Mercier'
    },
    checkOut: {
      mileage: 9400,
      fuelLevel: '100%',
      vehicleConditionNotes: 'Restitution sans accroc, client très satisfait du chauffeur.',
      returnDate: `${formatDate(dMinus3)} 18:00`,
      distanceTraveled: 1150,
      operatorName: 'Pauline Mercier'
    },
    contractNumber: 'CTR-2026-004',
    invoiceNumber: 'FAC-2026-090',
    invoiceDate: formatDate(dMinus3),
    createdAt: `${formatDate(dMinus10)}T08:00:00Z`,
    emailLogs: [
      {
        id: 'email-init-4',
        rentalId: 'rent-4',
        type: 'invoice',
        recipient: 'contact@atelierdesign.fr',
        recipientName: 'Atelier Design & Architecture',
        subject: 'Facture VIP FAC-2026-090 acquittée - LocaFleet Paris',
        body: 'Bonjour,\n\nVeuillez trouver ci-joint votre facture n° FAC-2026-090 pour la prestation Mercedes Classe C avec chauffeur.\nMontant total : 1 715,00 € TTC.\n\nMerci de votre fidélité,\nLocaFleet Paris',
        sentAt: `${formatDate(dMinus3)}T18:15:00Z`,
        status: 'opened',
        attachmentName: 'Facture_FAC-2026-090.pdf',
        attachmentType: 'invoice'
      }
    ]
  }
];
