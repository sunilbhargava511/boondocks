'use client';

import React, { useState } from 'react';

type UserRole = 'customer' | 'provider' | 'admin';

interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
}

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For customers, redirect to magic link system
      if (form.role === 'customer') {
        window.location.href = '/customers';
        return;
      }

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
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          action: 'login'
        }),
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
      case 'customer':
        return '🛍️';
      case 'provider':
        return '✂️';
      case 'admin':
        return '⚙️';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return 'Magic link login - no password needed';
      case 'provider':
        return 'Manage your schedule and customers';
      case 'admin':
        return 'Full system administration access';
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="logo">Boondocks</h1>
          <h2>Sign In</h2>
          <p className="login-subtitle">Select your account type to continue</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-button ${form.role === 'customer' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'customer' })}
          >
            <span className="role-icon">{getRoleIcon('customer')}</span>
            <span className="role-name">Customer</span>
            <span className="role-desc">Book & manage appointments</span>
          </button>
          
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
              {form.role === 'admin' ? 'Admin Password' : (form.role === 'customer' ? 'Customer Login' : 'Email Address')}
            </label>
            <input
              type={form.role === 'admin' ? 'password' : 'email'}
              id="email"
              value={form.role === 'admin' ? form.password : form.email}
              onChange={(e) => form.role === 'admin' 
                ? setForm({ ...form, password: e.target.value })
                : setForm({ ...form, email: e.target.value })
              }
              placeholder={form.role === 'admin' ? 'Enter admin password' : (form.role === 'customer' ? 'Click button to continue' : 'your@email.com')}
              required={form.role !== 'customer'}
              disabled={form.role === 'customer'}
              autoComplete={form.role === 'admin' ? 'current-password' : 'email'}
            />
          </div>

          {form.role === 'provider' && (
            <div className="form-group">
              <label htmlFor="password">
                Password
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </label>
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
            disabled={loading}
            className="login-button"
          >
            {loading ? (form.role === 'customer' ? 'Redirecting...' : 'Signing in...') : 
             (form.role === 'customer' ? 'Continue to Magic Link Login' : `Sign in as ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`)}
          </button>
        </form>

        {/* Help Section */}
        <div className="login-help">
          {form.role === 'customer' && (
            <>
              <p>Don't have an account? <a href="/customers">Sign up</a></p>
              <p>Have a booking code? <a href="/manage-booking">Manage booking</a></p>
            </>
          )}
          {form.role === 'provider' && (
            <p className="help-text">Contact admin for provider credentials</p>
          )}
          {form.role === 'admin' && (
            <p className="help-text">Admin password configured in environment</p>
          )}
        </div>

        {/* Demo Credentials */}
        <div className="demo-credentials">
          <h3>Demo Credentials</h3>
          <div className="credentials-grid">
            <div className="credential-item">
              <strong>Customer:</strong>
              <span>Use magic link (no password needed)</span>
            </div>
            <div className="credential-item">
              <strong>Provider:</strong>
              <span>jan@boondocks.com / barber123</span>
            </div>
            <div className="credential-item">
              <strong>Admin:</strong>
              <span>boondocks2024</span>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <a href="/" className="back-link">← Back to Booking</a>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          background: white;
          border: 3px solid #8b7355;
          max-width: 500px;
          width: 100%;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-header {
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

        .login-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          color: #2c2c2c;
          margin: 0 0 8px 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .role-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 30px;
        }

        .role-button {
          background: #f5f5f5;
          border: 2px solid #ddd;
          padding: 15px 10px;
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

        .role-icon {
          display: block;
          font-size: 24px;
          margin-bottom: 5px;
        }

        .role-name {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .role-desc {
          display: block;
          font-size: 10px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .login-form {
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
          position: relative;
        }

        .forgot-link {
          position: absolute;
          right: 0;
          top: 0;
          font-size: 11px;
          color: #c41e3a;
          text-decoration: none;
          text-transform: none;
          letter-spacing: normal;
        }

        .forgot-link:hover {
          text-decoration: underline;
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

        .login-button {
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

        .login-button:hover:not(:disabled) {
          background: #a01729;
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-help {
          text-align: center;
          margin-bottom: 20px;
        }

        .login-help p {
          margin: 5px 0;
          font-size: 13px;
          color: #666;
        }

        .login-help a {
          color: #c41e3a;
          text-decoration: underline;
          font-weight: 600;
        }

        .help-text {
          color: #999;
          font-style: italic;
          font-size: 12px;
        }

        .demo-credentials {
          background: #f8f8f8;
          padding: 15px;
          margin-bottom: 20px;
          border-left: 3px solid #8b7355;
        }

        .demo-credentials h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .credentials-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .credential-item {
          font-size: 12px;
        }

        .credential-item strong {
          color: #333;
          margin-right: 8px;
        }

        .credential-item span {
          color: #666;
          font-family: 'Courier New', monospace;
        }

        .login-footer {
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
          .login-container {
            padding: 30px 20px;
          }

          .role-selector {
            grid-template-columns: 1fr;
          }

          .role-button {
            display: flex;
            align-items: center;
            text-align: left;
            padding: 12px;
          }

          .role-icon {
            margin-bottom: 0;
            margin-right: 15px;
            font-size: 20px;
          }

          .role-name {
            margin-bottom: 2px;
          }

          .logo {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;