'use client';

import React, { useState } from 'react';

interface ProviderLoginProps {
  onLogin: (provider: any, token: string) => void;
}

export default function ProviderLogin({ onLogin }: ProviderLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/providers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.provider, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="logo">Boondocks</h1>
          <h2 className="subtitle">Provider Portal</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barber@boondocks.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Forgot your password? Contact admin</p>
          <a href="/" className="back-link">← Back to Booking</a>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          padding: 20px;
        }

        .login-box {
          background: white;
          border: 3px solid #8b7355;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          font-family: 'Oswald', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #c41e3a;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
        }

        .subtitle {
          font-family: 'Oswald', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #8b7355;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 8px 0 0 0;
        }

        .login-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #8b7355;
          background: white;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #c41e3a;
          box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .error-message {
          background: #fee;
          border: 1px solid #c41e3a;
          color: #c41e3a;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 14px;
          text-align: center;
        }

        .login-button {
          width: 100%;
          padding: 14px;
          background: #c41e3a;
          color: white;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          background: #a01729;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(196, 30, 58, 0.3);
        }

        .login-button:disabled {
          background: #999;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          text-align: center;
        }

        .login-footer p {
          color: #666;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .back-link {
          color: #8b7355;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .back-link:hover {
          color: #c41e3a;
        }
      `}</style>
    </div>
  );
}