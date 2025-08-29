// Passwordless booking cookie management
// Privacy-compliant cookie service for streamlined passwordless booking flow

interface GuestCookieData {
  allowed: boolean;
  email?: string; // Store email for return visitors
  firstSet: string; // ISO date string
  version: number; // For future migrations
}

const COOKIE_NAME = 'boondocks_guest_booking';
const COOKIE_VERSION = 1;
const COOKIE_EXPIRY_DAYS = 365; // 1 year

export class GuestCookieManager {
  private static instance: GuestCookieManager;
  private isClient: boolean;

  private constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  static getInstance(): GuestCookieManager {
    if (!GuestCookieManager.instance) {
      GuestCookieManager.instance = new GuestCookieManager();
    }
    return GuestCookieManager.instance;
  }

  /**
   * Check if guest booking is allowed (cookie exists and valid)
   */
  isGuestBookingAllowed(): boolean {
    if (!this.isClient) return false;

    try {
      const cookieData = this.getCookieData();
      return cookieData?.allowed === true;
    } catch (error) {
      console.error('Error reading guest booking cookie:', error);
      return false;
    }
  }

  /**
   * Set guest booking allowed cookie
   */
  setGuestBookingAllowed(email?: string): boolean {
    if (!this.isClient) return false;

    try {
      const cookieData: GuestCookieData = {
        allowed: true,
        email: email,
        firstSet: new Date().toISOString(),
        version: COOKIE_VERSION
      };

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(cookieData))}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
      
      return true;
    } catch (error) {
      console.error('Error setting guest booking cookie:', error);
      return false;
    }
  }

  /**
   * Clear guest booking cookie
   */
  clearGuestBookingCookie(): boolean {
    if (!this.isClient) return false;

    try {
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      return true;
    } catch (error) {
      console.error('Error clearing guest booking cookie:', error);
      return false;
    }
  }

  /**
   * Get stored email from guest cookie
   */
  getStoredEmail(): string | null {
    if (!this.isClient) return null;

    try {
      const cookieData = this.getCookieData();
      return cookieData?.email || null;
    } catch (error) {
      console.error('Error getting stored email:', error);
      return null;
    }
  }

  /**
   * Update stored email in existing cookie
   */
  updateStoredEmail(email: string): boolean {
    if (!this.isClient || !this.isGuestBookingAllowed()) return false;

    try {
      const existingData = this.getCookieData();
      if (!existingData) return false;

      const updatedData: GuestCookieData = {
        ...existingData,
        email: email
      };

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(updatedData))}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
      
      return true;
    } catch (error) {
      console.error('Error updating stored email:', error);
      return false;
    }
  }

  /**
   * Get when the guest cookie was first set
   */
  getGuestCookieAge(): number | null {
    if (!this.isClient) return null;

    try {
      const cookieData = this.getCookieData();
      if (!cookieData?.firstSet) return null;

      const firstSet = new Date(cookieData.firstSet);
      const now = new Date();
      return Math.floor((now.getTime() - firstSet.getTime()) / (1000 * 60 * 60 * 24)); // days
    } catch (error) {
      console.error('Error calculating cookie age:', error);
      return null;
    }
  }

  /**
   * Check if guest should be prompted to create account
   * Based on age and usage patterns
   */
  shouldPromptAccountCreation(): boolean {
    const age = this.getGuestCookieAge();
    if (!age) return false;

    // Prompt after 7 days of guest usage
    return age >= 7;
  }

  /**
   * Private method to get parsed cookie data
   */
  private getCookieData(): GuestCookieData | null {
    if (!this.isClient) return null;

    const cookies = document.cookie.split(';');
    const guestCookie = cookies
      .find(cookie => cookie.trim().startsWith(`${COOKIE_NAME}=`));

    if (!guestCookie) return null;

    try {
      const cookieValue = guestCookie.split('=')[1];
      const decodedValue = decodeURIComponent(cookieValue);
      return JSON.parse(decodedValue);
    } catch (error) {
      console.error('Error parsing guest cookie data:', error);
      return null;
    }
  }

  /**
   * Check if cookies are enabled in browser
   */
  areCookiesEnabled(): boolean {
    if (!this.isClient) return false;

    try {
      const testCookie = 'cookietest';
      document.cookie = `${testCookie}=1; path=/`;
      const enabled = document.cookie.indexOf(testCookie) !== -1;
      
      // Clean up test cookie
      if (enabled) {
        document.cookie = `${testCookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
      
      return enabled;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const guestCookieManager = GuestCookieManager.getInstance();

// Convenience functions for easier usage
export const isGuestBookingAllowed = () => guestCookieManager.isGuestBookingAllowed();
export const setGuestBookingAllowed = (email?: string) => guestCookieManager.setGuestBookingAllowed(email);
export const getStoredEmail = () => guestCookieManager.getStoredEmail();
export const updateStoredEmail = (email: string) => guestCookieManager.updateStoredEmail(email);
export const clearGuestBookingCookie = () => guestCookieManager.clearGuestBookingCookie();
export const shouldPromptAccountCreation = () => guestCookieManager.shouldPromptAccountCreation();
export const areCookiesEnabled = () => guestCookieManager.areCookiesEnabled();