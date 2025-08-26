import axios from 'axios';
import { 
  SimplyBookService, 
  SimplyBookProvider, 
  SimplyBookTimeSlot, 
  SimplyBookBookingRequest, 
  SimplyBookBookingResponse 
} from './types';

// JSON-RPC 2.0 client implementation
class JSONRpcClient {
  private url: string;
  private headers: Record<string, string>;
  private requestId: number = 1;

  constructor(config: { url: string; headers?: Record<string, string> }) {
    this.url = config.url;
    this.headers = config.headers || {};
  }

  async call(method: string, params: any[] = []): Promise<any> {
    try {
      const response = await axios.post(this.url, {
        jsonrpc: '2.0',
        method,
        params,
        id: this.requestId++
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        }
      });

      if (response.data.error) {
        throw new Error(`SimplyBook API Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      console.error('SimplyBook API call failed:', error);
      throw error;
    }
  }
}

export class SimplyBookAPI {
  private companyLogin: string;
  private apiKey: string;
  private token: string | null = null;
  private client: JSONRpcClient | null = null;

  constructor(companyLogin: string, apiKey: string) {
    this.companyLogin = companyLogin;
    this.apiKey = apiKey;
  }

  // Step 1: Get authentication token
  async getToken(): Promise<string> {
    if (this.token) return this.token;

    const loginClient = new JSONRpcClient({
      url: 'https://user-api.simplybook.me/login'
    });

    try {
      this.token = await loginClient.call('getToken', [this.companyLogin, this.apiKey]);
      
      // Initialize the main API client with the token
      this.client = new JSONRpcClient({
        url: 'https://user-api.simplybook.me',
        headers: {
          'X-Company-Login': this.companyLogin,
          'X-Token': this.token || ''
        }
      });

      return this.token;
    } catch (error) {
      console.error('Failed to get SimplyBook token:', error);
      throw error;
    }
  }

  // Ensure client is initialized
  private async ensureClient(): Promise<JSONRpcClient> {
    if (!this.client) {
      await this.getToken();
    }
    return this.client!;
  }

  // Get list of services
  async getServices(): Promise<SimplyBookService[]> {
    const client = await this.ensureClient();
    return await client.call('getEventList');
  }

  // Get list of providers/units
  async getProviders(): Promise<SimplyBookProvider[]> {
    const client = await this.ensureClient();
    return await client.call('getUnitList');
  }

  // Get available time slots for a service and provider
  async getAvailableTimeSlots(
    serviceId: number,
    providerId: number,
    dateFrom: string,
    dateTo: string,
    count: number = 1
  ): Promise<SimplyBookTimeSlot> {
    const client = await this.ensureClient();
    return await client.call('getStartTimeMatrix', [
      dateFrom,
      dateTo,
      serviceId,
      providerId,
      count
    ]);
  }

  // Get working calendar for a month
  async getWorkingCalendar(
    year: number,
    month: number,
    providerId?: number
  ): Promise<Record<string, { from: string; to: string; is_day_off: number }>> {
    const client = await this.ensureClient();
    return await client.call('getWorkCalendar', [year, month, providerId || null]);
  }

  // Get first working day
  async getFirstWorkingDay(providerId?: number): Promise<string> {
    const client = await this.ensureClient();
    return await client.call('getFirstWorkingDay', [providerId || null]);
  }

  // Calculate end time for a booking
  async calculateEndTime(
    startDateTime: string,
    serviceId: number,
    providerId: number
  ): Promise<string> {
    const client = await this.ensureClient();
    return await client.call('calculateEndTime', [startDateTime, serviceId, providerId]);
  }

  // Get additional fields for a service
  async getAdditionalFields(serviceId: number): Promise<any[]> {
    const client = await this.ensureClient();
    return await client.call('getAdditionalFields', [serviceId]);
  }

  // Create a booking
  async createBooking(request: SimplyBookBookingRequest): Promise<SimplyBookBookingResponse> {
    const client = await this.ensureClient();
    
    return await client.call('book', [
      request.eventId,
      request.unitId,
      request.date,
      request.time,
      request.clientData,
      request.additional || {},
      request.count || 1
    ]);
  }

  // Validate a promo code
  async validatePromoCode(
    code: string,
    startDateTime: string,
    serviceId: number,
    count: number = 1,
    clientData: any = {}
  ): Promise<boolean> {
    const client = await this.ensureClient();
    try {
      await client.call('validatePromoCode', [
        code,
        startDateTime,
        serviceId,
        count,
        clientData
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get company information
  async getCompanyInfo(): Promise<any> {
    const client = await this.ensureClient();
    return await client.call('getCompanyInfo');
  }

  // Get available providers for a specific date and service
  async getAvailableProviders(
    serviceId: number,
    dateTime: string,
    count: number = 1
  ): Promise<number[]> {
    const client = await this.ensureClient();
    return await client.call('getAvailableUnits', [serviceId, dateTime, count]);
  }

  // Check if a plugin is activated
  async isPluginActivated(pluginName: string): Promise<boolean> {
    const client = await this.ensureClient();
    return await client.call('isPluginActivated', [pluginName]);
  }

  // Get company timezone offset
  async getTimezoneOffset(): Promise<{ offset: number; timezone: string }> {
    const client = await this.ensureClient();
    return await client.call('getCompanyTimezoneOffset');
  }
}

// Create a singleton instance
let apiInstance: SimplyBookAPI | null = null;

export function getSimplyBookAPI(): SimplyBookAPI {
  if (!apiInstance) {
    const companyLogin = process.env.NEXT_PUBLIC_SIMPLYBOOK_COMPANY_LOGIN;
    const apiKey = process.env.SIMPLYBOOK_API_KEY;

    if (!companyLogin || !apiKey) {
      throw new Error('SimplyBook.me API credentials not configured');
    }

    apiInstance = new SimplyBookAPI(companyLogin, apiKey);
  }

  return apiInstance;
}

// Helper function to format date for API calls
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Helper function to format datetime for API calls
export function formatDateTimeForAPI(date: Date, time: string): string {
  const dateStr = formatDateForAPI(date);
  return `${dateStr} ${time}:00`;
}