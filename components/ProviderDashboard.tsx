'use client';

import React, { useState, useEffect } from 'react';
import ProviderAppointments from './ProviderAppointments';
import ProviderAvailability from './ProviderAvailability';
import ProviderCalendar from './ProviderCalendar';
import ProviderCustomerApprovals from './ProviderCustomerApprovals';
import ProviderNaughtyList from './ProviderNaughtyList';

interface ProviderDashboardProps {
  provider: any;
  onLogout: () => void;
}

export default function ProviderDashboard({ provider, onLogout }: ProviderDashboardProps) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'calendar' | 'availability' | 'customers' | 'naughty' | 'profile'>('appointments');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/appointments?startDate=' + new Date().toISOString().split('T')[0], {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="logo">Boondocks</h1>
          <span className="provider-name">Welcome, {provider.firstName}!</span>
        </div>
        <div className="header-right">
          <button onClick={onLogout} className="logout-button">
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-value">{stats.today.total || 0}</div>
            <div className="stat-label">Today's Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.today.confirmed || 0}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.today.completed || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button 
          className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button 
          className={`tab ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          Availability
        </button>
        <button 
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button 
          className={`tab ${activeTab === 'naughty' ? 'active' : ''}`}
          onClick={() => setActiveTab('naughty')}
        >
          No-Shows
        </button>
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === 'appointments' && (
          <ProviderAppointments provider={provider} />
        )}
        {activeTab === 'calendar' && (
          <ProviderCalendar provider={provider} />
        )}
        {activeTab === 'availability' && (
          <ProviderAvailability provider={provider} />
        )}
        {activeTab === 'customers' && (
          <ProviderCustomerApprovals provider={provider} />
        )}
        {activeTab === 'naughty' && (
          <ProviderNaughtyList provider={provider} />
        )}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h3>Profile Information</h3>
            <div className="profile-info">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{provider.firstName} {provider.lastName}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{provider.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{provider.phone || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="label">Provider ID:</span>
                <span className="value">{provider.providerId}</span>
              </div>
              <div className="info-row">
                <span className="label">Role:</span>
                <span className="value">{provider.role}</span>
              </div>
              <div className="info-row">
                <span className="label">Last Login:</span>
                <span className="value">{provider.lastLogin ? new Date(provider.lastLogin).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #f5f5f0;
        }

        .dashboard-header {
          background: #2c2c2c;
          color: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 5px solid #8b7355;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .logo {
          font-family: 'Oswald', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #c41e3a;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
        }

        .provider-name {
          font-size: 16px;
          color: #f5f5f0;
        }

        .logout-button {
          padding: 8px 20px;
          background: transparent;
          border: 2px solid #c41e3a;
          color: #f5f5f0;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: #c41e3a;
          color: white;
        }

        .stats-bar {
          background: white;
          padding: 20px 30px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          border-bottom: 2px solid #e0e0e0;
        }

        .stat-card {
          text-align: center;
          padding: 15px;
          background: #f8f8f8;
          border: 2px solid #8b7355;
        }

        .stat-value {
          font-family: 'Oswald', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #2c2c2c;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 5px;
        }

        .nav-tabs {
          background: white;
          padding: 0 30px;
          display: flex;
          gap: 0;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 15px 30px;
          background: transparent;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 16px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          position: relative;
          color: #666;
          transition: all 0.2s ease;
        }

        .tab:hover {
          color: #2c2c2c;
        }

        .tab.active {
          color: #c41e3a;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: #c41e3a;
        }

        .content-area {
          padding: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .profile-section {
          background: white;
          padding: 30px;
          border: 2px solid #8b7355;
        }

        .profile-section h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 24px 0;
        }

        .profile-info {
          display: grid;
          gap: 16px;
        }

        .info-row {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-row .label {
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          color: #8b7355;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
          width: 150px;
        }

        .info-row .value {
          color: #2c2c2c;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .header-left {
            flex-direction: column;
          }

          .stats-bar {
            grid-template-columns: 1fr;
          }

          .nav-tabs {
            overflow-x: auto;
          }

          .tab {
            padding: 12px 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}