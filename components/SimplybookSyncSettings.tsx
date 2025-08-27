'use client';

import React, { useState, useEffect } from 'react';

interface SystemSettings {
  simplybookSyncEnabled: boolean;
  autoSyncNewCustomers: boolean;
  autoSyncAppointments: boolean;
  lastSyncDate: string | null;
}

export default function SimplybookSyncSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (field: keyof SystemSettings, value: boolean) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-6">Failed to load settings</div>;
  }

  return (
    <div className="simplybook-sync-settings">
      <div className="settings-header">
        <h3>SimplyBook.me Integration</h3>
        <div className="sync-status">
          {settings.simplybookSyncEnabled ? (
            <span className="status-badge active">Sync Active</span>
          ) : (
            <span className="status-badge inactive">Sync Disabled</span>
          )}
        </div>
      </div>

      <div className="settings-description">
        Control how your booking system integrates with SimplyBook.me. When disabled, all data stays 
        in your local database only, making it easy to migrate to another booking provider.
      </div>

      <div className="settings-content">
        {/* Main Toggle */}
        <div className="setting-item main-toggle">
          <label className="toggle-wrapper">
            <input
              type="checkbox"
              checked={settings.simplybookSyncEnabled}
              onChange={(e) => updateSetting('simplybookSyncEnabled', e.target.checked)}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
            <div className="toggle-label">
              <span className="label-title">Enable SimplyBook.me Sync</span>
              <span className="label-description">
                When enabled, customer and appointment data will be synchronized with SimplyBook.me
              </span>
            </div>
          </label>
        </div>

        {/* Sub-settings (only shown when main sync is enabled) */}
        {settings.simplybookSyncEnabled && (
          <div className="sub-settings">
            <div className="setting-item">
              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  checked={settings.autoSyncNewCustomers}
                  onChange={(e) => updateSetting('autoSyncNewCustomers', e.target.checked)}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <div className="toggle-label">
                  <span className="label-title">Auto-sync New Customers</span>
                  <span className="label-description">
                    Automatically create new customers in SimplyBook when they book
                  </span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  checked={settings.autoSyncAppointments}
                  onChange={(e) => updateSetting('autoSyncAppointments', e.target.checked)}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <div className="toggle-label">
                  <span className="label-title">Auto-sync Appointments</span>
                  <span className="label-description">
                    Automatically create appointments in SimplyBook when customers book
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {settings.lastSyncDate && (
          <div className="sync-info">
            Last synced: {new Date(settings.lastSyncDate).toLocaleString()}
          </div>
        )}

        <div className="settings-actions">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="btn-save"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="migration-note">
          <h4>Data Migration Ready</h4>
          <p>
            All customer and appointment data is stored locally first. You can disable SimplyBook sync 
            at any time and continue operating with your local database. This makes migrating to another 
            booking provider seamless - just export your data and import it into the new system.
          </p>
        </div>
      </div>

      <style jsx>{`
        .simplybook-sync-settings {
          background: white;
          border: 2px solid #8b7355;
          padding: 24px;
          margin-bottom: 32px;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .settings-header h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #2c2c2c;
          margin: 0;
        }

        .sync-status {
          display: flex;
          align-items: center;
        }

        .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: #4caf50;
          color: white;
        }

        .status-badge.inactive {
          background: #757575;
          color: white;
        }

        .settings-description {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 24px;
          padding: 12px;
          background: #f9f9f9;
          border-left: 3px solid #8b7355;
        }

        .settings-content {
          margin-top: 24px;
        }

        .setting-item {
          margin-bottom: 20px;
        }

        .setting-item.main-toggle {
          padding: 16px;
          background: #f5f5f0;
          border: 2px solid #8b7355;
          margin-bottom: 24px;
        }

        .sub-settings {
          padding-left: 24px;
          border-left: 3px solid #e0e0e0;
          margin-bottom: 24px;
        }

        .toggle-wrapper {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          position: relative;
        }

        .toggle-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .toggle-slider {
          position: relative;
          width: 48px;
          height: 24px;
          background-color: #ccc;
          border-radius: 24px;
          transition: 0.3s;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
        }

        .toggle-input:checked + .toggle-slider {
          background-color: #c41e3a;
        }

        .toggle-input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .toggle-label {
          flex: 1;
        }

        .label-title {
          display: block;
          font-weight: 600;
          color: #2c2c2c;
          margin-bottom: 4px;
        }

        .label-description {
          display: block;
          font-size: 13px;
          color: #666;
          line-height: 1.4;
        }

        .sync-info {
          padding: 12px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 13px;
          color: #666;
          margin-bottom: 20px;
        }

        .settings-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }

        .btn-save {
          padding: 12px 32px;
          background: #c41e3a;
          color: white;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-save:hover:not(:disabled) {
          background: #a01729;
          transform: translateY(-2px);
        }

        .btn-save:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .message {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
        }

        .message.success {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #4caf50;
        }

        .message.error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #f44336;
        }

        .migration-note {
          margin-top: 32px;
          padding: 20px;
          background: #fff3e0;
          border: 2px solid #ff9800;
          border-radius: 4px;
        }

        .migration-note h4 {
          margin: 0 0 12px 0;
          font-family: 'Oswald', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #e65100;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .migration-note p {
          margin: 0;
          color: #333;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}