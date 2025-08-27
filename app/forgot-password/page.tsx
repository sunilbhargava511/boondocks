'use client';

import React, { useState } from 'react';

type UserRole = 'customer' | 'provider';

const ForgotPasswordPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-page">
        <div className="forgot-container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Check Your Email</h2>
            <p>We've sent password reset instructions to:</p>
            <p className="email-display">{email}</p>
            <div className="instructions">
              <p>Please check your email and follow the instructions to reset your password.</p>
              <p>The link will expire in 1 hour for security reasons.</p>
            </div>
            <div className="actions">
              <a href="/login" className="login-button">Back to Login</a>
            </div>
            <p className="help-text">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </div>

        <style jsx>{`
          .success-message {
            text-align: center;
          }

          .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }

          .success-message h2 {
            font-family: 'Oswald', sans-serif;
            font-size: 24px;
            color: #2c2c2c;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .email-display {
            font-weight: bold;
            color: #c41e3a;
            margin: 10px 0;
            font-size: 16px;
          }

          .instructions {
            background: #f8f8f8;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }

          .instructions p {
            margin: 8px 0;
            color: #666;
            font-size: 14px;
          }

          .login-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background: #c41e3a;
            color: white;
            text-decoration: none;
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: background 0.3s ease;
          }

          .login-button:hover {
            background: #a01729;
          }

          .help-text {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <div className="forgot-header">
          <h1 className="logo">Boondocks</h1>
          <h2>Reset Password</h2>
          <p className="forgot-subtitle">Enter your email to receive reset instructions</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-button ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            <span className="role-name">Customer Account</span>
          </button>
          
          <button
            type="button"
            className={`role-button ${role === 'provider' ? 'active' : ''}`}
            onClick={() => setRole('provider')}
          >
            <span className="role-name">Provider Account</span>
          </button>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleResetRequest} className="forgot-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="field-help">
              Enter the email associated with your {role} account
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="reset-button"
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        {/* Admin Note */}
        {role === 'provider' && (
          <div className="admin-note">
            <p><strong>Provider Note:</strong> If you're unable to reset your password, please contact your shop administrator for assistance.</p>
          </div>
        )}

        <div className="forgot-footer">
          <p>Remember your password? <a href="/login">Sign in</a></p>
          <a href="/" className="back-link">← Back to Booking</a>
        </div>
      </div>

      <style jsx>{`
        .forgot-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .forgot-container {
          background: white;
          border: 3px solid #8b7355;
          max-width: 450px;
          width: 100%;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .forgot-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          font-family: 'Oswald', sans-serif;
          font-size: 48px;
          font-weight: 700;
          color: #c41e3a;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin: 0 0 8px 0;
        }

        .forgot-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          color: #2c2c2c;
          margin: 0 0 8px 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .forgot-subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 30px;
        }

        .role-button {
          background: #f5f5f5;
          border: 2px solid #ddd;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .role-button:hover {
          background: #ebebeb;
        }

        .role-button.active {
          background: #2c2c2c;
          border-color: #c41e3a;
          color: white;
        }

        .role-name {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .forgot-form {
          margin-bottom: 20px;
        }

        .error-message {
          background: #fee;
          color: #c00;
          padding: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #333;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #c41e3a;
        }

        .field-help {
          margin-top: 5px;
          font-size: 12px;
          color: #999;
        }

        .reset-button {
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

        .reset-button:hover:not(:disabled) {
          background: #a01729;
        }

        .reset-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-note {
          background: #fff9e6;
          border: 1px solid #ffd700;
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 4px;
        }

        .admin-note p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .forgot-footer {
          text-align: center;
        }

        .forgot-footer p {
          margin: 10px 0;
          font-size: 13px;
          color: #666;
        }

        .forgot-footer a {
          color: #c41e3a;
          text-decoration: underline;
          font-weight: 600;
        }

        .back-link {
          display: inline-block;
          margin-top: 10px;
          color: #666;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: #c41e3a;
        }

        @media (max-width: 600px) {
          .forgot-container {
            padding: 30px 20px;
          }

          .logo {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;