'use client';

import React, { useState } from 'react';
import { setGuestBookingAllowed } from '@/lib/guest-cookie';

interface EmailGateProps {
  onGuestProceed: () => void;
  onExistingUserProceed: (email: string) => void;
}

const EmailGate: React.FC<EmailGateProps> = ({ onGuestProceed, onExistingUserProceed }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check email');
      }

      if (data.exists) {
        // Existing customer - proceed to magic link
        onExistingUserProceed(data.email);
      } else {
        // New user - show confirmation
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Email check error:', error);
      setError('Unable to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserConfirm = () => {
    // Set guest cookie and proceed
    setGuestBookingAllowed();
    onGuestProceed();
  };

  const handleNewUserBack = () => {
    setShowConfirmation(false);
    setEmail('');
    setError(null);
  };

  if (showConfirmation) {
    return (
      <div className="email-gate-container">
        <div className="email-gate-content">
          <div className="confirmation-header">
            <div className="welcome-icon">👋</div>
            <h2 className="confirmation-title">Welcome to Boondocks!</h2>
            <p className="confirmation-subtitle">
              It looks like you're new here. Let's get you booked quickly as a guest!
            </p>
          </div>

          <div className="confirmation-email">
            <span className="email-display">{email}</span>
          </div>

          <div className="guest-booking-info">
            <div className="guest-benefits">
              <h3>✨ Quick Guest Booking</h3>
              <p>Book your appointment instantly without creating an account:</p>
              <ul>
                <li>✓ Book appointments instantly</li>
                <li>✓ Receive confirmation emails</li>
                <li>✓ No passwords or accounts needed</li>
                <li>✓ Return visits are even faster</li>
              </ul>
            </div>
            
            <button
              onClick={handleNewUserConfirm}
              className="continue-guest-button"
            >
              Continue to Booking
            </button>
          </div>

          <div className="back-option">
            <button
              onClick={handleNewUserBack}
              className="back-button"
            >
              ← Different Email Address
            </button>
          </div>
        </div>

        <style jsx>{`
          .email-gate-container {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .email-gate-content {
            background: white;
            border: 3px solid #8b7355;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }

          .confirmation-header {
            margin-bottom: 30px;
          }

          .welcome-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .confirmation-title {
            font-family: 'Oswald', sans-serif;
            font-size: 32px;
            color: #2c2c2c;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0 0 12px 0;
          }

          .confirmation-subtitle {
            color: #666;
            font-size: 16px;
            margin: 0;
            line-height: 1.5;
          }

          .confirmation-email {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 12px;
            margin: 20px 0 30px 0;
          }

          .email-display {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #0369a1;
            font-weight: bold;
          }

          .guest-booking-info {
            text-align: center;
            margin-bottom: 30px;
          }

          .guest-benefits {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 20px;
          }

          .guest-benefits h3 {
            font-family: 'Oswald', sans-serif;
            font-size: 20px;
            color: #0369a1;
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .guest-benefits p {
            color: #0369a1;
            font-size: 14px;
            margin: 0 0 16px 0;
            line-height: 1.4;
          }

          .guest-benefits ul {
            list-style: none;
            padding: 0;
            margin: 0;
            text-align: left;
          }

          .guest-benefits li {
            font-size: 13px;
            color: #0369a1;
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
            line-height: 1.3;
          }

          .continue-guest-button {
            width: 100%;
            padding: 16px 24px;
            background: #c41e3a;
            color: white;
            border: none;
            border-radius: 6px;
            font-family: 'Oswald', sans-serif;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .continue-guest-button:hover {
            background: #a01729;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
          }

          .back-option {
            margin-top: 20px;
          }

          .back-button {
            background: none;
            border: none;
            color: #666;
            font-size: 14px;
            cursor: pointer;
            padding: 8px;
          }

          .back-button:hover {
            color: #c41e3a;
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="email-gate-container">
      <div className="email-gate-content">
        <div className="gate-header">
          <h1 className="gate-title">Welcome to Boondocks</h1>
          <h2 className="gate-subtitle">Traditional Barbershop • San Carlos</h2>
          <p className="gate-description">
            Enter your email to get started with booking your appointment
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="email-form">
          <div className="email-input-group">
            <label htmlFor="email" className="email-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="your@email.com"
              className="email-input"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="continue-button"
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>

        <div className="help-links">
          <p className="help-text">
            Already have a booking?{' '}
            <a href="/manage-booking" className="help-link">
              Manage with booking code →
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .email-gate-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .email-gate-content {
          background: #f5f5f0;
          border: 3px solid #8b7355;
          max-width: 500px;
          width: 100%;
          padding: 40px;
          text-align: center;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .email-gate-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: repeating-linear-gradient(
            45deg,
            #c41e3a,
            #c41e3a 10px,
            #f5f5f0 10px,
            #f5f5f0 20px,
            #1e4d8b 20px,
            #1e4d8b 30px,
            #f5f5f0 30px,
            #f5f5f0 40px
          );
        }

        .gate-header {
          margin-bottom: 30px;
        }

        .gate-title {
          font-family: 'Bebas Neue', cursive;
          font-size: 48px;
          font-weight: 400;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: #8b7355;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .gate-subtitle {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #666;
          margin: 0 0 20px 0;
          opacity: 0.8;
        }

        .gate-description {
          color: #555;
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        .error-message {
          background: #fef2f2;
          border: 2px solid #f87171;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .email-form {
          margin-bottom: 20px;
        }

        .email-input-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .email-label {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .email-input {
          width: 100%;
          padding: 14px;
          border: 2px solid #8b7355;
          border-radius: 0;
          font-size: 16px;
          transition: border-color 0.3s ease;
          background: white;
          box-sizing: border-box;
        }

        .email-input:focus {
          outline: none;
          border-color: #c41e3a;
        }

        .email-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .continue-button {
          width: 100%;
          padding: 14px;
          background: #c41e3a;
          color: white;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .continue-button:hover:not(:disabled) {
          background: #a01729;
        }

        .continue-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .help-links {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }

        .help-text {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .help-link {
          color: #c41e3a;
          text-decoration: none;
          font-weight: 600;
        }

        .help-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .email-gate-content {
            padding: 30px 20px;
          }

          .gate-title {
            font-size: 36px;
            letter-spacing: 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default EmailGate;