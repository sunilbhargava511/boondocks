'use client';

import React, { useState, useEffect } from 'react';
import { 
  isGuestBookingAllowed, 
  clearGuestBookingCookie, 
  guestCookieManager,
  areCookiesEnabled 
} from '@/lib/guest-cookie';

interface CookieManagerProps {
  showInFooter?: boolean;
}

const CookieManager: React.FC<CookieManagerProps> = ({ showInFooter = false }) => {
  const [hasGuestCookie, setHasGuestCookie] = useState(false);
  const [cookieAge, setCookieAge] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cookiesEnabled, setCookiesEnabled] = useState(true);

  useEffect(() => {
    // Check cookie status on mount
    const checkStatus = () => {
      setHasGuestCookie(isGuestBookingAllowed());
      setCookieAge(guestCookieManager.getGuestCookieAge());
      setCookiesEnabled(areCookiesEnabled());
    };

    checkStatus();
    
    // Refresh status when window focuses (in case cookies were cleared elsewhere)
    window.addEventListener('focus', checkStatus);
    return () => window.removeEventListener('focus', checkStatus);
  }, []);

  const handleClearCookie = () => {
    if (clearGuestBookingCookie()) {
      setHasGuestCookie(false);
      setCookieAge(null);
      alert('✅ Guest booking preferences cleared. You\'ll see the email prompt on your next visit.');
    } else {
      alert('❌ Failed to clear cookie. Please try again or clear your browser cookies manually.');
    }
  };

  if (showInFooter) {
    return (
      <div className="cookie-footer-manager">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="cookie-toggle-button"
          title="Manage booking preferences"
        >
          🍪 Cookie Settings
        </button>

        {showDetails && (
          <div className="cookie-details-popup">
            <div className="cookie-details-content">
              <h3>Booking Preferences</h3>
              
              {!cookiesEnabled && (
                <div className="cookie-warning">
                  ⚠️ Cookies are disabled in your browser. Guest booking features may not work properly.
                </div>
              )}

              {hasGuestCookie ? (
                <div className="cookie-status active">
                  <p>✅ <strong>Guest Booking Enabled</strong></p>
                  <p className="cookie-info">
                    You can book appointments directly without entering your email each time.
                    {cookieAge !== null && (
                      <span className="cookie-age">
                        {cookieAge === 0 ? ' (set today)' : ` (${cookieAge} days ago)`}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleClearCookie}
                    className="clear-cookie-button"
                  >
                    Clear Preferences
                  </button>
                </div>
              ) : (
                <div className="cookie-status inactive">
                  <p>❌ <strong>Guest Booking Disabled</strong></p>
                  <p className="cookie-info">
                    You'll be prompted for your email before booking appointments.
                  </p>
                </div>
              )}

              <div className="privacy-notice">
                <p><strong>Privacy Notice:</strong> We only store a simple preference flag - no personal data is saved in cookies.</p>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="close-details-button"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .cookie-footer-manager {
            position: relative;
          }

          .cookie-toggle-button {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.8);
            padding: 6px 12px;
            font-size: 11px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .cookie-toggle-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-color: rgba(255, 255, 255, 0.5);
          }

          .cookie-details-popup {
            position: absolute;
            bottom: 100%;
            right: 0;
            margin-bottom: 8px;
            background: white;
            border: 2px solid #8b7355;
            border-radius: 8px;
            padding: 20px;
            width: 300px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 1000;
          }

          .cookie-details-content h3 {
            font-family: 'Oswald', sans-serif;
            color: #2c2c2c;
            margin: 0 0 16px 0;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .cookie-warning {
            background: #fef3cd;
            border: 1px solid #facc15;
            color: #92400e;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 12px;
          }

          .cookie-status {
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 6px;
          }

          .cookie-status.active {
            background: #f0fdf4;
            border: 1px solid #22c55e;
          }

          .cookie-status.inactive {
            background: #fef2f2;
            border: 1px solid #ef4444;
          }

          .cookie-status p {
            margin: 0 0 8px 0;
            font-size: 13px;
          }

          .cookie-info {
            color: #666;
            font-size: 11px !important;
            line-height: 1.4;
          }

          .cookie-age {
            font-style: italic;
            opacity: 0.8;
          }

          .clear-cookie-button {
            background: #ef4444;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            margin-top: 8px;
          }

          .clear-cookie-button:hover {
            background: #dc2626;
          }

          .privacy-notice {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px;
            border-radius: 4px;
            margin: 12px 0;
          }

          .privacy-notice p {
            margin: 0;
            font-size: 10px;
            color: #64748b;
            line-height: 1.3;
          }

          .close-details-button {
            background: #6b7280;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            width: 100%;
          }

          .close-details-button:hover {
            background: #4b5563;
          }

          @media (max-width: 480px) {
            .cookie-details-popup {
              right: -50px;
              width: 250px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Standalone cookie manager (for settings pages)
  return (
    <div className="cookie-manager">
      <div className="cookie-manager-content">
        <h2>Booking Preferences</h2>
        
        {!cookiesEnabled && (
          <div className="warning-banner">
            <strong>⚠️ Cookies Disabled</strong>
            <p>Cookies are disabled in your browser. Guest booking features will not work properly.</p>
          </div>
        )}

        <div className="preference-section">
          <h3>Guest Booking</h3>
          <div className={`preference-status ${hasGuestCookie ? 'enabled' : 'disabled'}`}>
            <div className="status-indicator">
              {hasGuestCookie ? '✅' : '❌'}
            </div>
            <div className="status-content">
              <div className="status-title">
                {hasGuestCookie ? 'Enabled' : 'Disabled'}
              </div>
              <div className="status-description">
                {hasGuestCookie 
                  ? 'You can book appointments without entering your email each time.'
                  : 'You\'ll be prompted for your email before booking appointments.'
                }
                {cookieAge !== null && hasGuestCookie && (
                  <div className="status-age">
                    Set {cookieAge === 0 ? 'today' : `${cookieAge} days ago`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasGuestCookie && (
            <button
              onClick={handleClearCookie}
              className="clear-preferences-button"
            >
              Clear Guest Booking Preferences
            </button>
          )}
        </div>

        <div className="privacy-section">
          <h3>Privacy Information</h3>
          <ul>
            <li>We only store a simple preference flag - no personal information</li>
            <li>The cookie expires automatically after 1 year</li>
            <li>You can clear it anytime using the button above</li>
            <li>Clearing will require re-entering your email on the next visit</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .cookie-manager {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .cookie-manager-content {
          background: white;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          padding: 24px;
        }

        .cookie-manager h2 {
          font-family: 'Oswald', sans-serif;
          color: #2c2c2c;
          margin: 0 0 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .warning-banner {
          background: #fef3cd;
          border: 2px solid #facc15;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .warning-banner strong {
          display: block;
          color: #92400e;
          margin-bottom: 8px;
        }

        .warning-banner p {
          color: #92400e;
          margin: 0;
          font-size: 14px;
        }

        .preference-section {
          margin-bottom: 24px;
        }

        .preference-section h3 {
          font-family: 'Oswald', sans-serif;
          color: #555;
          margin: 0 0 12px 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preference-status {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .preference-status.enabled {
          background: #f0fdf4;
          border: 2px solid #22c55e;
        }

        .preference-status.disabled {
          background: #fef2f2;
          border: 2px solid #ef4444;
        }

        .status-indicator {
          font-size: 20px;
          line-height: 1;
        }

        .status-content {
          flex: 1;
        }

        .status-title {
          font-weight: 600;
          color: #2c2c2c;
          margin-bottom: 4px;
        }

        .status-description {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }

        .status-age {
          color: #999;
          font-size: 12px;
          font-style: italic;
          margin-top: 4px;
        }

        .clear-preferences-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .clear-preferences-button:hover {
          background: #dc2626;
        }

        .privacy-section h3 {
          font-family: 'Oswald', sans-serif;
          color: #555;
          margin: 0 0 12px 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .privacy-section ul {
          margin: 0;
          padding-left: 20px;
          color: #666;
        }

        .privacy-section li {
          margin-bottom: 6px;
          font-size: 14px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default CookieManager;