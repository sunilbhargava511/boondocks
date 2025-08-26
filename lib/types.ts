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