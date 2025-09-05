'use client';

import React, { useState, useEffect } from 'react';

interface Provider {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: string;
  lastLogin: Date | null;
}

interface ProviderLoginProps {
  onLogin: (provider: any, token: string) => void;
}

export default function ProviderLogin({ onLogin }: ProviderLoginProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState('');

  // Load providers on component mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await fetch('/api/providers/login-list');
        if (response.ok) {
          const data = await response.json();
          setProviders(data.providers);
        } else {
          setError('Failed to load providers');
        }
      } catch (error) {
        setError('Network error loading providers');
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, []);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setPassword('');
    setError('');
  };

  const handleBackToProviders = () => {
    setSelectedProvider(null);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/providers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: selectedProvider.email, 
          password 
        })
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

  if (loadingProviders) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1 className="logo">Boondocks</h1>
            <h2 className="subtitle">Provider Portal</h2>
          </div>
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading providers...</p>
          </div>
        </div>
        <style jsx>{`
          .loading-state {
            text-align: center;
            padding: 40px 0;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f0f0f0;
            border-top: 4px solid #c41e3a;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-state p {
            color: #666;
            font-size: 14px;
          }

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
            max-width: 600px;
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="logo">Boondocks</h1>
          <h2 className="subtitle">Provider Portal</h2>
        </div>

        {!selectedProvider ? (
          // Provider Selection View
          <div>
            <p className="instruction-text">Select your account to sign in:</p>
            
            <div className="providers-grid">
              {providers.map((provider) => (
                <div 
                  key={provider.id}
                  className="provider-card"
                  onClick={() => handleProviderSelect(provider)}
                >
                  <div className="provider-avatar">
                    {provider.initials}
                  </div>
                  <div className="provider-info">
                    <h3 className="provider-name">{provider.name}</h3>
                    <p className="provider-role">{provider.role}</p>
                    {provider.lastLogin && (
                      <p className="last-login">
                        Last login: {new Date(provider.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="login-arrow">→</div>
                </div>
              ))}
            </div>
            
            <div className="login-footer">
              <a href="/" className="back-link">← Back to Booking</a>
            </div>
          </div>
        ) : (
          // Password Entry View
          <div>
            <div className="selected-provider">
              <div className="provider-avatar small">
                {selectedProvider.initials}
              </div>
              <div>
                <h3 className="provider-name">{selectedProvider.name}</h3>
                <p className="provider-email">{selectedProvider.email}</p>
              </div>
              <button 
                type="button" 
                className="back-button"
                onClick={handleBackToProviders}
                disabled={isLoading}
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="password">Enter your password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  autoFocus
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
                disabled={isLoading || !password}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              <p>Forgot your password? Contact admin</p>
            </div>
          </div>
        )}
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
          max-width: 600px;
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

        .instruction-text {
          text-align: center;
          color: #666;
          font-size: 16px;
          margin-bottom: 30px;
        }

        .providers-grid {
          display: grid;
          gap: 15px;
          margin-bottom: 30px;
        }

        .provider-card {
          display: flex;
          align-items: center;
          padding: 20px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .provider-card:hover {
          border-color: #c41e3a;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(196, 30, 58, 0.1);
        }

        .provider-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #c41e3a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Oswald', sans-serif;
          font-weight: 700;
          font-size: 20px;
          margin-right: 20px;
          flex-shrink: 0;
        }

        .provider-avatar.small {
          width: 40px;
          height: 40px;
          font-size: 16px;
          margin-right: 15px;
        }

        .provider-info {
          flex: 1;
        }

        .provider-name {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 5px 0;
        }

        .provider-role {
          font-size: 14px;
          color: #8b7355;
          text-transform: capitalize;
          margin: 0 0 3px 0;
        }

        .provider-email {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .last-login {
          font-size: 12px;
          color: #999;
          margin: 0;
        }

        .login-arrow {
          font-size: 24px;
          color: #c41e3a;
          margin-left: 15px;
        }

        .selected-provider {
          display: flex;
          align-items: center;
          padding: 20px;
          background: #f8f8f8;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .back-button {
          background: transparent;
          border: 1px solid #8b7355;
          color: #8b7355;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-left: auto;
          transition: all 0.2s ease;
        }

        .back-button:hover:not(:disabled) {
          background: #8b7355;
          color: white;
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          border-radius: 4px;
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
          border-radius: 4px;
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
          border-radius: 4px;
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