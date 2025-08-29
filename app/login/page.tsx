'use client';

import React, { useState } from 'react';

type UserRole = 'provider' | 'admin';

interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
}

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let apiEndpoint = '';
      let redirectPath = '';
      let tokenKey = '';

      // Determine API endpoint and redirect based on role
      switch (form.role) {
        case 'provider':
          apiEndpoint = '/api/providers/auth';
          redirectPath = '/providers';
          tokenKey = 'providerToken';
          break;
        case 'admin':
          apiEndpoint = '/api/admin/auth';
          redirectPath = '/admin';
          tokenKey = 'adminToken';
          break;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          form.role === 'admin' 
            ? { password: form.password }
            : { email: form.email, password: form.password }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token based on user type
      if (form.role === 'admin') {
        localStorage.setItem(tokenKey, form.password); // Admin uses password directly
      } else {
        localStorage.setItem(tokenKey, data.token);
      }

      // Redirect to appropriate dashboard
      window.location.href = redirectPath;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'provider': return '✂️';
      case 'admin': return '⚙️';
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="logo">Boondocks</h1>
          <h2>Staff Login</h2>
          <p className="login-subtitle">Select your account type</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-button ${form.role === 'provider' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'provider' })}
          >
            <span className="role-icon">{getRoleIcon('provider')}</span>
            <span className="role-name">Provider</span>
            <span className="role-desc">Barber dashboard</span>
          </button>
          
          <button
            type="button"
            className={`role-button ${form.role === 'admin' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'admin' })}
          >
            <span className="role-icon">{getRoleIcon('admin')}</span>
            <span className="role-name">Admin</span>
            <span className="role-desc">System management</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              {form.role === 'admin' ? 'Admin Password' : 'Email Address'}
            </label>
            <input
              type={form.role === 'admin' ? 'password' : 'email'}
              id="email"
              value={form.role === 'admin' ? form.password : form.email}
              onChange={(e) => form.role === 'admin' 
                ? setForm({ ...form, password: e.target.value })
                : setForm({ ...form, email: e.target.value })
              }
              placeholder={form.role === 'admin' ? 'Enter admin password' : 'your@email.com'}
              required
              autoComplete={form.role === 'admin' ? 'current-password' : 'email'}
            />
          </div>

          {form.role === 'provider' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="login-description">
            {form.role === 'admin' 
              ? 'Full system administration access' 
              : 'Manage your schedule and appointments'}
          </p>
        </form>

        <div className="login-footer">
          <p><a href="/">← Back to Booking</a></p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #8b7355 0%, #6d5a42 50%, #4a3d2a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 450px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          font-family: 'Oswald', sans-serif;
          font-size: 32px;
          font-weight: 600;
          color: #8b7355;
          margin: 0 0 8px 0;
          letter-spacing: 2px;
        }

        .login-header h2 {
          font-size: 24px;
          color: #2c2c2c;
          margin: 0 0 8px 0;
          font-weight: 600;
        }

        .login-subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .role-button {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .role-button:hover {
          border-color: #8b7355;
          background: #faf9f8;
        }

        .role-button.active {
          border-color: #8b7355;
          background: #8b7355;
          color: white;
        }

        .role-button.active .role-desc {
          color: rgba(255, 255, 255, 0.9);
        }

        .role-icon {
          display: block;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .role-name {
          display: block;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .role-desc {
          display: block;
          font-size: 11px;
          color: #6b7280;
        }

        .login-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #8b7355;
          box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
        }

        .login-button {
          width: 100%;
          background: #8b7355;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
          margin-bottom: 16px;
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-button:hover:not(:disabled) {
          background: #6d5a42;
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-description {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin: 0;
          font-style: italic;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .login-footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .login-footer p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .login-footer a {
          color: #8b7355;
          text-decoration: none;
          font-weight: 500;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 24px;
          }
          
          .logo {
            font-size: 28px;
          }
          
          .login-header h2 {
            font-size: 20px;
          }

          .role-selector {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;