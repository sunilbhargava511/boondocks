'use client';

import React, { useState, useEffect } from 'react';
import ProviderLogin from '@/components/ProviderLogin';
import ProviderDashboard from '@/components/ProviderDashboard';

export default function ProvidersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('providerToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/providers/auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProvider(data.provider);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('providerToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('providerToken');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (providerData: any, token: string) => {
    localStorage.setItem('providerToken', token);
    setProvider(providerData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('providerToken');
    setProvider(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-container">
      {!isAuthenticated ? (
        <ProviderLogin onLogin={handleLogin} />
      ) : (
        <ProviderDashboard provider={provider} onLogout={handleLogout} />
      )}
    </div>
  );
}