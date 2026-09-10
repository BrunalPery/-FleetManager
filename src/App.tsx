import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { VehiclesManager } from './components/VehiclesManager';
import { DriversManager } from './components/DriversManager';
import { ClientsManager } from './components/ClientsManager';
import { RentalsManager } from './components/RentalsManager';
import { SettingsManager } from './components/SettingsManager';
import { NewRentalModal } from './components/NewRentalModal';
import { CheckInOutModal } from './components/CheckInOutModal';
import { DocumentModal } from './components/DocumentModal';
import { ClientPortalView } from './components/ClientPortalView';
import { DriverPortalView } from './components/DriverPortalView';
import { SharePortalModal } from './components/SharePortalModal';
import { RentalEmailsModal } from './components/RentalEmailsModal';
import { 
  Vehicle, 
  Driver, 
  Client, 
  Rental, 
  AgencySettings, 
  CheckInDetails, 
  CheckOutDetails,
  AppNotification,
  SentEmailLog
} from './types';
import { 
  initialAgencySettings, 
  initialVehicles, 
  initialDrivers, 
  initialClients, 
  initialRentals 
} from './mockData';
import { 
  createBookingConfirmationEmail, 
  createInvoiceEmail 
} from './utils/emailSimulator';
import { applyThemeCSS } from './utils/theme';

export default function App() {
  // Local storage keys
  const LS_SETTINGS_KEY = 'locafleet_settings_v1';
  const LS_VEHICLES_KEY = 'locafleet_vehicles_v1';
  const LS_DRIVERS_KEY = 'locafleet_drivers_v1';
  const LS_CLIENTS_KEY = 'locafleet_clients_v1';
  const LS_RENTALS_KEY = 'locafleet_rentals_v1';
  const LS_NOTIFICATIONS_KEY = 'locafleet_notifications_v1';

  // State with localStorage persistence
  const [settings, setSettings] = useState<AgencySettings>(() => {
    const saved = localStorage.getItem(LS_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : initialAgencySettings;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(LS_VEHICLES_KEY);
    return saved ? JSON.parse(saved) : initialVehicles;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem(LS_DRIVERS_KEY);
    const parsed: Driver[] = saved ? JSON.parse(saved) : initialDrivers;
    return parsed.map((d, idx) => ({
      ...d,
      accessPin: d.accessPin || ['1234', '2468', '4321', '9876'][idx % 4] || '1234',
      token: d.token || `tok_${d.firstName.toLowerCase()}_${(d.licenseNumber || '').slice(-4) || idx}`
    }));
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(LS_CLIENTS_KEY);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [rentals, setRentals] = useState<Rental[]>(() => {
    const saved = localStorage.getItem(LS_RENTALS_KEY);
    return saved ? JSON.parse(saved) : initialRentals;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(LS_NOTIFICATIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
    return [
      {
        id: 'notif-1',
        title: 'Alerte Retard de Restitution',
        message: 'La réservation #LOC-2026-002 (Golf 8) est en retard de restitution.',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        rentalId: 'rent-2'
      },
      {
        id: 'notif-2',
        title: 'Contrat envoyé par Email',
        message: 'Confirmation et contrat officiel transmis à Marc Dupont (m.dupont@email.fr)',
        type: 'email',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        read: true,
        rentalId: 'rent-1'
      }
    ];
  });

  // Active navigation tab (detect ?portal=true or ?driver=true for direct link)
  const isPublicClientPortal = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('portal') === 'true' ||
    window.location.search.includes('portal=true')
  );
  const isPublicDriverPortal = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('driver') === 'true' ||
    window.location.search.includes('driver=true')
  );

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'true') {
        return 'portal';
      }
      if (params.get('driver') === 'true') {
        return 'driver_portal';
      }
    }
    return 'dashboard';
  });

  const [driverPortalDriverId, setDriverPortalDriverId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('driverId') || params.get('token') || null;
    }
    return null;
  });

  // Modal states
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [checkInOutModal, setCheckInOutModal] = useState<{
    isOpen: boolean;
    type: 'check-in' | 'check-out';
    rental: Rental | null;
  }>({
    isOpen: false,
    type: 'check-in',
    rental: null
  });

  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    documentType: 'contract' | 'invoice';
    rental: Rental | null;
  }>({
    isOpen: false,
    documentType: 'contract',
    rental: null
  });

  // Rental Emails History & Simulation Modal
  const [emailsModal, setEmailsModal] = useState<{
    isOpen: boolean;
    rental: Rental | null;
  }>({
    isOpen: false,
    rental: null
  });

  // Save to localStorage automatically
  useEffect(() => {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(LS_VEHICLES_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(LS_DRIVERS_KEY, JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem(LS_CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(LS_RENTALS_KEY, JSON.stringify(rentals));
  }, [rentals]);

  useEffect(() => {
    localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // RTL support for Arabic
  useEffect(() => {
    if (settings.language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [settings.language]);

  // Dynamic Theme Styling across icons & UI components
  useEffect(() => {
    applyThemeCSS(settings.themeColor || 'blue');
  }, [settings.themeColor]);

  // Overdue count for badge
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = rentals.filter(r => r.status === 'active' && r.endDate < todayStr).length;

  // --- NOTIFICATION HANDLERS ---
  const addNotification = (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'email', 
    rentalId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      rentalId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleTriggerTestNotification = (type: 'booking' | 'email_confirmation' | 'invoice' | 'overdue') => {
    if (type === 'booking') {
      addNotification(
        'Nouvelle réservation reçue !',
        'Mme Sophie Martin a réservé la Peugeot 208 GT pour 3 jours (310,00 €).',
        'success',
        'rent-1'
      );
    } else if (type === 'email_confirmation') {
      addNotification(
        'Email de confirmation simulé',
        'Le contrat n° CTR-2026-001 a été envoyé avec succès à m.dupont@email.fr.',
        'email',
        'rent-1'
      );
    } else if (type === 'invoice') {
      addNotification(
        'Facture acquittée transmise',
        'La facture n° FAC-2026-089 a été expédiée par email au client Camille Laurent.',
        'email',
        'rent-3'
      );
    } else {
      addNotification(
        'Alerte : Restitution dépassée',
        'Le véhicule Golf 8 (BT-882-KK) n\'a pas été restitué à l\'heure prévue !',
        'warning',
        'rent-2'
      );
    }
  };

  // --- CORE BUSINESS LOGIC HANDLERS ---

  /**
   * 1. Validate & Confirm New Rental:
   * Rule: Vehicle status becomes "En location" ('rented')
   * Driver status becomes "Indisponible" (available = false)
   * Automatic booking confirmation email is generated and logged
   */
  const handleConfirmNewRental = (newRental: Rental) => {
    const targetVehicle = vehicles.find(v => v.id === newRental.vehicleId) || vehicles[0];
    const targetClient = clients.find(c => c.id === newRental.clientId) || clients[0];

    // Automatic email confirmation simulation
    const autoEmail = createBookingConfirmationEmail(newRental, targetClient, targetVehicle, settings);
    const finalizedRental: Rental = {
      ...newRental,
      emailLogs: [autoEmail, ...(newRental.emailLogs || [])]
    };

    // Add rental to list
    setRentals(prev => [finalizedRental, ...prev]);

    // Update vehicle status to 'rented'
    setVehicles(prev => prev.map(v => v.id === newRental.vehicleId ? { ...v, status: 'rented' } : v));

    // If driver is selected, update driver status to unavailable (false)
    if (newRental.driverId) {
      setDrivers(prev => prev.map(d => d.id === newRental.driverId ? { ...d, available: false } : d));
    }

    // Trigger in-app notification
    addNotification(
      `Nouvelle réservation #${newRental.rentalNumber}`,
      `Confirmation & contrat PDF transmis par email à ${targetClient?.email || targetClient?.firstName || 'client'}.`,
      'email',
      newRental.id
    );
  };

  /**
   * Handler for online bookings made directly by clients via the shared link
   */
  const handleClientSubmitRental = (
    newRental: Rental, 
    clientData: { 
      firstName: string; 
      lastName: string; 
      phone: string; 
      email: string;
      driverLicenseNumber?: string;
      driverLicenseDate?: string;
      driverLicensePhoto?: string;
    }
  ) => {
    let existingClient = clients.find(c => c.phone === clientData.phone || (clientData.email && c.email === clientData.email));
    let assignedClientId = existingClient?.id;

    if (existingClient) {
      // Update license if provided
      if (clientData.driverLicenseNumber || clientData.driverLicensePhoto) {
        setClients(prev => prev.map(c => c.id === existingClient!.id ? {
          ...c,
          driverLicenseNumber: clientData.driverLicenseNumber || c.driverLicenseNumber,
          driverLicenseDate: clientData.driverLicenseDate || c.driverLicenseDate,
          driverLicensePhoto: clientData.driverLicensePhoto || c.driverLicensePhoto
        } : c));
      }
    } else {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        phone: clientData.phone,
        email: clientData.email,
        address: settings.city || 'Non précisée',
        idNumber: clientData.driverLicenseNumber ? `Permis ${clientData.driverLicenseNumber}` : 'Enrôlement en ligne',
        driverLicenseNumber: clientData.driverLicenseNumber || undefined,
        driverLicenseDate: clientData.driverLicenseDate || undefined,
        driverLicensePhoto: clientData.driverLicensePhoto || undefined,
        type: 'individual',
        notes: clientData.driverLicenseNumber 
          ? `Enrôlement vitrine sans chauffeur (Permis N° ${clientData.driverLicenseNumber})` 
          : 'Réservation directe via le lien de partage vitrine',
        createdAt: new Date().toISOString()
      };
      setClients(prev => [newClient, ...prev]);
      assignedClientId = newClient.id;
    }

    const finalizedRental: Rental = {
      ...newRental,
      clientId: assignedClientId || newRental.clientId
    };

    handleConfirmNewRental(finalizedRental);
  };

  /**
   * 2. Check-in (État des lieux départ):
   * Record starting mileage and remarks
   */
  const handleConfirmCheckIn = (rentalId: string, details: CheckInDetails) => {
    setRentals(prev => prev.map(r => {
      if (r.id === rentalId) {
        return {
          ...r,
          checkIn: details
        };
      }
      return r;
    }));

    // Update vehicle's mileage if departure mileage is newer
    const targetRental = rentals.find(r => r.id === rentalId);
    if (targetRental) {
      setVehicles(prev => prev.map(v => {
        if (v.id === targetRental.vehicleId) {
          return {
            ...v,
            currentMileage: Math.max(v.currentMileage, details.mileage)
          };
        }
        return v;
      }));
    }
  };

  /**
   * 3. Check-out (État des lieux retour):
   * Rule: Rental status passes to "Retournée" ('returned')
   * Vehicle status reverts to "Disponible" ('available')
   * Vehicle mileage is updated to return mileage
   * Driver (if assigned) reverts to "Disponible" (available = true)
   * Automatic invoice email is generated and logged
   */
  const handleConfirmCheckOut = (rentalId: string, details: CheckOutDetails) => {
    const targetRental = rentals.find(r => r.id === rentalId);
    if (!targetRental) return;

    const invoiceNumber = targetRental.invoiceNumber || `FAC-${targetRental.rentalNumber.replace('LOC-', '')}`;
    const invoiceDate = details.returnDate.split(' ')[0] || new Date().toISOString().split('T')[0];
    const targetVehicle = vehicles.find(v => v.id === targetRental.vehicleId) || vehicles[0];
    const targetClient = clients.find(c => c.id === targetRental.clientId) || clients[0];

    // Automatic invoice email simulation
    const invoiceEmail = createInvoiceEmail(
      { ...targetRental, status: 'returned', checkOut: details, invoiceNumber, invoiceDate },
      targetClient,
      targetVehicle,
      settings
    );

    // 1. Update Rental: status 'returned' + checkOut details + invoice email
    setRentals(prev => prev.map(r => {
      if (r.id === rentalId) {
        return {
          ...r,
          status: 'returned',
          checkOut: details,
          invoiceNumber,
          invoiceDate,
          emailLogs: [invoiceEmail, ...(r.emailLogs || [])]
        };
      }
      return r;
    }));

    // 2. Update Vehicle: status 'available' + update currentMileage
    setVehicles(prev => prev.map(v => {
      if (v.id === targetRental.vehicleId) {
        return {
          ...v,
          status: 'available',
          currentMileage: Math.max(v.currentMileage, details.mileage)
        };
      }
      return v;
    }));

    // 3. Update Driver: available = true
    if (targetRental.driverId) {
      setDrivers(prev => prev.map(d => {
        if (d.id === targetRental.driverId) {
          return {
            ...d,
            available: true
          };
        }
        return d;
      }));
    }

    // Trigger in-app notification
    addNotification(
      `Restitution & Facture #${invoiceNumber}`,
      `Véhicule ${targetVehicle.make} ${targetVehicle.model} retourné. Facture acquittée expédiée par email à ${targetClient?.email || targetClient?.firstName || 'client'}.`,
      'success',
      targetRental.id
    );
  };

  // Quick Open Document Modal
  const handleOpenContract = (rental: Rental) => {
    setDocumentModal({
      isOpen: true,
      documentType: 'contract',
      rental
    });
  };

  const handleOpenInvoice = (rental: Rental) => {
    setDocumentModal({
      isOpen: true,
      documentType: 'invoice',
      rental
    });
  };

  const handleOpenCheckInModal = (rental: Rental) => {
    setCheckInOutModal({
      isOpen: true,
      type: 'check-in',
      rental
    });
  };

  const handleOpenCheckOutModal = (rental: Rental) => {
    setCheckInOutModal({
      isOpen: true,
      type: 'check-out',
      rental
    });
  };

  // Open Emails Modal
  const handleOpenEmailsModal = (rental: Rental) => {
    setEmailsModal({
      isOpen: true,
      rental
    });
  };

  // Open Driver Portal (with optional pre-selected driver profile)
  const handleOpenDriverPortal = (driverId?: string) => {
    if (driverId) {
      setDriverPortalDriverId(driverId);
    }
    setCurrentTab('driver_portal');
  };

  const handleUpdateRentalEmailLogs = (rentalId: string, updatedLogs: SentEmailLog[]) => {
    setRentals(prev => prev.map(r => r.id === rentalId ? { ...r, emailLogs: updatedLogs } : r));
    setEmailsModal(prev => prev.rental && prev.rental.id === rentalId ? {
      ...prev,
      rental: { ...prev.rental, emailLogs: updatedLogs }
    } : prev);
  };

  // Find associated entities for modal previews
  const activeModalRental = checkInOutModal.rental || documentModal.rental;
  const activeModalVehicle = activeModalRental ? vehicles.find(v => v.id === activeModalRental.vehicleId) || vehicles[0] : vehicles[0];
  const activeModalClient = activeModalRental ? clients.find(c => c.id === activeModalRental.clientId) || clients[0] : clients[0];
  const activeModalDriver = activeModalRental?.driverId ? drivers.find(d => d.id === activeModalRental.driverId) || null : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-slate-800 selection:text-white antialiased">
      
      {/* Navigation Header with Mobile Drawer and Bottom Nav */}
      {currentTab !== 'portal' && currentTab !== 'driver_portal' && (
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          settings={settings}
          setSettings={setSettings}
          onOpenNewRental={() => setIsNewRentalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          overdueCount={overdueCount}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onTriggerTestNotification={handleTriggerTestNotification}
          onOpenRentalDetails={(rentalId) => {
            const r = rentals.find(item => item.id === rentalId);
            if (r) {
              handleOpenEmailsModal(r);
            }
          }}
        />
      )}

      {/* Main Content Area (with safe bottom padding for mobile navigation) */}
      <main className={`flex-1 max-w-7xl w-full mx-auto ${currentTab === 'portal' || currentTab === 'driver_portal' ? 'p-0' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-7 pb-24 md:pb-10'}`}>
        {currentTab === 'portal' && (
          <ClientPortalView
            settings={settings}
            vehicles={vehicles}
            rentals={rentals}
            clients={clients}
            drivers={drivers}
            isPublicView={isPublicClientPortal}
            onBackToAdmin={isPublicClientPortal ? undefined : () => setCurrentTab('dashboard')}
            onClientSubmitRental={handleClientSubmitRental}
          />
        )}

        {currentTab === 'driver_portal' && (
          <DriverPortalView
            settings={settings}
            drivers={drivers}
            setDrivers={setDrivers}
            rentals={rentals}
            setRentals={setRentals}
            vehicles={vehicles}
            clients={clients}
            initialDriverId={driverPortalDriverId}
            onBackToAdmin={isPublicDriverPortal ? undefined : () => setCurrentTab('dashboard')}
            onNotifyAgency={(title, message, type, rentalId) => {
              addNotification(title, message, type, rentalId);
            }}
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            vehicles={vehicles}
            rentals={rentals}
            clients={clients}
            drivers={drivers}
            settings={settings}
            onNavigateTab={setCurrentTab}
            onOpenNewRental={() => setIsNewRentalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenCheckIn={handleOpenCheckInModal}
            onOpenCheckOut={handleOpenCheckOutModal}
            onGenerateContract={handleOpenContract}
            onGenerateInvoice={handleOpenInvoice}
            onOpenEmailsModal={handleOpenEmailsModal}
            onOpenDriverPortal={handleOpenDriverPortal}
          />
        )}

        {currentTab === 'vehicles' && (
          <VehiclesManager
            vehicles={vehicles}
            setVehicles={setVehicles}
            settings={settings}
          />
        )}

        {currentTab === 'drivers' && (
          <DriversManager
            drivers={drivers}
            setDrivers={setDrivers}
            settings={settings}
            onOpenDriverPortal={handleOpenDriverPortal}
          />
        )}

        {currentTab === 'clients' && (
          <ClientsManager
            clients={clients}
            setClients={setClients}
            settings={settings}
          />
        )}

        {currentTab === 'rentals' && (
          <RentalsManager
            rentals={rentals}
            setRentals={setRentals}
            vehicles={vehicles}
            clients={clients}
            drivers={drivers}
            settings={settings}
            onOpenNewRental={() => setIsNewRentalOpen(true)}
            onOpenCheckIn={handleOpenCheckInModal}
            onOpenCheckOut={handleOpenCheckOutModal}
            onGenerateContract={handleOpenContract}
            onGenerateInvoice={handleOpenInvoice}
            onOpenEmailsModal={handleOpenEmailsModal}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsManager
            settings={settings}
            setSettings={setSettings}
            vehicles={vehicles}
            setVehicles={setVehicles}
            drivers={drivers}
            setDrivers={setDrivers}
            clients={clients}
            setClients={setClients}
            rentals={rentals}
            setRentals={setRentals}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white py-6 text-xs text-slate-500 mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-slate-800">{settings.agencyName}</span>
            <span>&bull;</span>
            <span>LocaFleet Manager (Licence Perpétuelle Auto-Hébergée)</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <span>Devise : {settings.currency} ({settings.currencySymbol})</span>
            <span>&bull;</span>
            <span className="text-emerald-600 font-medium">Auto-sauvegardé</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      
      {/* 1. New Rental Booking Modal */}
      {isNewRentalOpen && (
        <NewRentalModal
          isOpen={isNewRentalOpen}
          onClose={() => setIsNewRentalOpen(false)}
          vehicles={vehicles}
          drivers={drivers}
          clients={clients}
          rentals={rentals}
          settings={settings}
          onConfirmRental={handleConfirmNewRental}
        />
      )}

      {/* 2. Check-in / Check-out Modal */}
      {checkInOutModal.isOpen && checkInOutModal.rental && activeModalVehicle && activeModalClient && (
        <CheckInOutModal
          isOpen={checkInOutModal.isOpen}
          onClose={() => setCheckInOutModal({ isOpen: false, type: 'check-in', rental: null })}
          type={checkInOutModal.type}
          rental={checkInOutModal.rental}
          vehicle={activeModalVehicle}
          client={activeModalClient}
          driver={activeModalDriver}
          settings={settings}
          onConfirmCheckIn={handleConfirmCheckIn}
          onConfirmCheckOut={handleConfirmCheckOut}
        />
      )}

      {/* 3. Document Generation Modal (Contract & Invoice) */}
      {documentModal.isOpen && documentModal.rental && activeModalVehicle && activeModalClient && (
        <DocumentModal
          isOpen={documentModal.isOpen}
          onClose={() => setDocumentModal({ isOpen: false, documentType: 'contract', rental: null })}
          documentType={documentModal.documentType}
          rental={documentModal.rental}
          vehicle={activeModalVehicle}
          client={activeModalClient}
          driver={activeModalDriver}
          settings={settings}
        />
      )}

      {/* 4. Client Link Share & Software Customization Modal */}
      {isShareModalOpen && (
        <SharePortalModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          settings={settings}
          setSettings={setSettings}
          onNavigateToFullSettings={() => {
            setIsShareModalOpen(false);
            setCurrentTab('settings');
          }}
          onOpenPortalPreview={() => {
            setIsShareModalOpen(false);
            setCurrentTab('portal');
          }}
          onOpenDriverPortal={() => {
            setIsShareModalOpen(false);
            handleOpenDriverPortal();
          }}
        />
      )}

      {/* 5. Rental Emails History & Simulation Modal */}
      {emailsModal.isOpen && emailsModal.rental && (
        <RentalEmailsModal
          isOpen={emailsModal.isOpen}
          onClose={() => setEmailsModal({ isOpen: false, rental: null })}
          rental={emailsModal.rental}
          client={clients.find(c => c.id === emailsModal.rental?.clientId) || clients[0]}
          vehicle={vehicles.find(v => v.id === emailsModal.rental?.vehicleId) || vehicles[0]}
          settings={settings}
          onUpdateRentalEmailLogs={handleUpdateRentalEmailLogs}
          onTriggerNotification={(title, message, type) => addNotification(title, message, type, emailsModal.rental?.id)}
        />
      )}

    </div>
  );
}
