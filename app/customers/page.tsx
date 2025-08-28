'use client';

import React, { useState, useEffect } from 'react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const CustomerPortalPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    conversationPreference: 2
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) return;

    try {
      const response = await fetch('/api/customers/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      } else {
        localStorage.removeItem('customerToken');
      }
    } catch (error) {
      localStorage.removeItem('customerToken');
    }
  };

  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/customers/magic-link' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      if (isLogin) {
        // Magic link sent
        setMagicLinkSent(true);
      } else {
        // Registration successful, magic link sent
        setMagicLinkSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    setCustomer(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      conversationPreference: 2
    });
  };

  if (customer) {
    // Redirect to customer dashboard
    window.location.href = '/customers/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to view your appointments' : 'Create an account to manage your bookings'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          {magicLinkSent ? (
            // Magic link sent confirmation
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email!</h2>
              <p className="text-gray-600 mb-4">
                We've sent a magic link to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Click the link in your email to {isLogin ? 'sign in' : 'complete registration and sign in'}.
                The link will expire in 15 minutes.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Send Another Link
              </button>
            </div>
          ) : (
            <>
              {/* Toggle between login and register */}
              <div className="flex mb-6">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                    setMagicLinkSent(false);
                  }}
                  className={`flex-1 py-2 px-4 text-center font-medium rounded-l-lg border ${
                    isLogin
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                    setMagicLinkSent(false);
                  }}
                  className={`flex-1 py-2 px-4 text-center font-medium rounded-r-lg border-t border-r border-b ${
                    !isLogin
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </>
          )}

          {!magicLinkSent && (
            <>
              {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required={!isLogin}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conversation Preference
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.conversationPreference}
                    onChange={(e) => setFormData({ ...formData, conversationPreference: parseInt(e.target.value) })}
                  >
                    <option value={0}>Minimal to no talk</option>
                    <option value={1}>Very little conversation</option>
                    <option value={2}>Some conversation</option>
                    <option value={3}>Constant flow of conversation</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This helps your barber know how chatty you'd like your appointment to be.
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending Magic Link...' : (isLogin ? 'Send Magic Link' : 'Create Account & Send Link')}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6 text-center">
              <a
                href="/manage-booking"
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Don't have an account? Use booking code lookup →
              </a>
            </div>
          )}
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ← Back to Booking
          </a>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalPage;