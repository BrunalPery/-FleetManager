export type VehicleStatus = 'available' | 'rented' | 'maintenance';
export type DriverStatus = 'available' | 'unavailable';
export type RentalStatus = 'pending' | 'active' | 'returned' | 'cancelled';
export type ClientType = 'individual' | 'company';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  currentMileage: number;
  dailyRate: number;
  driverSupplement: number;
  status: VehicleStatus;
  category?: string;
  fuelType?: string;
  transmission?: 'Manuelle' | 'Automatique';
  imageUrl?: string;
  notes?: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  available: boolean;
  accessPin?: string; // Secret 4-digit PIN for private driver access
  token?: string; // Unique private secure token for individual driver link
  notes?: string;
}

export interface Client {
  id: string;
  type: ClientType;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  idNumber: string; // CNI, Passeport ou SIRET
  driverLicenseNumber?: string; // N° Permis de conduire conducteur
  driverLicenseDate?: string; // Date de délivrance du permis
  driverLicensePhoto?: string; // Scan / photo ou justificatif du permis de conduire
  birthDate?: string; // Date de naissance
  nationality?: string; // Nationalité
  representativeRole?: string; // Fonction du représentant (si entreprise)
  notes?: string;
  createdAt?: string; // Date d'enrôlement initial du client
}

export interface CheckInDetails {
  mileage: number;
  fuelLevel: string; // e.g., '100%', '75%'
  vehicleConditionNotes: string;
  date: string;
  operatorName: string;
}

export interface CheckOutDetails {
  mileage: number;
  fuelLevel: string;
  vehicleConditionNotes: string;
  returnDate: string;
  distanceTraveled: number;
  additionalCharges?: number;
  additionalChargesReason?: string;
  operatorName: string;
}

export interface SentEmailLog {
  id: string;
  rentalId: string;
  type: 'booking_confirmation' | 'invoice' | 'contract' | 'return_reminder' | 'custom';
  recipient: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'opened';
  attachmentName?: string;
  attachmentType?: 'contract' | 'invoice' | 'none';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'email';
  timestamp: string;
  read: boolean;
  rentalId?: string;
  actionLabel?: string;
}

export interface Rental {
  id: string;
  rentalNumber: string;
  clientId: string;
  vehicleId: string;
  driverId?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  vehicleDailyRate: number;
  driverDailyRate: number;
  totalVehicleCost: number;
  totalDriverCost: number;
  totalAmount: number;
  status: RentalStatus;
  checkIn?: CheckInDetails;
  checkOut?: CheckOutDetails;
  invoiceNumber?: string;
  invoiceDate?: string;
  contractNumber?: string;
  createdAt: string;
  notes?: string;
  emailLogs?: SentEmailLog[];
}

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'ar';
export type SupportedCurrency = 'EUR' | 'USD' | 'GBP' | 'MAD' | 'CHF' | 'XOF';
export type ThemeColorKey = 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';

export interface AgencySettings {
  agencyName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  registrationNumber: string; // SIRET / Registre Commerce
  taxNumber: string; // Numéro TVA
  language: SupportedLanguage;
  currency: SupportedCurrency;
  currencySymbol: string;
  themeColor: ThemeColorKey;
  vatRate: number; // e.g. 20 for 20%
  contractTerms: string;
}
