'use client';

import React, { useState, useEffect } from 'react';

export default function SimplybookSync() {
  const [settings, setSettings] = useState({
    simplybookSyncEnabled: false,
    autoSyncNewCustomers: false,
    autoSyncAppointments: false,
    lastSyncDate: null as Date | null
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/simplybook-sync');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching sync settings:', error);
    }
  };

  const updateSettings = async (field: string, value: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/simplybook-sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setMessage(`${field} ${value ? 'enabled' : 'disabled'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const performSync = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/simplybook-sync', {
        method: 'POST'
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Sync completed successfully');
        fetchSettings(); // Refresh settings to get new lastSyncDate
      } else {
        setMessage(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error performing sync:', error);
      setMessage('Failed to sync with SimplyBook');
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="simplybook-sync-section">
      <h3>SimplyBook Integration</h3>
      
      <div className="sync-settings">
        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={settings.simplybookSyncEnabled}
              onChange={(e) => updateSettings('simplybookSyncEnabled', e.target.checked)}
              disabled={loading}
            />
            <span>Enable SimplyBook Sync</span>
          </label>
          <p className="setting-description">
            When enabled, provider data will be fetched from SimplyBook API
          </p>
        </div>

        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSyncNewCustomers}
              onChange={(e) => updateSettings('autoSyncNewCustomers', e.target.checked)}
              disabled={loading || !settings.simplybookSyncEnabled}
            />
            <span>Auto-sync New Customers</span>
          </label>
          <p className="setting-description">
            Automatically create customers in SimplyBook when they book
          </p>
        </div>

        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSyncAppointments}
              onChange={(e) => updateSettings('autoSyncAppointments', e.target.checked)}
              disabled={loading || !settings.simplybookSyncEnabled}
            />
            <span>Auto-sync Appointments</span>
          </label>
          <p className="setting-description">
            Automatically sync appointments with SimplyBook
          </p>
        </div>
      </div>

      <div className="sync-actions">
        <button
          onClick={performSync}
          disabled={syncing || !settings.simplybookSyncEnabled}
          className="sync-button"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
        
        {settings.lastSyncDate && (
          <p className="last-sync">
            Last synced: {new Date(settings.lastSyncDate).toLocaleString()}
          </p>
        )}
      </div>

      {message && (
        <div className={`sync-message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .simplybook-sync-section {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .simplybook-sync-section h3 {
          color: #fff;
          margin-bottom: 20px;
          font-size: 18px;
        }

        .sync-settings {
          margin-bottom: 20px;
        }

        .setting-row {
          margin-bottom: 20px;
        }

        .setting-row label {
          display: flex;
          align-items: center;
          color: #fff;
          cursor: pointer;
          margin-bottom: 5px;
        }

        .setting-row label input {
          margin-right: 10px;
        }

        .setting-row label span {
          font-weight: 500;
        }

        .setting-description {
          color: #999;
          font-size: 14px;
          margin-left: 24px;
          margin-top: 5px;
        }

        .sync-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .sync-button {
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sync-button:hover:not(:disabled) {
          background: #b91c1c;
        }

        .sync-button:disabled {
          background: #666;
          cursor: not-allowed;
        }

        .last-sync {
          color: #999;
          font-size: 14px;
        }

        .sync-message {
          margin-top: 15px;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 14px;
        }

        .sync-message.success {
          background: #065f46;
          color: #6ee7b7;
          border: 1px solid #10b981;
        }

        .sync-message.error {
          background: #7f1d1d;
          color: #fca5a5;
          border: 1px solid #ef4444;
        }
      `}</style>
    </div>
  );
}