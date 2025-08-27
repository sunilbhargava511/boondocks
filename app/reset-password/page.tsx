'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const ResetPasswordContent: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: passwords.newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="reset-page">
        <div className="reset-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Invalid Reset Link</h2>
            <p>This password reset link is invalid or has expired.</p>
            <div className="actions">
              <a href="/forgot-password" className="primary-button">Request New Reset</a>
              <a href="/login" className="secondary-button">Back to Login</a>
            </div>
          </div>
        </div>

        <style jsx>{`
          .error-state {
            text-align: center;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }

          .error-state h2 {
            font-family: 'Oswald', sans-serif;
            font-size: 24px;
            color: #c41e3a;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .actions {
            margin-top: 30px;
          }

          .primary-button, .secondary-button {
            display: inline-block;
            margin: 0 10px;
            padding: 12px 24px;
            text-decoration: none;
            font-family: 'Oswald', sans-serif;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
          }

          .primary-button {
            background: #c41e3a;
            color: white;
          }

          .primary-button:hover {
            background: #a01729;
          }

          .secondary-button {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
          }

          .secondary-button:hover {
            background: #ebebeb;
          }
        `}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-page">
        <div className="reset-container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Password Updated</h2>
            <p>Your password has been successfully reset.</p>
            <div className="actions">
              <a href="/login" className="login-button">Sign In Now</a>
            </div>
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
            color: #22c55e;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="reset-page">
      <div className="reset-container">
        <div className="reset-header">
          <h1 className="logo">Boondocks</h1>
          <h2>Create New Password</h2>
          <p className="reset-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="Enter new password"
              required
              minLength={6}
            />
            <p className="field-help">Must be at least 6 characters long</p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              required
            />
            <p className="field-help">Re-enter your new password</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="reset-button"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <div className="reset-footer">
          <a href="/login" className="back-link">← Back to Login</a>
        </div>
      </div>

      <style jsx>{`
        .reset-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .reset-container {
          background: white;
          border: 3px solid #8b7355;
          max-width: 400px;
          width: 100%;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .reset-header {
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

        .reset-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          color: #2c2c2c;
          margin: 0 0 8px 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .reset-subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .reset-form {
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

        .reset-footer {
          text-align: center;
        }

        .back-link {
          color: #666;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: #c41e3a;
        }

        @media (max-width: 600px) {
          .reset-container {
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

const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          border: '3px solid #8b7355',
          maxWidth: '400px',
          width: '100%',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;