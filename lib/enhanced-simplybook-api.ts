import { getSimplyBookAPI } from './simplybook-api';

interface BookingData {
  serviceId: number;
  providerId: number;
  clientId?: number;
  dateTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  additionalFields?: { [key: string]: any };
}

interface TimeSlot {
  time: string;
  available: boolean;
  duration?: number;
}

interface WorkingHours {
  [day: string]: {
    start: string;
    end: string;
    isWorking: boolean;
  };
}

export class EnhancedSimplyBookAPI {
  private api: any;

  constructor() {
    // Lazy initialization - don't get API during construction
    this.api = null;
  }

  private getAPI() {
    if (!this.api) {
      this.api = getSimplyBookAPI();
    }
    return this.api;
  }

  // Real-time availability methods
  async getRealAvailableSlots(
    serviceId: number, 
    providerId: number, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      const api = this.getAPI();
      await api.getToken();
      
      // Get available time intervals for the specific service and provider
      const intervals = await api.client.call('getServiceAvailableTimeIntervals', [
        serviceId,
        providerId,
        date,
        1 // count
      ]);

      return this.formatTimeIntervals(intervals);
    } catch (error) {
      console.error('Error getting real available slots:', error);
      return [];
    }
  }

  async getRealProviders(): Promise<any[]> {
    try {
      await this.getAPI().getToken();
      
      // Get real list of providers/barbers
      const units = await this.getAPI().client.call('getUnitList');
      
      return units.map((unit: any) => ({
        id: `provider_${unit.id}`,
        name: unit.name,
        description: unit.description || '',
        notes: unit.info || '',
        // We'll need to get working hours separately
        availability: {},
        restrictions: this.parseRestrictions(unit)
      }));
    } catch (error) {
      console.error('Error getting real providers:', error);
      return [];
    }
  }

  async getProviderWorkingHours(providerId: number): Promise<WorkingHours> {
    try {
      await this.getAPI().getToken();
      
      const workDays = await this.getAPI().client.call('getUnitWorkdayInfo', [providerId]);
      const workingHours: WorkingHours = {};
      
      // Convert SimplyBook format to our format
      Object.keys(workDays).forEach(day => {
        const dayInfo = workDays[day];
        workingHours[day] = {
          start: dayInfo.start_time || '09:00',
          end: dayInfo.end_time || '17:00',
          isWorking: dayInfo.is_working || false
        };
      });
      
      return workingHours;
    } catch (error) {
      console.error('Error getting provider working hours:', error);
      return {};
    }
  }

  async getRealServices(): Promise<any[]> {
    try {
      await this.getAPI().getToken();
      
      // Get actual services from SimplyBook
      const services = await this.getAPI().client.call('getServiceList');
      
      return services.map((service: any) => ({
        id: `service_${service.id}`,
        name: service.name,
        category: this.categorizeService(service.name),
        description: service.description || '',
        duration: service.duration,
        price: parseFloat(service.price) || 0
      }));
    } catch (error) {
      console.error('Error getting real services:', error);
      return [];
    }
  }

  // Booking management
  async createRealBooking(bookingData: BookingData): Promise<any> {
    try {
      await this.getAPI().getToken();
      
      // Add client if they don't exist
      let clientId = bookingData.clientId;
      
      if (!clientId) {
        clientId = await this.getAPI().client.call('addClient', [{
          name: bookingData.clientName,
          email: bookingData.clientEmail,
          phone: bookingData.clientPhone
        }]);
      }

      // Create the booking
      const booking = await this.getAPI().client.call('book', [
        bookingData.serviceId,
        bookingData.providerId,
        clientId,
        bookingData.dateTime,
        bookingData.additionalFields || {}
      ]);

      return {
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        status: 'confirmed',
        clientInfo: {
          name: bookingData.clientName,
          email: bookingData.clientEmail,
          phone: bookingData.clientPhone
        }
      };
    } catch (error) {
      console.error('Error creating real booking:', error);
      throw error;
    }
  }

  async cancelRealBooking(bookingId: number): Promise<boolean> {
    try {
      await this.getAPI().getToken();
      
      const result = await this.getAPI().client.call('cancelBooking', [bookingId]);
      return result.success || false;
    } catch (error) {
      console.error('Error canceling booking:', error);
      return false;
    }
  }

  // Business intelligence
  async getBookingStats(startDate: string, endDate: string): Promise<any> {
    try {
      await this.getAPI().getToken();
      
      const stats = await this.getAPI().client.call('getBookingStats', [
        startDate,
        endDate
      ]);
      
      return {
        totalBookings: stats.total_bookings,
        totalRevenue: stats.total_revenue,
        averageBookingValue: stats.average_booking_value,
        topServices: stats.top_services || [],
        busyDays: stats.busy_days || []
      };
    } catch (error) {
      console.error('Error getting booking stats:', error);
      return null;
    }
  }

  async getRecentBookings(limit: number = 10): Promise<any[]> {
    try {
      await this.getAPI().getToken();
      
      const bookings = await this.getAPI().client.call('getBookings', [{
        limit: limit,
        order: 'date_desc'
      }]);
      
      return bookings.map((booking: any) => ({
        id: booking.id,
        serviceName: booking.service_name,
        providerName: booking.unit_name,
        clientName: booking.client_name,
        dateTime: booking.start_date_time,
        status: booking.status,
        price: booking.price
      }));
    } catch (error) {
      console.error('Error getting recent bookings:', error);
      return [];
    }
  }

  // Company management
  async updateProviderWorkingHours(providerId: number, workingHours: WorkingHours): Promise<boolean> {
    try {
      await this.getAPI().getToken();
      
      // Convert our format to SimplyBook format
      const workDayInfo: any = {};
      
      Object.keys(workingHours).forEach(day => {
        const hours = workingHours[day];
        workDayInfo[day] = {
          is_working: hours.isWorking,
          start_time: hours.start,
          end_time: hours.end
        };
      });

      const result = await this.getAPI().client.call('setWorkDayInfo', [
        providerId,
        workDayInfo
      ]);
      
      return result.success || false;
    } catch (error) {
      console.error('Error updating provider working hours:', error);
      return false;
    }
  }

  async getCompanyDetails(): Promise<any> {
    try {
      await this.getAPI().getToken();
      
      const companyInfo = await this.getAPI().client.call('getCompanyInfo');
      
      return {
        name: companyInfo.name,
        description: companyInfo.description,
        phone: companyInfo.phone,
        address: companyInfo.address,
        timezone: companyInfo.timezone,
        currency: companyInfo.currency
      };
    } catch (error) {
      console.error('Error getting company details:', error);
      return null;
    }
  }

  // Helper methods
  private formatTimeIntervals(intervals: any[]): TimeSlot[] {
    if (!intervals || !Array.isArray(intervals)) return [];
    
    return intervals.map(interval => ({
      time: this.formatTime(interval.time),
      available: true,
      duration: interval.duration
    }));
  }

  private formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private parseRestrictions(unit: any): any {
    const restrictions: any = {};
    
    // Parse common restrictions from unit data
    if (unit.info) {
      const info = unit.info.toLowerCase();
      if (info.includes('cash only')) restrictions.cashOnly = true;
      if (info.includes('not accepting')) restrictions.notAcceptingNewClients = true;
      if (info.includes('no kids under')) {
        const match = info.match(/no kids under (\d+)/);
        if (match) restrictions.noKidsUnder = parseInt(match[1]);
      }
    }
    
    return restrictions;
  }

  private categorizeService(serviceName: string): string {
    const name = serviceName.toLowerCase();
    
    if (name.includes('kid') || name.includes('child')) return 'Kids';
    if (name.includes('beard') || name.includes('mustache') || name.includes('shave')) return 'Beards';
    return 'Haircuts';
  }
}

export const enhancedAPI = new EnhancedSimplyBookAPI();