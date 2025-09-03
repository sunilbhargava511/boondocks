'use client';

import React, { useState, useEffect } from 'react';

interface ProviderCustomerApprovalsProps {
  provider: any;
}

interface CustomerApproval {
  id: string;
  customerId: string;
  status: 'approved' | 'pending' | 'rejected';
  notes?: string;
  approvedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalSpent: number;
  lastVisit?: string;
}

export default function ProviderCustomerApprovals({ provider }: ProviderCustomerApprovalsProps) {
  const [isSelective, setIsSelective] = useState(false);
  const [approvedCustomers, setApprovedCustomers] = useState<CustomerApproval[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
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
      
      // Load provider settings and approved customers
      const [settingsResponse, approvalsResponse] = await Promise.all([
        fetch('/api/providers/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/providers/customer-approvals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setIsSelective(settingsData.isSelective || false);
      }

      if (approvalsResponse.ok) {
        const approvalsData = await approvalsResponse.json();
        setApprovedCustomers(approvalsData.approvals || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage('Failed to load customer approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAllCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const toggleSelectivity = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isSelective: !isSelective })
      });

      if (response.ok) {
        setIsSelective(!isSelective);
        setMessage(!isSelective ? 
          'Selective mode enabled. Only approved customers can book with you.' : 
          'Selective mode disabled. All customers can book with you.'
        );
      } else {
        setMessage('Failed to update selectivity settings');
      }
    } catch (error) {
      setMessage('Failed to update settings');
    } finally {
      setActionLoading(false);
    }
  };

  const approveCustomer = async (customer: Customer, notes: string = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/customer-approvals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: customer.id,
          status: 'approved',
          notes
        })
      });

      if (response.ok) {
        setMessage(`${customer.firstName} ${customer.lastName} has been approved`);
        loadData();
        setShowAddCustomer(false);
        setSelectedCustomer(null);
        setApprovalNotes('');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to approve customer');
      }
    } catch (error) {
      setMessage('Failed to approve customer');
    } finally {
      setActionLoading(false);
    }
  };

  const removeApproval = async (approvalId: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch(`/api/providers/customer-approvals/${approvalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('Customer approval removed');
        loadData();
      } else {
        setMessage('Failed to remove approval');
      }
    } catch (error) {
      setMessage('Failed to remove approval');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCustomers = allCustomers.filter(customer => 
    `${customer.firstName} ${customer.lastName} ${customer.email}`.toLowerCase()
      .includes(searchTerm.toLowerCase()) &&
    !approvedCustomers.some(approval => approval.customerId === customer.id)
  );

  return (
    <div className="customer-approvals-container">
      <div className="approvals-header">
        <h2>Customer Approval Management</h2>
        <div className="selectivity-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isSelective}
              onChange={toggleSelectivity}
              disabled={actionLoading}
              className="toggle-checkbox"
            />
            <span className="toggle-slider"></span>
            Selective Booking
          </label>
          <p className="toggle-description">
            {isSelective ? 
              "Only approved customers can book with you" : 
              "All customers can book with you"
            }
          </p>
        </div>
      </div>

      {message && (
        <div className="message-box">
          {message}
          <button onClick={() => setMessage('')} className="message-close">×</button>
        </div>
      )}

      {isSelective && (
        <>
          <div className="actions-bar">
            <button 
              className="add-customer-btn"
              onClick={() => {
                setShowAddCustomer(true);
                loadCustomers();
              }}
            >
              + Approve New Customer
            </button>
            <div className="approved-count">
              {approvedCustomers.length} approved customer{approvedCustomers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {isLoading ? (
            <div className="loading">Loading approved customers...</div>
          ) : approvedCustomers.length === 0 ? (
            <div className="no-approvals">
              <p>No customers approved yet</p>
              <p>Click "Approve New Customer" to start adding customers to your approved list.</p>
            </div>
          ) : (
            <div className="approvals-list">
              {approvedCustomers.map(approval => (
                <div key={approval.id} className="approval-card">
                  <div className="customer-info">
                    <h4>{approval.customer.firstName} {approval.customer.lastName}</h4>
                    <div className="contact-details">
                      <span>📧 {approval.customer.email}</span>
                      <span>📱 {approval.customer.phone}</span>
                    </div>
                    {approval.notes && (
                      <div className="approval-notes">
                        <strong>Notes:</strong> {approval.notes}
                      </div>
                    )}
                    <div className="approval-date">
                      Approved: {new Date(approval.approvedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="approval-actions">
                    <button 
                      className="remove-btn"
                      onClick={() => removeApproval(approval.id)}
                      disabled={actionLoading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve New Customer</h3>
              <button className="close-btn" onClick={() => setShowAddCustomer(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="customer-search">
                <input
                  type="text"
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="customers-list">
                {filteredCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    className={`customer-item ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="customer-details">
                      <strong>{customer.firstName} {customer.lastName}</strong>
                      <span>{customer.email}</span>
                      <span>{customer.phone}</span>
                      <div className="customer-stats">
                        Total spent: ${customer.totalSpent} | 
                        Last visit: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCustomer && (
                <div className="approval-form">
                  <h4>Approving: {selectedCustomer.firstName} {selectedCustomer.lastName}</h4>
                  <textarea
                    placeholder="Optional notes about this customer..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="notes-textarea"
                  />
                  <div className="form-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setApprovalNotes('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => approveCustomer(selectedCustomer, approvalNotes)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Approving...' : 'Approve Customer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .customer-approvals-container {
          background: white;
          border: 2px solid #8b7355;
          padding: 30px;
        }

        .approvals-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .approvals-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }

        .selectivity-toggle {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          gap: 10px;
        }

        .toggle-checkbox {
          display: none;
        }

        .toggle-slider {
          width: 50px;
          height: 24px;
          background: #ccc;
          border-radius: 12px;
          position: relative;
          transition: background 0.3s;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }

        .toggle-checkbox:checked + .toggle-slider {
          background: #4caf50;
        }

        .toggle-checkbox:checked + .toggle-slider::before {
          transform: translateX(26px);
        }

        .toggle-description {
          font-size: 12px;
          color: #666;
          margin: 0;
          text-align: right;
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

        .actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .add-customer-btn {
          background: #4caf50;
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

        .add-customer-btn:hover {
          background: #45a049;
        }

        .approved-count {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-approvals {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .no-approvals p {
          margin: 10px 0;
        }

        .approvals-list {
          display: grid;
          gap: 15px;
        }

        .approval-card {
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: border-color 0.2s;
        }

        .approval-card:hover {
          border-color: #8b7355;
        }

        .customer-info h4 {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 8px 0;
        }

        .contact-details {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 13px;
          color: #666;
        }

        .approval-notes {
          background: white;
          padding: 8px;
          border-left: 3px solid #8b7355;
          font-size: 13px;
          margin: 10px 0;
        }

        .approval-date {
          font-size: 12px;
          color: #999;
        }

        .remove-btn {
          background: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .remove-btn:hover:not(:disabled) {
          background: #d32f2f;
        }

        .remove-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          max-width: 600px;
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
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #c41e3a;
        }

        .modal-body {
          padding: 30px;
        }

        .search-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b7355;
        }

        .customers-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
        }

        .customer-item {
          padding: 15px;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          transition: background 0.2s;
        }

        .customer-item:hover {
          background: #f0f0f0;
        }

        .customer-item.selected {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
        }

        .customer-item:last-child {
          border-bottom: none;
        }

        .customer-details strong {
          display: block;
          margin-bottom: 4px;
          color: #2c2c2c;
        }

        .customer-details span {
          display: block;
          font-size: 13px;
          color: #666;
          margin-bottom: 2px;
        }

        .customer-stats {
          font-size: 12px;
          color: #999;
          margin-top: 5px;
        }

        .approval-form {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }

        .approval-form h4 {
          font-family: 'Oswald', sans-serif;
          color: #2c2c2c;
          margin-bottom: 10px;
        }

        .notes-textarea {
          width: 100%;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 15px;
        }

        .notes-textarea:focus {
          outline: none;
          border-color: #8b7355;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn-primary, .btn-secondary {
          padding: 10px 20px;
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

        .btn-primary {
          background: #8b7355;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #6d5a42;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          color: #666;
          border: 2px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #f0f0f0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .approvals-header {
            flex-direction: column;
            align-items: stretch;
          }

          .selectivity-toggle {
            align-items: flex-start;
          }

          .actions-bar {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
            text-align: center;
          }

          .contact-details {
            flex-direction: column;
            gap: 5px;
          }

          .approval-card {
            flex-direction: column;
            gap: 15px;
          }

          .approval-actions {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}