'use client';

import React, { useState, useEffect } from 'react';
import { Customer, Appointment } from '@/lib/types';

interface CustomerProfileProps {
  customer: Customer;
  onUpdate: (customer: Customer) => void;
  onClose: () => void;
}

interface ProfileState {
  editMode: boolean;
  formData: Partial<Customer>;
  newTag: string;
  isLoading: boolean;
  isSaving: boolean;
  message: { type: 'success' | 'error' | ''; text: string };
}

export default function CustomerProfile({ customer, onUpdate, onClose }: CustomerProfileProps) {
  const [state, setState] = useState<ProfileState>({
    editMode: false,
    formData: { ...customer },
    newTag: '',
    isLoading: false,
    isSaving: false,
    message: { type: '', text: '' },
  });

  const handleSave = async () => {
    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.formData),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.customer);
        setState(prev => ({
          ...prev,
          editMode: false,
          isSaving: false,
          message: { type: 'success', text: 'Customer updated successfully' },
        }));
      } else {
        throw new Error('Failed to update customer');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        message: { type: 'error', text: 'Failed to update customer' },
      }));
    }
  };

  const handleAddTag = async () => {
    if (!state.newTag.trim()) return;

    try {
      const response = await fetch('/api/customers/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          tags: [state.newTag.trim()],
        }),
      });

      if (response.ok) {
        // Refresh customer data
        const customerResponse = await fetch(`/api/customers/${customer.id}`);
        if (customerResponse.ok) {
          const data = await customerResponse.json();
          onUpdate(data.customer);
          setState(prev => ({
            ...prev,
            newTag: '',
            message: { type: 'success', text: 'Tag added successfully' },
          }));
        }
      } else {
        throw new Error('Failed to add tag');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: { type: 'error', text: 'Failed to add tag' },
      }));
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      const response = await fetch(`/api/customers/tags?customerId=${customer.id}&tagName=${encodeURIComponent(tagName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh customer data
        const customerResponse = await fetch(`/api/customers/${customer.id}`);
        if (customerResponse.ok) {
          const data = await customerResponse.json();
          onUpdate(data.customer);
          setState(prev => ({
            ...prev,
            message: { type: 'success', text: 'Tag removed successfully' },
          }));
        }
      } else {
        throw new Error('Failed to remove tag');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: { type: 'error', text: 'Failed to remove tag' },
      }));
    }
  };

  const syncWithSimplyBook = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id }),
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          message: { type: 'success', text: 'Customer synced with SimplyBook successfully' },
        }));
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        message: { type: 'error', text: 'Failed to sync with SimplyBook' },
      }));
    }
  };

  return (
    <div className="customer-profile-overlay" onClick={onClose}>
      <div className="customer-profile" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-title">
            <h2>{customer.firstName} {customer.lastName}</h2>
            <div className={`customer-status ${customer.accountStatus}`}>
              {customer.accountStatus}
            </div>
          </div>
          <div className="profile-actions">
            {!state.editMode ? (
              <button 
                onClick={() => setState(prev => ({ ...prev, editMode: true, formData: { ...customer } }))}
                className="edit-button"
              >
                Edit
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  onClick={() => setState(prev => ({ ...prev, editMode: false, formData: { ...customer } }))}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={state.isSaving}
                  className="save-button"
                >
                  {state.isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>

        {state.message.text && (
          <div className={`message ${state.message.type}`}>
            {state.message.text}
            <button 
              onClick={() => setState(prev => ({ ...prev, message: { type: '', text: '' } }))}
              className="close-message"
            >
              ×
            </button>
          </div>
        )}

        <div className="profile-content">
          <div className="profile-sections">
            {/* Basic Information */}
            <div className="profile-section">
              <h3>Basic Information</h3>
              <div className="profile-grid">
                <div className="profile-field">
                  <label>First Name</label>
                  {state.editMode ? (
                    <input
                      type="text"
                      value={state.formData.firstName || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, firstName: e.target.value }
                      }))}
                    />
                  ) : (
                    <span>{customer.firstName}</span>
                  )}
                </div>

                <div className="profile-field">
                  <label>Last Name</label>
                  {state.editMode ? (
                    <input
                      type="text"
                      value={state.formData.lastName || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, lastName: e.target.value }
                      }))}
                    />
                  ) : (
                    <span>{customer.lastName}</span>
                  )}
                </div>

                <div className="profile-field">
                  <label>Email</label>
                  {state.editMode ? (
                    <input
                      type="email"
                      value={state.formData.email || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, email: e.target.value }
                      }))}
                    />
                  ) : (
                    <span>{customer.email}</span>
                  )}
                </div>

                <div className="profile-field">
                  <label>Phone</label>
                  {state.editMode ? (
                    <input
                      type="tel"
                      value={state.formData.phone || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, phone: e.target.value }
                      }))}
                    />
                  ) : (
                    <span>{customer.phone}</span>
                  )}
                </div>

                <div className="profile-field">
                  <label>Date of Birth</label>
                  {state.editMode ? (
                    <input
                      type="date"
                      value={state.formData.dateOfBirth ? new Date(state.formData.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, dateOfBirth: e.target.value ? new Date(e.target.value) : undefined }
                      }))}
                    />
                  ) : (
                    <span>{customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                  )}
                </div>

                <div className="profile-field">
                  <label>Account Status</label>
                  {state.editMode ? (
                    <select
                      value={state.formData.accountStatus || 'active'}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, accountStatus: e.target.value as 'active' | 'suspended' | 'blocked' }
                      }))}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  ) : (
                    <span className={`status-badge ${customer.accountStatus}`}>
                      {customer.accountStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Metrics */}
            <div className="profile-section">
              <h3>Customer Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{customer.noShowCount}</div>
                  <div className="metric-label">No-Shows</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{customer.cancellationCount}</div>
                  <div className="metric-label">Cancellations</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="profile-section">
              <h3>Notes</h3>
              {state.editMode ? (
                <textarea
                  value={state.formData.notes || ''}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    formData: { ...prev.formData, notes: e.target.value }
                  }))}
                  rows={3}
                  placeholder="Add customer notes..."
                />
              ) : (
                <div className="notes-display">
                  {customer.notes || 'No notes available'}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="profile-section">
              <h3>Tags</h3>
              <div className="tags-container">
                <div className="tags-list">
                  {customer.tags && customer.tags.map((tag: any, index: number) => (
                    <span key={index} className="customer-tag">
                      {tag.tagName}
                      <button 
                        onClick={() => handleRemoveTag(tag.tagName)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-tag-form">
                  <input
                    type="text"
                    value={state.newTag}
                    onChange={(e) => setState(prev => ({ ...prev, newTag: e.target.value }))}
                    placeholder="Add new tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button onClick={handleAddTag} disabled={!state.newTag.trim()}>
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Consent & Preferences */}
            <div className="profile-section">
              <h3>Consent & Preferences</h3>
              <div className="consent-grid">
                <div className="consent-item">
                  <label>Marketing Consent</label>
                  {state.editMode ? (
                    <input
                      type="checkbox"
                      checked={state.formData.marketingConsent || false}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, marketingConsent: e.target.checked }
                      }))}
                    />
                  ) : (
                    <span className={customer.marketingConsent ? 'consent-yes' : 'consent-no'}>
                      {customer.marketingConsent ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>

                <div className="consent-item">
                  <label>SMS Consent</label>
                  {state.editMode ? (
                    <input
                      type="checkbox"
                      checked={state.formData.smsConsent || false}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, smsConsent: e.target.checked }
                      }))}
                    />
                  ) : (
                    <span className={customer.smsConsent ? 'consent-yes' : 'consent-no'}>
                      {customer.smsConsent ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>

                <div className="consent-item">
                  <label>Email Consent</label>
                  {state.editMode ? (
                    <input
                      type="checkbox"
                      checked={state.formData.emailConsent !== false}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, emailConsent: e.target.checked }
                      }))}
                    />
                  ) : (
                    <span className={customer.emailConsent ? 'consent-yes' : 'consent-no'}>
                      {customer.emailConsent ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>

                <div className="consent-item">
                  <label>Conversation Level</label>
                  {state.editMode ? (
                    <select
                      value={state.formData.conversationPreference || 2}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, conversationPreference: parseInt(e.target.value) }
                      }))}
                    >
                      <option value={0}>Silent (0)</option>
                      <option value={1}>Minimal (1)</option>
                      <option value={2}>Normal (2)</option>
                      <option value={3}>Chatty (3)</option>
                    </select>
                  ) : (
                    <span>
                      {customer.conversationPreference === 0 ? 'Silent' :
                       customer.conversationPreference === 1 ? 'Minimal' :
                       customer.conversationPreference === 2 ? 'Normal' : 'Chatty'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="profile-section">
              <h3>Recent Appointments</h3>
              <div className="appointments-list">
                {customer.appointments && customer.appointments.length > 0 ? (
                  customer.appointments.slice(0, 5).map((appointment: any, index: number) => (
                    <div key={index} className="appointment-item">
                      <div className="appointment-info">
                        <div className="appointment-service">{appointment.serviceName}</div>
                        <div className="appointment-provider">with {appointment.providerName}</div>
                        <div className="appointment-date">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                          {new Date(appointment.appointmentDate).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className={`appointment-status ${appointment.status}`}>
                        {appointment.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-appointments">No appointments found</div>
                )}
              </div>
            </div>

            {/* Sync Status */}
            <div className="profile-section">
              <h3>SimplyBook Integration</h3>
              <div className="sync-info">
                <div className="sync-status">
                  <span>Status: </span>
                  <span className={`sync-badge ${customer.syncStatus}`}>
                    {customer.syncStatus}
                  </span>
                </div>
                {customer.simplybookId && (
                  <div className="simplybook-id">
                    <span>SimplyBook ID: </span>
                    <span>{customer.simplybookId}</span>
                  </div>
                )}
                <button 
                  onClick={syncWithSimplyBook}
                  disabled={state.isLoading}
                  className="sync-button"
                >
                  {state.isLoading ? 'Syncing...' : 'Sync with SimplyBook'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .customer-profile-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .customer-profile {
            background: white;
            border-radius: 8px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            background: #f9f9f9;
          }

          .profile-title {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .profile-title h2 {
            margin: 0;
            font-family: 'Oswald', sans-serif;
            font-size: 24px;
          }

          .profile-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .edit-actions {
            display: flex;
            gap: 10px;
          }

          .edit-button, .save-button, .sync-button {
            padding: 8px 16px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
          }

          .cancel-button {
            padding: 8px 16px;
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
          }

          .message {
            margin: 15px 20px;
            padding: 10px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .message.success { background: #c8e6c9; color: #2e7d32; }
          .message.error { background: #ffcdd2; color: #c62828; }

          .close-message {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
          }

          .profile-content {
            padding: 20px;
          }

          .profile-sections {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .profile-section {
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 20px;
          }

          .profile-section h3 {
            margin: 0 0 15px 0;
            font-family: 'Oswald', sans-serif;
            color: #333;
            font-size: 18px;
          }

          .profile-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }

          .profile-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .profile-field label {
            font-weight: 600;
            color: #666;
            font-size: 14px;
          }

          .profile-field input, .profile-field select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }

          .profile-field span {
            padding: 8px 0;
            font-size: 14px;
          }

          .customer-status, .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            display: inline-block;
          }

          .customer-status.active, .status-badge.active { 
            background: #c8e6c9; color: #2e7d32; 
          }
          .customer-status.suspended, .status-badge.suspended { 
            background: #ffecb3; color: #f57c00; 
          }
          .customer-status.blocked, .status-badge.blocked { 
            background: #ffcdd2; color: #c62828; 
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
          }

          .metric-card {
            text-align: center;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 6px;
          }

          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: #333;
          }

          .metric-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }

          .notes-display {
            padding: 10px;
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-style: italic;
            color: #666;
            min-height: 40px;
          }

          textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
          }

          .tags-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .tags-list {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .customer-tag {
            padding: 6px 12px;
            background: #e3f2fd;
            color: #1565c0;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .remove-tag {
            background: none;
            border: none;
            color: #1565c0;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
          }

          .add-tag-form {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .add-tag-form input {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          .add-tag-form button {
            padding: 6px 12px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }

          .add-tag-form button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .consent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }

          .consent-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
          }

          .consent-item label {
            font-weight: 600;
            color: #666;
          }

          .consent-yes { color: #4caf50; font-weight: 600; }
          .consent-no { color: #f44336; font-weight: 600; }

          .appointments-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .appointment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }

          .appointment-info {
            flex: 1;
          }

          .appointment-service {
            font-weight: 600;
            color: #333;
          }

          .appointment-provider, .appointment-date {
            font-size: 13px;
            color: #666;
          }

          .appointment-status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .appointment-status.confirmed { background: #c8e6c9; color: #2e7d32; }
          .appointment-status.completed { background: #e8f5e8; color: #2e7d32; }
          .appointment-status.cancelled { background: #ffcdd2; color: #c62828; }
          .appointment-status.no_show { background: #ffecb3; color: #f57c00; }

          .no-appointments {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
          }

          .sync-info {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .sync-status, .simplybook-id {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .sync-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .sync-badge.synced { background: #c8e6c9; color: #2e7d32; }
          .sync-badge.pending_sync, .sync-badge.pending_simplybook_creation { 
            background: #ffecb3; color: #f57c00; 
          }
          .sync-badge.error { background: #ffcdd2; color: #c62828; }

          .sync-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .customer-profile-overlay {
              padding: 10px;
            }

            .customer-profile {
              max-height: 95vh;
            }

            .profile-header {
              flex-direction: column;
              gap: 15px;
              align-items: stretch;
            }

            .profile-title {
              justify-content: center;
            }

            .profile-actions {
              justify-content: center;
            }

            .profile-grid {
              grid-template-columns: 1fr;
            }

            .metrics-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .consent-grid {
              grid-template-columns: 1fr;
            }

            .appointment-item {
              flex-direction: column;
              align-items: stretch;
              gap: 10px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}