// Customer related types
export interface Customer {
  id: string;
  simplybookId?: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  conversationPreference: number; // 0-3 scale
  preferredProviderId?: string;
  notes?: string;
  loyaltyPoints: number;
  totalSpent: number;
  noShowCount: number;
  cancellationCount: number;
  accountStatus: 'active' | 'suspended' | 'blocked';
  customerSince: Date;
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: Date;
  marketingConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  syncStatus: 'synced' | 'pending_simplybook_creation' | 'pending_sync' | 'error';
}

export interface CustomerPreference {
  customerId: string;
  preferredDays?: string[];
  preferredTimes?: string[];
  preferredServices?: string[];
  allergiesNotes?: string;
  specialInstructions?: string;
  createdAt: Date;
}

export interface CustomerTag {
  id: string;
  customerId: string;
  tagName: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  customerId: string;
  simplybookId?: number;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  appointmentDate: Date;
  duration: number;
  price: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'in_progress';
  bookingCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors?: string[];
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
}

// CSV Import/Export types
export interface CSVCustomerRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  conversationPreference?: string;
  preferredProvider?: string;
  notes?: string;
  marketingConsent?: string;
  smsConsent?: string;
  emailConsent?: string;
  loyaltyPoints?: string;
  totalSpent?: string;
  preferredDays?: string;
  preferredTimes?: string;
  preferredServices?: string;
  allergiesNotes?: string;
  specialInstructions?: string;
  tags?: string;
}

export interface CustomerExportOptions {
  format: 'csv' | 'json';
  includePreferences: boolean;
  includeTags: boolean;
  includeAppointments: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    accountStatus?: ('active' | 'suspended' | 'blocked')[];
    minLoyaltyPoints?: number;
    noShowThreshold?: number;
    tags?: string[];
  };
}

export interface CustomerImportMapping {
  [csvColumn: string]: keyof CSVCustomerRow;
}

// Service related types
export interface Service {
  id: string;
  category: 'Haircuts' | 'Beards' | 'Combination';
  name: string;
  duration: number; // in minutes
  description: string;
  price: number;
}

// Provider related types
export interface Provider {
  id: string;
  name: string;
  description: string;
  notes: string;
  availability: ProviderAvailability;
  restrictions?: {
    notAcceptingNewClients?: boolean;
    noKidsUnder?: number;
    cashOnly?: boolean;
    conversationPreference?: boolean;
  };
}

export interface ProviderAvailability {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
}

// Service-Provider Matrix
export interface ServiceProviderPrice {
  serviceId: string;
  providerId: string;
  price: number;
  available: boolean;
}

// Booking related types
export interface BookingData {
  service?: Service;
  provider?: Provider;
  date?: string;
  time?: string;
  clientInfo?: ClientInfo;
  additionalFields?: Record<string, any>;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  conversationLevel?: number; // For Jan specifically
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingResult {
  bookingId: string;
  bookingCode: string;
  status: 'confirmed' | 'pending';
  service: Service;
  provider: Provider;
  dateTime: string;
  clientInfo: ClientInfo;
}

// SimplyBook.me API types
export interface SimplyBookService {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  picture: string | null;
  picture_path: string | null;
  position: number;
  is_active: number;
  is_public: number;
}

export interface SimplyBookProvider {
  id: number;
  name: string;
  email: string;
  description: string;
  phone: string;
  picture: string | null;
  picture_path: string | null;
  position: number;
  is_active: number;
  is_visible: number;
  qty: number;
}

export interface SimplyBookTimeSlot {
  [date: string]: string[]; // date -> array of time strings
}

export interface SimplyBookBookingRequest {
  eventId: number;
  unitId: number;
  date: string;
  time: string;
  clientData: {
    name: string;
    email: string;
    phone: string;
  };
  additional?: Record<string, any>;
  count?: number;
}

export interface SimplyBookBookingResponse {
  bookings: Array<{
    id: string;
    code: string;
    hash: string;
  }>;
  require_confirm?: boolean;
}