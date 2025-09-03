'use client';

import React, { useState, useEffect } from 'react';

interface ProviderNaughtyListProps {
  provider: any;
}

interface NaughtyListEntry {
  id: string;
  customerId?: string;
  blockedEmail: string;
  blockedPhone: string;
  customerName: string;
  reason: string;
  noShowCount: number;
  notes?: string;
  blockedBy: string;
  isAutomatic: boolean;
  canAppeal: boolean;
  createdAt: string;
}

interface NoShowIncident {
  id: string;
  appointmentId: string;
  appointmentDate: string;
  serviceName: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  notes?: string;
  markedBy: string;
  createdAt: string;
}

export default function ProviderNaughtyList({ provider }: ProviderNaughtyListProps) {
  const [naughtyList, setNaughtyList] = useState<NaughtyListEntry[]>([]);
  const [noShowIncidents, setNoShowIncidents] = useState<NoShowIncident[]>([]);
  const [settings, setSettings] = useState({
    enableNaughtyList: true,
    noShowThreshold: 3
  });
  const [activeTab, setActiveTab] = useState<'naughty' | 'noshows' | 'settings'>('naughty');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<NoShowIncident | null>(null);
  const [blockEmail, setBlockEmail] = useState('');
  const [blockPhone, setBlockPhone] = useState('');
  const [blockName, setBlockName] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockNotes, setBlockNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      
      const [naughtyResponse, incidentsResponse, settingsResponse] = await Promise.all([
        fetch('/api/providers/naughty-list', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/providers/no-show-incidents', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/providers/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (naughtyResponse.ok) {
        const naughtyData = await naughtyResponse.json();
        setNaughtyList(naughtyData.entries || []);
      }

      if (incidentsResponse.ok) {
        const incidentsData = await incidentsResponse.json();
        setNoShowIncidents(incidentsData.incidents || []);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings({
          enableNaughtyList: settingsData.enableNaughtyList ?? true,
          noShowThreshold: settingsData.noShowThreshold ?? 3
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage('Failed to load naughty list data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        setMessage('Settings updated successfully');
      } else {
        setMessage('Failed to update settings');
      }
    } catch (error) {
      setMessage('Failed to update settings');
    } finally {
      setActionLoading(false);
    }
  };

  const blockCustomer = async (email: string, phone: string, name: string, reason: string, notes: string = '', isManual: boolean = true) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/naughty-list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blockedEmail: email,
          blockedPhone: phone,
          customerName: name,
          reason,
          notes,
          isAutomatic: !isManual
        })
      });

      if (response.ok) {
        setMessage(`${name} has been blocked`);
        loadData();
        setShowBlockModal(false);
        resetBlockForm();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to block customer');
      }
    } catch (error) {
      setMessage('Failed to block customer');
    } finally {
      setActionLoading(false);
    }
  };

  const unblockCustomer = async (entryId: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch(`/api/providers/naughty-list/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('Customer has been unblocked');
        loadData();
      } else {
        setMessage('Failed to unblock customer');
      }
    } catch (error) {
      setMessage('Failed to unblock customer');
    } finally {
      setActionLoading(false);
    }
  };

  const resetBlockForm = () => {
    setBlockEmail('');
    setBlockPhone('');
    setBlockName('');
    setBlockReason('');
    setBlockNotes('');
    setSelectedIncident(null);
  };

  const handleBlockFromIncident = (incident: NoShowIncident) => {
    setSelectedIncident(incident);
    setBlockEmail(incident.customerEmail);
    setBlockPhone(incident.customerPhone);
    setBlockName(incident.customerName);
    setBlockReason('excessive_noshows');
    setShowBlockModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonDisplay = (reason: string) => {
    const reasons = {
      excessive_noshows: 'Excessive No-Shows',
      manual_block: 'Manually Blocked',
      inappropriate_behavior: 'Inappropriate Behavior',
      payment_issues: 'Payment Issues',
      other: 'Other'
    };
    return reasons[reason as keyof typeof reasons] || reason;
  };

  const getNoShowCountForCustomer = (email: string, phone: string) => {
    return noShowIncidents.filter(incident => 
      incident.customerEmail === email || incident.customerPhone === phone
    ).length;
  };

  return (
    <div className="naughty-list-container">
      <div className="naughty-header">
        <h2>No-Show & Naughty List Management</h2>
        <div className="tab-controls">
          <button 
            className={`tab-btn ${activeTab === 'naughty' ? 'active' : ''}`}
            onClick={() => setActiveTab('naughty')}
          >
            Blocked Customers ({naughtyList.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'noshows' ? 'active' : ''}`}
            onClick={() => setActiveTab('noshows')}
          >
            No-Show History ({noShowIncidents.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      {message && (
        <div className="message-box">
          {message}
          <button onClick={() => setMessage('')} className="message-close">×</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          {activeTab === 'naughty' && (
            <div className="naughty-tab">
              <div className="actions-bar">
                <button 
                  className="block-customer-btn"
                  onClick={() => setShowBlockModal(true)}
                >
                  + Block Customer Manually
                </button>
                <div className="stats">
                  {naughtyList.length} blocked customer{naughtyList.length !== 1 ? 's' : ''}
                </div>
              </div>

              {naughtyList.length === 0 ? (
                <div className="no-entries">
                  <p>No blocked customers</p>
                  <p>Customers will be automatically blocked after {settings.noShowThreshold} no-shows.</p>
                </div>
              ) : (
                <div className="entries-list">
                  {naughtyList.map(entry => (
                    <div key={entry.id} className="entry-card">
                      <div className="entry-header">
                        <h4>{entry.customerName}</h4>
                        <span className={`entry-badge ${entry.isAutomatic ? 'automatic' : 'manual'}`}>
                          {entry.isAutomatic ? '🤖 Auto-blocked' : '👤 Manual'}
                        </span>
                      </div>
                      
                      <div className="entry-details">
                        <div className="contact-info">
                          <span>📧 {entry.blockedEmail}</span>
                          <span>📱 {entry.blockedPhone}</span>
                        </div>
                        
                        <div className="block-info">
                          <div className="reason">
                            <strong>Reason:</strong> {getReasonDisplay(entry.reason)}
                          </div>
                          {entry.reason === 'excessive_noshows' && (
                            <div className="noshow-count">
                              <strong>No-shows:</strong> {entry.noShowCount}
                            </div>
                          )}
                          {entry.notes && (
                            <div className="notes">
                              <strong>Notes:</strong> {entry.notes}
                            </div>
                          )}
                          <div className="blocked-info">
                            Blocked by {entry.blockedBy} on {formatDate(entry.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="entry-actions">
                        <button 
                          className="unblock-btn"
                          onClick={() => unblockCustomer(entry.id)}
                          disabled={actionLoading}
                        >
                          Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'noshows' && (
            <div className="noshows-tab">
              <div className="tab-info">
                <p>Track and manage no-show incidents. Customers are automatically blocked after {settings.noShowThreshold} no-shows.</p>
              </div>

              {noShowIncidents.length === 0 ? (
                <div className="no-entries">
                  <p>No no-show incidents recorded</p>
                </div>
              ) : (
                <div className="incidents-list">
                  {noShowIncidents.map(incident => {
                    const customerNoShows = getNoShowCountForCustomer(incident.customerEmail, incident.customerPhone);
                    const isBlocked = naughtyList.some(entry => 
                      entry.blockedEmail === incident.customerEmail || entry.blockedPhone === incident.customerPhone
                    );
                    
                    return (
                      <div key={incident.id} className="incident-card">
                        <div className="incident-header">
                          <h4>{incident.customerName}</h4>
                          <span className="incident-date">{formatDate(incident.appointmentDate)}</span>
                        </div>
                        
                        <div className="incident-details">
                          <div className="service-info">
                            <strong>{incident.serviceName}</strong>
                          </div>
                          <div className="contact-info">
                            <span>📧 {incident.customerEmail}</span>
                            <span>📱 {incident.customerPhone}</span>
                          </div>
                          {incident.notes && (
                            <div className="notes">
                              <strong>Notes:</strong> {incident.notes}
                            </div>
                          )}
                          <div className="marked-info">
                            Marked by {incident.markedBy} on {formatDate(incident.createdAt)}
                          </div>
                        </div>
                        
                        <div className="incident-actions">
                          <div className="noshow-count-display">
                            Total no-shows: <strong>{customerNoShows}</strong>
                            {customerNoShows >= settings.noShowThreshold && (
                              <span className="threshold-warning">⚠️ Threshold reached</span>
                            )}
                          </div>
                          {!isBlocked && (
                            <button 
                              className="block-btn"
                              onClick={() => handleBlockFromIncident(incident)}
                            >
                              Block Customer
                            </button>
                          )}
                          {isBlocked && (
                            <span className="blocked-indicator">🚫 Blocked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-section">
                <h3>No-Show Settings</h3>
                
                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.enableNaughtyList}
                      onChange={(e) => updateSettings({ enableNaughtyList: e.target.checked })}
                      disabled={actionLoading}
                    />
                    Enable Automatic Blocking
                  </label>
                  <p className="setting-description">
                    Automatically block customers who exceed the no-show threshold
                  </p>
                </div>
                
                <div className="setting-item">
                  <label className="setting-label">
                    No-Show Threshold: {settings.noShowThreshold}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.noShowThreshold}
                    onChange={(e) => updateSettings({ noShowThreshold: parseInt(e.target.value) })}
                    disabled={actionLoading}
                    className="threshold-slider"
                  />
                  <p className="setting-description">
                    Block customers after this many no-shows
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Block Customer Modal */}
      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Block Customer</h3>
              <button className="close-btn" onClick={() => setShowBlockModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="block-form">
                <div className="form-group">
                  <label>Customer Name:</label>
                  <input
                    type="text"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    placeholder="Customer full name"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={blockEmail}
                    onChange={(e) => setBlockEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone:</label>
                  <input
                    type="tel"
                    value={blockPhone}
                    onChange={(e) => setBlockPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Reason:</label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select reason...</option>
                    <option value="excessive_noshows">Excessive No-Shows</option>
                    <option value="inappropriate_behavior">Inappropriate Behavior</option>
                    <option value="payment_issues">Payment Issues</option>
                    <option value="manual_block">Manual Block</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Notes (optional):</label>
                  <textarea
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    placeholder="Additional notes about why this customer is being blocked..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowBlockModal(false);
                      resetBlockForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => blockCustomer(blockEmail, blockPhone, blockName, blockReason, blockNotes)}
                    disabled={actionLoading || !blockEmail || !blockPhone || !blockName || !blockReason}
                  >
                    {actionLoading ? 'Blocking...' : 'Block Customer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .naughty-list-container {
          background: white;
          border: 2px solid #8b7355;
          padding: 30px;
        }

        .naughty-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .naughty-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }

        .tab-controls {
          display: flex;
          gap: 5px;
        }

        .tab-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid #8b7355;
          color: #666;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          border-color: #c41e3a;
          color: #c41e3a;
        }

        .tab-btn.active {
          background: #c41e3a;
          border-color: #c41e3a;
          color: white;
        }

        .message-box {
          padding: 12px 15px;
          background: #e8f5e9;
          border: 1px solid #4caf50;
          color: #2e7d32;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 4px;
        }

        .message-close {
          background: none;
          border: none;
          color: #2e7d32;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .block-customer-btn {
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .block-customer-btn:hover {
          background: #d32f2f;
        }

        .stats {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .no-entries {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .no-entries p {
          margin: 10px 0;
        }

        .entries-list, .incidents-list {
          display: grid;
          gap: 15px;
        }

        .entry-card, .incident-card {
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          transition: border-color 0.2s;
        }

        .entry-card:hover, .incident-card:hover {
          border-color: #8b7355;
        }

        .entry-header, .incident-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .entry-header h4, .incident-header h4 {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0;
        }

        .entry-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .entry-badge.automatic {
          background: #ff5722;
          color: white;
        }

        .entry-badge.manual {
          background: #2196f3;
          color: white;
        }

        .incident-date {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .entry-details, .incident-details {
          margin-bottom: 15px;
        }

        .contact-info {
          display: flex;
          gap: 20px;
          margin: 8px 0;
          font-size: 13px;
          color: #666;
        }

        .service-info {
          margin-bottom: 8px;
          color: #2c2c2c;
        }

        .block-info > div, .notes {
          margin: 8px 0;
          font-size: 14px;
        }

        .blocked-info, .marked-info {
          font-size: 12px;
          color: #999;
        }

        .entry-actions, .incident-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .unblock-btn, .block-btn {
          background: #4caf50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .unblock-btn:hover:not(:disabled), .block-btn:hover {
          background: #45a049;
        }

        .unblock-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .block-btn {
          background: #f44336;
        }

        .block-btn:hover {
          background: #d32f2f;
        }

        .noshow-count-display {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .threshold-warning {
          background: #ff9800;
          color: white;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .blocked-indicator {
          font-size: 14px;
          color: #f44336;
          font-weight: 500;
        }

        .tab-info {
          background: #e3f2fd;
          padding: 15px;
          border-left: 4px solid #2196f3;
          margin-bottom: 20px;
        }

        .tab-info p {
          margin: 0;
          color: #1976d2;
        }

        .settings-section {
          max-width: 500px;
        }

        .settings-section h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #2c2c2c;
          margin-bottom: 20px;
        }

        .setting-item {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          color: #2c2c2c;
          margin-bottom: 8px;
          cursor: pointer;
        }

        .setting-description {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .threshold-slider {
          width: 100%;
          margin: 10px 0;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border: 3px solid #8b7355;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 2px solid #f0f0f0;
          background: #f8f8f8;
        }

        .modal-header h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
        }

        .close-btn:hover {
          color: #c41e3a;
        }

        .modal-body {
          padding: 30px;
        }

        .block-form {
          display: grid;
          gap: 20px;
        }

        .form-group {
          display: grid;
          gap: 8px;
        }

        .form-group label {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input, .form-select, .form-textarea {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #8b7355;
        }

        .form-textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-secondary, .btn-danger {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: transparent;
          color: #666;
          border: 2px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #f0f0f0;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #d32f2f;
        }

        .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .naughty-header {
            flex-direction: column;
            align-items: stretch;
          }

          .tab-controls {
            flex-wrap: wrap;
          }

          .tab-btn {
            flex: 1;
            min-width: 0;
            font-size: 12px;
            padding: 8px 12px;
          }

          .actions-bar {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
            text-align: center;
          }

          .contact-info {
            flex-direction: column;
            gap: 8px;
          }

          .entry-actions, .incident-actions {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
          }

          .noshow-count-display {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}