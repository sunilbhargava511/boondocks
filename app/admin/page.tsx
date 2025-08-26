'use client';

import React, { useState, useEffect } from 'react';
import { Provider, Service } from '@/lib/types';
import { loadProviders, loadServices } from '@/lib/data';

interface AdminState {
  isAuthenticated: boolean;
  activeTab: 'barbers' | 'services' | 'schedule';
  providers: Provider[];
  services: Service[];
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
    isLoading: true,
    isSaving: false,
    message: { type: '', text: '' }
  });
  
  const [password, setPassword] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, servicesData] = await Promise.all([
        loadProviders(),
        loadServices()
      ]);
      setState(prev => ({
        ...prev,
        providers: providersData,
        services: servicesData,
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
                  <button onClick={addProvider} className="add-button">+ Add Barber</button>
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
                  <button onClick={addService} className="add-button">+ Add Service</button>
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
                <h2>Business Hours</h2>
                <div className="schedule-info">
                  <p>Business hours are managed through your SimplyBook.me account. To update business hours, please log in to your SimplyBook.me admin panel.</p>
                  <a 
                    href="https://boondocks.secure.simplybook.me" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="simplybook-link"
                  >
                    Go to SimplyBook.me Admin →
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="admin-actions">
        <button 
          onClick={saveData} 
          className="save-button"
          disabled={state.isSaving}
        >
          {state.isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
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
        }
        
        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          padding: 10px;
          border-radius: 8px;
        }
        
        .tab {
          padding: 10px 24px;
          background: transparent;
          border: 2px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
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
        
        .add-button {
          padding: 8px 16px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
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
          text-align: center;
          padding: 40px;
        }
        
        .schedule-info {
          margin-top: 20px;
        }
        
        .simplybook-link {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background: #1e4d8b;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .admin-actions {
          position: sticky;
          bottom: 20px;
          text-align: center;
          margin-top: 30px;
        }
        
        .save-button {
          padding: 15px 40px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        
        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  );
}