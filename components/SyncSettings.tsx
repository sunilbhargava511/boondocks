'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface SystemSettings {
  simplybookSyncEnabled: boolean;
  autoSyncNewCustomers: boolean;
  autoSyncAppointments: boolean;
  lastSyncDate: string | null;
}

const SyncSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    simplybookSyncEnabled: false,
    autoSyncNewCustomers: false,
    autoSyncAppointments: false,
    lastSyncDate: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/system/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const performSync = async (syncType: 'customers' | 'appointments' | 'full') => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sync/simplybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `${data.message}. Stats: ${JSON.stringify(data.stats || data.customerSync || data.appointmentSync)}`
        });
        
        // Reload settings to get updated last sync date
        await loadSettings();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Sync failed' 
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">SimplyBook.me Sync Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure synchronization with your SimplyBook.me account
        </p>
      </div>

      <div className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="text-sm">{message.text}</div>
          </div>
        )}

        {/* Sync Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>{' '}
              <span className={`font-medium ${
                settings.simplybookSyncEnabled ? 'text-green-600' : 'text-red-600'
              }`}>
                {settings.simplybookSyncEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Sync:</span>{' '}
              <span className="font-medium text-gray-900">
                {settings.lastSyncDate 
                  ? format(new Date(settings.lastSyncDate), 'MMM d, yyyy h:mm a')
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable SimplyBook Sync</label>
              <p className="text-xs text-gray-600">Master switch for all SimplyBook synchronization</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.simplybookSyncEnabled}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  simplybookSyncEnabled: e.target.checked 
                })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto-sync New Customers</label>
              <p className="text-xs text-gray-600">Automatically create SimplyBook clients when customers register</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={!settings.simplybookSyncEnabled}
                checked={settings.autoSyncNewCustomers}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  autoSyncNewCustomers: e.target.checked 
                })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto-sync Appointments</label>
              <p className="text-xs text-gray-600">Automatically sync appointment changes to SimplyBook</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={!settings.simplybookSyncEnabled}
                checked={settings.autoSyncAppointments}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  autoSyncAppointments: e.target.checked 
                })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>

        {/* Save Settings */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Manual Sync */}
        {settings.simplybookSyncEnabled && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Manual Sync</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => performSync('customers')}
                disabled={syncing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {syncing ? 'Syncing...' : 'Sync Customers'}
              </button>
              <button
                onClick={() => performSync('appointments')}
                disabled={syncing}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {syncing ? 'Syncing...' : 'Sync Appointments'}
              </button>
              <button
                onClick={() => performSync('full')}
                disabled={syncing}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {syncing ? 'Syncing...' : 'Full Sync'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Manual sync will pull data from SimplyBook.me and update your local database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncSettings;