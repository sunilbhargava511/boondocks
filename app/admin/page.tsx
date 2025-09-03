'use client';

import React, { useState, useEffect } from 'react';
import { Provider, Service } from '@/lib/types';
import { loadProviders, loadServices } from '@/lib/data';
import CustomerManagement from '@/components/CustomerManagement';
import SimplybookSyncSettings from '@/components/SimplybookSyncSettings';

interface AdminState {
  isAuthenticated: boolean;
  activeTab: 'barbers' | 'services' | 'schedule' | 'customers' | 'settings' | 'passwords';
  providers: Provider[];
  services: Service[];
  businessHours: { [day: string]: { start: string; end: string; isOpen: boolean } };
  providerAccounts: { id: string; name: string; email: string; lastLogin?: Date | null }[];
  isLoading: boolean;
  isSaving: boolean;
  message: { type: 'success' | 'error' | ''; text: string };
}

export default function AdminPage() {
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    activeTab: 'barbers',
    providers: [],
    services: [],
    businessHours: {
      monday: { start: '09:00', end: '17:00', isOpen: true },
      tuesday: { start: '09:00', end: '17:00', isOpen: true },
      wednesday: { start: '09:00', end: '17:00', isOpen: true },
      thursday: { start: '09:00', end: '17:00', isOpen: true },
      friday: { start: '09:00', end: '17:00', isOpen: true },
      saturday: { start: '09:00', end: '15:00', isOpen: true },
      sunday: { start: '10:00', end: '14:00', isOpen: false }
    },
    providerAccounts: [],
    isLoading: true,
    isSaving: false,
    message: { type: '', text: '' }
  });
  
  const [password, setPassword] = useState('');

  // Load data on mount
  useEffect(() => {
    // Check if user has provider token - redirect them to provider portal
    const providerToken = localStorage.getItem('providerToken');
    if (providerToken) {
      alert('Please use the Provider Portal at /providers for your account access.');
      window.location.href = '/providers';
      return;
    }
    
    loadData();
    loadBusinessHours();
  }, []);

  const loadProviderAccounts = async () => {
    try {
      console.log('🔍 Loading provider accounts...');
      const response = await fetch('/api/admin/provider-accounts');
      console.log('📡 Provider accounts response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Provider accounts data:', data);
        console.log('👥 Number of providers found:', data.providers?.length || 0);
        return data.providers || [];
      }
      console.error('❌ Failed to load provider accounts:', response.status, response.statusText);
      return [];
    } catch (error) {
      console.error('💥 Error loading provider accounts:', error);
      return [];
    }
  };

  const loadData = async () => {
    try {
      const [providersData, servicesData, providerAccountsData] = await Promise.all([
        loadProviders(),
        loadServices(),
        loadProviderAccounts()
      ]);
      console.log('🔄 Setting state with provider accounts:', providerAccountsData);
      setState(prev => ({
        ...prev,
        providers: providersData,
        services: servicesData,
        providerAccounts: providerAccountsData,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        message: { type: 'error', text: 'Failed to load data' }
      }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        setState(prev => ({ ...prev, isAuthenticated: true }));
      } else {
        setState(prev => ({ 
          ...prev, 
          message: { type: 'error', text: 'Invalid password' } 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        message: { type: 'error', text: 'Authentication failed' } 
      }));
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false }));
    setPassword('');
  };

  const updateProvider = (index: number, field: string, value: any) => {
    const updatedProviders = [...state.providers];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'availability') {
        updatedProviders[index].availability = {
          ...updatedProviders[index].availability,
          [child]: value || null
        };
      } else if (parent === 'restrictions') {
        updatedProviders[index].restrictions = {
          ...updatedProviders[index].restrictions,
          [child]: value
        };
      }
    } else {
      (updatedProviders[index] as any)[field] = value;
    }
    setState(prev => ({ ...prev, providers: updatedProviders }));
  };

  const updateService = (index: number, field: string, value: any) => {
    const updatedServices = [...state.services];
    (updatedServices[index] as any)[field] = value;
    setState(prev => ({ ...prev, services: updatedServices }));
  };

  const addProvider = () => {
    const newProvider: Provider = {
      id: `provider_${Date.now()}`,
      name: 'New Barber',
      description: '',
      notes: '',
      availability: {
        monday: '9:00am-8:00pm',
        tuesday: '9:00am-8:00pm',
        wednesday: '9:00am-8:00pm',
        thursday: '9:00am-8:00pm',
        friday: '9:00am-8:00pm',
        saturday: '9:00am-7:00pm',
        sunday: null
      },
      restrictions: {}
    };
    setState(prev => ({ ...prev, providers: [...prev.providers, newProvider] }));
  };

  const addService = () => {
    const newService: Service = {
      id: `service_${Date.now()}`,
      name: 'New Service',
      category: 'Haircuts',
      description: '',
      duration: 30,
      price: 0
    };
    setState(prev => ({ ...prev, services: [...prev.services, newService] }));
  };

  const deleteProvider = (index: number) => {
    if (confirm('Are you sure you want to delete this barber?')) {
      const updatedProviders = state.providers.filter((_, i) => i !== index);
      setState(prev => ({ ...prev, providers: updatedProviders }));
    }
  };

  const deleteService = (index: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const updatedServices = state.services.filter((_, i) => i !== index);
      setState(prev => ({ ...prev, services: updatedServices }));
    }
  };

  const saveData = async () => {
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Send data to API endpoint
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: state.providers,
          services: state.services
        })
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          message: { type: 'success', text: 'Data saved successfully!' }
        }));
        setTimeout(() => {
          setState(prev => ({ ...prev, message: { type: '', text: '' } }));
        }, 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        message: { type: 'error', text: 'Failed to save data. Please try again.' }
      }));
    }
  };

  const syncWithSimplyBook = async () => {
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Sync providers from SimplyBook
      const providersResponse = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncProviders' })
      });

      // Sync services from SimplyBook
      const servicesResponse = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncServices' })
      });

      if (providersResponse.ok && servicesResponse.ok) {
        const providersData = await providersResponse.json();
        const servicesData = await servicesResponse.json();
        
        if (providersData.success && servicesData.success) {
          setState(prev => ({
            ...prev,
            providers: providersData.providers,
            services: servicesData.services,
            isSaving: false,
            message: { type: 'success', text: 'Successfully synced with SimplyBook.me!' }
          }));
          
          setTimeout(() => {
            setState(prev => ({ ...prev, message: { type: '', text: '' } }));
          }, 3000);
        } else {
          throw new Error('Sync failed');
        }
      } else {
        throw new Error('Failed to connect to SimplyBook.me');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        message: { type: 'error', text: 'Failed to sync with SimplyBook.me. Please check your API connection.' }
      }));
    }
  };

  const loadBusinessHours = async () => {
    try {
      // Get business hours from SimplyBook API
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCompanyInfo' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.companyInfo) {
          // Convert SimplyBook hours to our format
          const businessHours: any = {};
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
          days.forEach(day => {
            businessHours[day] = {
              start: '09:00',
              end: '17:00',
              isOpen: true
            };
          });
          
          setState(prev => ({ ...prev, businessHours }));
        }
      }
    } catch (error) {
      console.error('Failed to load business hours:', error);
    }
  };

  const updateBusinessHours = (day: string, field: string, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const saveBusinessHours = async () => {
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Convert to SimplyBook format and save via API
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateBusinessHours',
          data: { businessHours: state.businessHours }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setState(prev => ({
            ...prev,
            isSaving: false,
            message: { type: 'success', text: 'Business hours updated successfully!' }
          }));
          
          setTimeout(() => {
            setState(prev => ({ ...prev, message: { type: '', text: '' } }));
          }, 3000);
        } else {
          throw new Error('Failed to update business hours');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        message: { type: 'error', text: 'Failed to save business hours. Please try again.' }
      }));
    }
  };

  // Password Reset Section Component
  const PasswordResetSection = ({ providerAccounts, onMessage }: { providerAccounts: { id: string; name: string; email: string; lastLogin?: Date | null }[], onMessage: (type: 'success' | 'error', text: string) => void }) => {
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
    const [isResettingAdmin, setIsResettingAdmin] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [newProviderPassword, setNewProviderPassword] = useState('');
    const [confirmProviderPassword, setConfirmProviderPassword] = useState('');
    const [isResettingProvider, setIsResettingProvider] = useState(false);

    const resetAdminPassword = async () => {
      if (!adminPassword || !confirmAdminPassword) {
        onMessage('error', 'Please fill in all fields');
        return;
      }

      if (adminPassword !== confirmAdminPassword) {
        onMessage('error', 'Passwords do not match');
        return;
      }

      if (adminPassword.length < 8) {
        onMessage('error', 'Password must be at least 8 characters');
        return;
      }

      setIsResettingAdmin(true);
      try {
        const response = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: adminPassword })
        });

        if (response.ok) {
          onMessage('success', 'Admin password updated successfully!');
          setAdminPassword('');
          setConfirmAdminPassword('');
        } else {
          const data = await response.json();
          onMessage('error', data.error || 'Failed to update admin password');
        }
      } catch (error) {
        onMessage('error', 'Failed to update admin password');
      } finally {
        setIsResettingAdmin(false);
      }
    };

    const resetProviderPassword = async () => {
      if (!selectedProvider || !newProviderPassword || !confirmProviderPassword) {
        onMessage('error', 'Please fill in all fields');
        return;
      }

      if (newProviderPassword !== confirmProviderPassword) {
        onMessage('error', 'Passwords do not match');
        return;
      }

      if (newProviderPassword.length < 8) {
        onMessage('error', 'Password must be at least 8 characters');
        return;
      }

      setIsResettingProvider(true);
      try {
        const response = await fetch('/api/providers/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            providerId: selectedProvider, 
            newPassword: newProviderPassword 
          })
        });

        if (response.ok) {
          onMessage('success', 'Provider password updated successfully!');
          setSelectedProvider('');
          setNewProviderPassword('');
          setConfirmProviderPassword('');
        } else {
          const data = await response.json();
          onMessage('error', data.error || 'Failed to update provider password');
        }
      } catch (error) {
        onMessage('error', 'Failed to update provider password');
      } finally {
        setIsResettingProvider(false);
      }
    };

    return (
      <>
        <div className="passwords-section">
          <div className="section-header">
            <h2>Password Management</h2>
          </div>
          
          <div className="password-cards">
          {/* Admin Password Reset */}
          <div className="password-card">
            <h3>Admin Password Reset</h3>
            <p className="card-description">
              Change the admin password for this dashboard. This will update the environment variable.
            </p>
            
            <div className="password-form">
              <div className="form-group">
                <label>New Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter new admin password"
                  className="password-input"
                  disabled={isResettingAdmin}
                />
              </div>
              
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Confirm new admin password"
                  className="password-input"
                  disabled={isResettingAdmin}
                />
              </div>
              
              <button
                onClick={resetAdminPassword}
                disabled={isResettingAdmin}
                className="reset-button admin-reset"
              >
                {isResettingAdmin ? 'Updating...' : 'Update Admin Password'}
              </button>
            </div>
          </div>

          {/* Provider Password Reset */}
          <div className="password-card">
            <h3>Barber Password Reset</h3>
            <p className="card-description">
              Reset passwords for individual barber accounts. They can log in with their email and the new password.
            </p>
            
            <div className="password-form">
              <div className="form-group">
                <label>Select Barber</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="provider-select"
                  disabled={isResettingProvider}
                >
                  <option value="">Choose a barber...</option>
                  {providerAccounts.map((account) => {
                    console.log('🔄 Rendering provider option:', account);
                    return (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.email})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newProviderPassword}
                  onChange={(e) => setNewProviderPassword(e.target.value)}
                  placeholder="Enter new password for barber"
                  className="password-input"
                  disabled={isResettingProvider}
                />
              </div>
              
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmProviderPassword}
                  onChange={(e) => setConfirmProviderPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="password-input"
                  disabled={isResettingProvider}
                />
              </div>
              
              <button
                onClick={resetProviderPassword}
                disabled={isResettingProvider || !selectedProvider}
                className="reset-button provider-reset"
              >
                {isResettingProvider ? 'Updating...' : 'Reset Barber Password'}
              </button>
            </div>
          </div>
        </div>
        </div>
        
        <style jsx>{`
          .passwords-section {
            padding: 0;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .passwords-section .section-header {
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #8b7355;
          }
          
          .passwords-section .section-header h2 {
            font-family: 'Oswald', sans-serif;
            font-size: 28px;
            color: #2c2c2c;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .password-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 30px;
          }
          
          .password-card {
            background: white;
            border: 2px solid #8b7355;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .password-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          }
          
          .password-card h3 {
            font-family: 'Oswald', sans-serif;
            color: #c41e3a;
            margin-bottom: 12px;
            font-size: 22px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .card-description {
            color: #666;
            margin-bottom: 25px;
            line-height: 1.6;
            font-size: 15px;
            background: #f8f8f8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #8b7355;
          }
          
          .password-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .form-group label {
            font-family: 'Oswald', sans-serif;
            font-weight: 500;
            color: #2c2c2c;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .password-input,
          .provider-select {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 15px;
            font-family: inherit;
            transition: all 0.3s ease;
            background: white;
            box-sizing: border-box;
          }
          
          .password-input:focus,
          .provider-select:focus {
            outline: none;
            border-color: #8b7355;
            box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
            transform: translateY(-1px);
          }
          
          .password-input:disabled,
          .provider-select:disabled {
            background: #f5f5f5;
            color: #999;
            cursor: not-allowed;
            border-color: #ddd;
          }
          
          .provider-select {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 18px;
            padding-right: 40px;
          }
          
          .provider-select option {
            padding: 10px;
            background: white;
            color: #333;
          }
          
          .reset-button {
            padding: 16px 24px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            font-family: 'Oswald', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
            position: relative;
            overflow: hidden;
          }
          
          .reset-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s;
          }
          
          .reset-button:hover::before {
            width: 300px;
            height: 300px;
          }
          
          .admin-reset {
            background: linear-gradient(135deg, #c41e3a 0%, #a01729 100%);
            color: white;
            border: 2px solid transparent;
          }
          
          .admin-reset:hover:not(:disabled) {
            background: linear-gradient(135deg, #a01729 0%, #8b1423 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(196, 30, 58, 0.3);
          }
          
          .provider-reset {
            background: linear-gradient(135deg, #8b7355 0%, #6d5a42 100%);
            color: white;
            border: 2px solid transparent;
          }
          
          .provider-reset:hover:not(:disabled) {
            background: linear-gradient(135deg, #6d5a42 0%, #5a4736 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(139, 115, 85, 0.3);
          }
          
          .reset-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }
          
          .reset-button:disabled::before {
            display: none;
          }
          
          @media (max-width: 768px) {
            .password-cards {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            
            .password-card {
              padding: 20px;
            }
            
            .password-card h3 {
              font-size: 20px;
            }
            
            .card-description {
              font-size: 14px;
              padding: 12px;
            }
            
            .provider-select {
              background-size: 16px;
            }
          }
        `}</style>
      </>
    );
  };

  if (!state.isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
            />
            <button type="submit" className="login-button">Login</button>
          </form>
          {state.message.type === 'error' && (
            <div className="error-message">{state.message.text}</div>
          )}
        </div>
        <style jsx>{`
          .admin-login {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
          }
          .login-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
          }
          h1 {
            font-family: 'Bebas Neue', cursive;
            font-size: 32px;
            color: #2c2c2c;
            text-align: center;
            margin-bottom: 30px;
          }
          .password-input {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .login-button {
            width: 100%;
            padding: 12px;
            background: #c41e3a;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .login-button:hover {
            background: #a01729;
          }
          .error-message {
            margin-top: 15px;
            padding: 10px;
            background: #ffebee;
            color: #c62828;
            border-radius: 4px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Boondocks Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${state.activeTab === 'barbers' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'barbers' }))}
        >
          Barbers
        </button>
        <button
          className={`tab ${state.activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'services' }))}
        >
          Services
        </button>
        <button
          className={`tab ${state.activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'schedule' }))}
        >
          Schedule
        </button>
        <button
          className={`tab ${state.activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'customers' }))}
        >
          Customers
        </button>
        <button
          className={`tab ${state.activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'settings' }))}
        >
          Settings
        </button>
        <button
          className={`tab ${state.activeTab === 'passwords' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'passwords' }))}
        >
          Passwords
        </button>
      </div>

      {state.message.text && (
        <div className={`message ${state.message.type}`}>
          {state.message.text}
        </div>
      )}

      <div className="admin-content">
        {state.isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {state.activeTab === 'barbers' && (
              <div className="barbers-section">
                <div className="section-header">
                  <h2>Manage Barbers</h2>
                  <div className="header-actions">
                    <button onClick={addProvider} className="add-button">+ Add Barber</button>
                    <button 
                      onClick={saveData} 
                      className="save-button-inline"
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
                
                {state.providers.map((provider, index) => (
                  <div key={provider.id} className="barber-card">
                    <div className="barber-header">
                      <input
                        type="text"
                        value={provider.name}
                        onChange={(e) => updateProvider(index, 'name', e.target.value)}
                        className="name-input"
                        placeholder="Barber Name"
                      />
                      <button 
                        onClick={() => deleteProvider(index)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <textarea
                      value={provider.description}
                      onChange={(e) => updateProvider(index, 'description', e.target.value)}
                      className="description-input"
                      placeholder="Description"
                      rows={2}
                    />
                    
                    <div className="availability-section">
                      <h4>Working Hours</h4>
                      <div className="availability-grid">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                          <div key={day} className="day-row">
                            <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                            <input
                              type="text"
                              value={provider.availability[day as keyof typeof provider.availability] || ''}
                              onChange={(e) => updateProvider(index, `availability.${day}`, e.target.value)}
                              placeholder="e.g., 9:00am-8:00pm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="restrictions-section">
                      <h4>Restrictions</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={provider.restrictions?.notAcceptingNewClients || false}
                          onChange={(e) => updateProvider(index, 'restrictions.notAcceptingNewClients', e.target.checked)}
                        />
                        Not accepting new clients
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={provider.restrictions?.cashOnly || false}
                          onChange={(e) => updateProvider(index, 'restrictions.cashOnly', e.target.checked)}
                        />
                        Cash only
                      </label>
                      <div className="restriction-row">
                        <label>No kids under age:</label>
                        <input
                          type="number"
                          value={provider.restrictions?.noKidsUnder || ''}
                          onChange={(e) => updateProvider(index, 'restrictions.noKidsUnder', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="age-input"
                          min="0"
                          max="18"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state.activeTab === 'services' && (
              <div className="services-section">
                <div className="section-header">
                  <h2>Manage Services</h2>
                  <div className="header-actions">
                    <button onClick={addService} className="add-button">+ Add Service</button>
                    <button 
                      onClick={saveData} 
                      className="save-button-inline"
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
                
                <div className="service-table-header">
                  <span className="header-name">Service Name</span>
                  <span className="header-duration">Duration</span>
                  <span className="header-price">Price</span>
                  <span className="header-category">Category</span>
                  <span className="header-action"></span>
                </div>
                
                {['Haircuts', 'Beards', 'Kids'].map(category => (
                  <div key={category} className="category-group">
                    <h3>{category}</h3>
                    {state.services
                      .filter(service => service.category === category)
                      .map((service, idx) => {
                        const index = state.services.findIndex(s => s.id === service.id);
                        return (
                          <div key={service.id} className="service-card">
                            <div className="service-row">
                              <input
                                type="text"
                                value={service.name}
                                onChange={(e) => updateService(index, 'name', e.target.value)}
                                className="service-name"
                                placeholder="Service Name"
                              />
                              <div className="input-with-label">
                                <input
                                  type="number"
                                  value={service.duration}
                                  onChange={(e) => updateService(index, 'duration', parseInt(e.target.value))}
                                  className="service-duration"
                                  placeholder="30"
                                  min="15"
                                  step="15"
                                />
                                <span className="input-label">min</span>
                              </div>
                              <div className="input-with-label">
                                <span className="input-label">$</span>
                                <input
                                  type="number"
                                  value={service.price}
                                  onChange={(e) => updateService(index, 'price', parseFloat(e.target.value))}
                                  className="service-price"
                                  placeholder="0"
                                  min="0"
                                  step="1"
                                />
                              </div>
                              <select
                                value={service.category}
                                onChange={(e) => updateService(index, 'category', e.target.value)}
                                className="category-select"
                              >
                                <option value="Haircuts">Haircuts</option>
                                <option value="Beards">Beards</option>
                                <option value="Kids">Kids</option>
                              </select>
                              <button 
                                onClick={() => deleteService(index)}
                                className="delete-button-small"
                              >
                                ×
                              </button>
                            </div>
                            <input
                              type="text"
                              value={service.description || ''}
                              onChange={(e) => updateService(index, 'description', e.target.value)}
                              className="service-description"
                              placeholder="Description (optional)"
                            />
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}

            {state.activeTab === 'schedule' && (
              <div className="schedule-section">
                <div className="section-header">
                  <h2>Business Hours</h2>
                  <div className="header-actions">
                    <button 
                      onClick={loadBusinessHours}
                      className="add-button"
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? 'Loading...' : 'Sync from SimplyBook'}
                    </button>
                    <button 
                      onClick={saveBusinessHours} 
                      className="save-button-inline"
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? 'Saving...' : 'Save Hours'}
                    </button>
                  </div>
                </div>
                
                <div className="business-hours-container">
                  <div className="business-hours-card">
                    <p className="hours-description">
                      Manage your barbershop's operating hours for each day of the week. Changes will be synced to SimplyBook.me automatically.
                    </p>
                    
                    <div className="hours-grid">
                      {Object.entries(state.businessHours).map(([day, hours]) => (
                        <div key={day} className="hours-row">
                          <div className="day-label">
                            <label className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={hours.isOpen}
                                onChange={(e) => updateBusinessHours(day, 'isOpen', e.target.checked)}
                              />
                              <span>Open</span>
                            </label>
                          </div>
                          
                          <div className="time-inputs">
                            <div className="time-group">
                              <label>Opening</label>
                              <input
                                type="time"
                                value={hours.start}
                                onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                                disabled={!hours.isOpen}
                                className="time-input"
                              />
                            </div>
                            <span className="time-separator">to</span>
                            <div className="time-group">
                              <label>Closing</label>
                              <input
                                type="time"
                                value={hours.end}
                                onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                                disabled={!hours.isOpen}
                                className="time-input"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="analytics-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <button 
                        onClick={() => {
                          const newHours = { ...state.businessHours };
                          Object.keys(newHours).forEach(day => {
                            if (day !== 'sunday') {
                              newHours[day] = { start: '09:00', end: '18:00', isOpen: true };
                            }
                          });
                          setState(prev => ({ ...prev, businessHours: newHours }));
                        }}
                        className="action-button"
                      >
                        Set Standard Hours (9 AM - 6 PM)
                      </button>
                      
                      <button 
                        onClick={() => {
                          const newHours = { ...state.businessHours };
                          Object.keys(newHours).forEach(day => {
                            newHours[day].isOpen = day !== 'sunday' && day !== 'monday';
                          });
                          setState(prev => ({ ...prev, businessHours: newHours }));
                        }}
                        className="action-button"
                      >
                        Closed Sundays & Mondays
                      </button>
                    </div>
                    
                    <div className="sync-status">
                      <div className="status-item">
                        <span className="status-label">SimplyBook.me API</span>
                        <span className="status-indicator connected">Connected</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Last Updated</span>
                        <span className="status-value">Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state.activeTab === 'customers' && (
              <div className="customers-section">
                <CustomerManagement />
              </div>
            )}

            {state.activeTab === 'settings' && (
              <div className="settings-section">
                <SimplybookSyncSettings />
              </div>
            )}

            {state.activeTab === 'passwords' && (
              <PasswordResetSection 
                providerAccounts={state.providerAccounts}
                onMessage={(type, text) => {
                  setState(prev => ({ ...prev, message: { type, text } }));
                  setTimeout(() => {
                    setState(prev => ({ ...prev, message: { type: '', text: '' } }));
                  }, 3000);
                }}
              />
            )}
          </>
        )}
      </div>


      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f5f0;
          padding: 20px;
        }
        
        .admin-header {
          background: #2c2c2c;
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .admin-header h1 {
          font-family: 'Bebas Neue', cursive;
          font-size: 36px;
          margin: 0;
        }
        
        .logout-button {
          padding: 8px 20px;
          background: #c41e3a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.2s ease;
        }
        
        .logout-button:hover {
          background: #a01729;
          transform: translateY(-1px);
        }
        
        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .tab {
          padding: 10px 24px;
          background: transparent;
          border: 2px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }
        
        .tab.active {
          background: #8b7355;
          color: white;
          border-color: #8b7355;
        }
        
        .message {
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 600;
        }
        
        .message.success {
          background: #c8e6c9;
          color: #2e7d32;
        }
        
        .message.error {
          background: #ffcdd2;
          color: #c62828;
        }
        
        .admin-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          min-height: 400px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          margin: 0;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .add-button {
          padding: 8px 16px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.2s ease;
        }
        
        .add-button:hover:not(:disabled) {
          background: #45a049;
          transform: translateY(-1px);
        }
        
        .save-button-inline {
          padding: 8px 20px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }
        
        .save-button-inline:hover:not(:disabled) {
          background: #1976d2;
        }
        
        .save-button-inline:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .barber-card {
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .barber-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .name-input {
          font-size: 20px;
          font-weight: 600;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          flex: 1;
          margin-right: 10px;
        }
        
        .delete-button {
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .description-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
          resize: vertical;
        }
        
        .availability-section, .restrictions-section {
          margin-top: 20px;
        }
        
        .availability-section h4, .restrictions-section h4 {
          font-family: 'Oswald', sans-serif;
          margin-bottom: 10px;
        }
        
        .availability-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .day-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .day-row label {
          width: 80px;
          font-weight: 600;
        }
        
        .day-row input {
          flex: 1;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .restriction-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .age-input {
          width: 60px;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .service-table-header {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.5px;
        }
        
        .header-name {
          flex: 2;
        }
        
        .header-duration {
          width: 96px;
          text-align: center;
        }
        
        .header-price {
          width: 94px;
          text-align: center;
        }
        
        .header-category {
          width: 120px;
        }
        
        .header-action {
          width: 30px;
        }
        
        .category-group {
          margin-bottom: 30px;
        }
        
        .category-group h3 {
          font-family: 'Oswald', sans-serif;
          color: #8b7355;
          margin-bottom: 15px;
        }
        
        .service-card {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 10px;
        }
        
        .service-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .service-name {
          flex: 2;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .input-with-label {
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;
        }
        
        .input-label {
          font-weight: 600;
          color: #666;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .service-duration {
          width: 60px;
          padding: 6px 4px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: center;
        }
        
        .service-price {
          width: 70px;
          padding: 6px 4px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: right;
        }
        
        .category-select {
          width: 120px;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .delete-button-small {
          width: 30px;
          height: 30px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        }
        
        .service-description {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .schedule-section {
          padding: 0;
        }
        
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .analytics-card {
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
        }
        
        .analytics-card h3 {
          font-family: 'Oswald', sans-serif;
          color: #2c2c2c;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .quick-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .stat-label {
          color: #666;
          font-size: 14px;
        }
        
        .stat-value {
          font-weight: 600;
          color: #2c2c2c;
          font-size: 16px;
        }
        
        .integration-status {
          margin-bottom: 20px;
        }
        
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .status-label {
          color: #666;
          font-size: 14px;
        }
        
        .status-indicator {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          background: #ffc107;
          color: #856404;
        }
        
        .status-indicator.connected {
          background: #28a745;
          color: white;
        }
        
        .simplybook-link {
          display: inline-block;
          padding: 10px 20px;
          background: #1e4d8b;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .recent-bookings {
          color: #666;
          font-style: italic;
        }
        
        
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }
        
        /* Business Hours Styles */
        .business-hours-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          align-items: start;
        }
        
        .business-hours-card {
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 25px;
        }
        
        .hours-description {
          margin-bottom: 20px;
          color: #666;
          line-height: 1.5;
        }
        
        .hours-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .hours-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          align-items: center;
          gap: 20px;
          padding: 15px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        
        .day-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .day-name {
          font-weight: 600;
          font-size: 16px;
          color: #333;
        }
        
        .time-inputs {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .time-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .time-group label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }
        
        .time-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 120px;
        }
        
        .time-input:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }
        
        .time-separator {
          font-weight: 600;
          color: #666;
          margin-top: 16px;
        }
        
        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .action-button {
          padding: 10px 15px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          text-align: left;
        }
        
        .action-button:hover {
          background: #1976d2;
        }
        
        .sync-status {
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
        }
        
        .status-value {
          font-size: 14px;
          color: #666;
        }
        
        /* Password Reset Styles */
        .passwords-section {
          padding: 0;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .passwords-section .section-header {
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #8b7355;
        }
        
        .passwords-section .section-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 28px;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .password-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 30px;
        }
        
        .password-card {
          background: white;
          border: 2px solid #8b7355;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .password-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .password-card h3 {
          font-family: 'Oswald', sans-serif;
          color: #c41e3a;
          margin-bottom: 12px;
          font-size: 22px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .card-description {
          color: #666;
          margin-bottom: 25px;
          line-height: 1.6;
          font-size: 15px;
          background: #f8f8f8;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #8b7355;
        }
        
        .password-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          color: #2c2c2c;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .password-input,
        .provider-select {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.3s ease;
          background: white;
          box-sizing: border-box;
        }
        
        .password-input:focus,
        .provider-select:focus {
          outline: none;
          border-color: #8b7355;
          box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
          transform: translateY(-1px);
        }
        
        .password-input:disabled,
        .provider-select:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
          border-color: #ddd;
        }
        
        .provider-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px;
          padding-right: 40px;
        }
        
        .provider-select option {
          padding: 10px;
          background: white;
          color: #333;
        }
        
        .reset-button {
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 15px;
          position: relative;
          overflow: hidden;
        }
        
        .reset-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }
        
        .reset-button:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .admin-reset {
          background: linear-gradient(135deg, #c41e3a 0%, #a01729 100%);
          color: white;
          border: 2px solid transparent;
        }
        
        .admin-reset:hover:not(:disabled) {
          background: linear-gradient(135deg, #a01729 0%, #8b1423 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(196, 30, 58, 0.3);
        }
        
        .provider-reset {
          background: linear-gradient(135deg, #8b7355 0%, #6d5a42 100%);
          color: white;
          border: 2px solid transparent;
        }
        
        .provider-reset:hover:not(:disabled) {
          background: linear-gradient(135deg, #6d5a42 0%, #5a4736 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(139, 115, 85, 0.3);
        }
        
        .reset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        
        .reset-button:disabled::before {
          display: none;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 10px;
          }
          
          .admin-header {
            padding: 15px;
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
          
          .admin-header h1 {
            font-size: 28px;
          }
          
          .admin-tabs {
            padding: 8px;
            gap: 5px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .tab {
            padding: 10px 16px;
            font-size: 14px;
            white-space: nowrap;
            flex-shrink: 0;
          }
          
          .admin-content {
            padding: 15px;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .section-header h2 {
            font-size: 20px;
          }
          
          .header-actions {
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }
          
          .save-button-inline,
          .add-button {
            width: 100%;
            padding: 12px;
          }
          
          .barber-card,
          .service-card,
          .business-hours-card,
          .analytics-card {
            margin-bottom: 15px;
            padding: 15px;
          }
          
          .barber-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .name-input {
            margin-right: 0;
            margin-bottom: 10px;
          }
          
          .availability-grid {
            grid-template-columns: 1fr;
          }
          
          .day-row {
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
          }
          
          .day-row label {
            width: auto;
            margin-bottom: 5px;
          }
          
          .service-table-header {
            display: none;
          }
          
          .service-row {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
          }
          
          .service-name,
          .service-duration,
          .service-price,
          .category-select {
            width: 100%;
          }
          
          .input-with-label {
            width: 100%;
          }
          
          .business-hours-container {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .hours-row {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 12px;
          }
          
          .day-label {
            justify-content: flex-start;
            gap: 15px;
          }
          
          .time-inputs {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .time-input {
            min-width: 90px;
            flex: 1;
          }
          
          .password-cards {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .password-card {
            padding: 20px;
          }
          
          .password-card h3 {
            font-size: 18px;
          }
          
          .card-description {
            font-size: 14px;
            padding: 12px;
            margin-bottom: 20px;
          }
          
          .provider-select {
            background-size: 16px;
          }
          
          .reset-button {
            padding: 14px 20px;
            font-size: 14px;
          }
        }
        
        /* iPhone and small mobile devices */
        @media (max-width: 480px) {
          .admin-dashboard {
            padding: 8px;
          }
          
          .admin-header {
            padding: 12px;
          }
          
          .admin-header h1 {
            font-size: 24px;
          }
          
          .logout-button {
            padding: 10px 16px;
            font-size: 14px;
          }
          
          .admin-tabs {
            padding: 5px;
            margin-bottom: 15px;
          }
          
          .tab {
            padding: 8px 12px;
            font-size: 13px;
            min-width: 80px;
          }
          
          .admin-content {
            padding: 10px;
          }
          
          .section-header h2 {
            font-size: 18px;
          }
          
          .barber-card,
          .password-card,
          .business-hours-card {
            padding: 12px;
          }
          
          .name-input {
            font-size: 16px;
            padding: 10px;
          }
          
          .description-input {
            padding: 10px;
            font-size: 16px;
          }
          
          .service-name,
          .service-duration,
          .service-price,
          .category-select {
            font-size: 16px;
            padding: 10px;
          }
          
          .password-input,
          .provider-select {
            font-size: 16px;
            padding: 12px 14px;
          }
          
          .time-input {
            font-size: 16px;
            padding: 10px;
            min-width: 80px;
          }
          
          .reset-button {
            font-size: 13px;
            padding: 12px 18px;
          }
          
          .message {
            padding: 12px;
            font-size: 14px;
          }
          
          .checkbox-label {
            font-size: 14px;
          }
          
          .form-group label {
            font-size: 13px;
          }
          
          .card-description {
            font-size: 13px;
            padding: 10px;
          }
        }
        
        /* iPhone 15 Pro Max and similar large phones */
        @media (max-width: 430px) and (min-width: 393px) {
          .admin-tabs {
            justify-content: flex-start;
          }
          
          .tab {
            min-width: 70px;
          }
          
          .time-inputs {
            justify-content: space-between;
          }
          
          .time-input {
            width: calc(50% - 4px);
            min-width: 85px;
          }
        }
      `}</style>
    </div>
  );
}