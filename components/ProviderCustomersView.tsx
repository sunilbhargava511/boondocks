'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/lib/types';

interface ProviderCustomersViewProps {
  providerId: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ProviderCustomersView({ providerId }: ProviderCustomersViewProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  useEffect(() => {
    loadCustomers();
  }, [providerId, pagination.page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadCustomers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadCustomers = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        providerId,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(`/api/customers/provider?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setCustomers(data.customers);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to load customers');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to load customers. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const formatLastVisit = (lastVisit: string | null) => {
    if (!lastVisit) return 'No visits yet';
    return new Date(lastVisit).toLocaleDateString();
  };

  return (
    <div className="provider-customers-view">
      <div className="customers-header">
        <h3>My Customers</h3>
        <div className="customers-search">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button 
            onClick={() => setMessage({ type: '', text: '' })}
            className="close-message"
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading your customers...</div>
      ) : customers.length === 0 ? (
        <div className="no-customers">
          {searchQuery 
            ? `No customers found matching "${searchQuery}"`
            : "No customers found. Customers appear here after having appointments with you in the last 3 months."
          }
        </div>
      ) : (
        <>
          <div className="customers-table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Last Visit</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="customer-row">
                    <td className="customer-name">
                      <div>
                        <div className="name">{customer.firstName} {customer.lastName}</div>
                        {customer.noShowCount > 0 && (
                          <div className="warning-text">No-shows: {customer.noShowCount}</div>
                        )}
                      </div>
                    </td>
                    <td className="customer-contact">
                      <div>{customer.email}</div>
                      <div className="phone">{customer.phone}</div>
                    </td>
                    <td className="last-visit">
                      {formatLastVisit(customer.lastVisit)}
                    </td>
                    <td className="total-spent">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="status">
                      <span className={`status-badge ${customer.accountStatus}`}>
                        {customer.accountStatus}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => handleCustomerSelect(customer)}
                        className="view-button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                className="page-button"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.totalCount} customers)
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="page-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="close-modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="customer-details">
                <div className="detail-row">
                  <strong>Email:</strong> {selectedCustomer.email}
                </div>
                <div className="detail-row">
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </div>
                <div className="detail-row">
                  <strong>Account Status:</strong> 
                  <span className={`status-badge ${selectedCustomer.accountStatus}`}>
                    {selectedCustomer.accountStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Total Spent:</strong> ${selectedCustomer.totalSpent.toFixed(2)}
                </div>
                <div className="detail-row">
                  <strong>Loyalty Points:</strong> {selectedCustomer.loyaltyPoints}
                </div>
                <div className="detail-row">
                  <strong>Last Visit:</strong> {formatLastVisit(selectedCustomer.lastVisit)}
                </div>
                {selectedCustomer.noShowCount > 0 && (
                  <div className="detail-row warning">
                    <strong>No-Shows:</strong> {selectedCustomer.noShowCount}
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div className="detail-row">
                    <strong>Notes:</strong>
                    <div className="notes">{selectedCustomer.notes}</div>
                  </div>
                )}
              </div>

              {selectedCustomer.appointments && selectedCustomer.appointments.length > 0 && (
                <div className="recent-appointments">
                  <h4>Recent Appointments</h4>
                  <div className="appointments-list">
                    {selectedCustomer.appointments.slice(0, 5).map((appointment: any) => (
                      <div key={appointment.id} className="appointment-item">
                        <div className="appointment-date">
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="appointment-service">
                          {appointment.serviceName}
                        </div>
                        <div className={`appointment-status ${appointment.status}`}>
                          {appointment.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .provider-customers-view {
          padding: 20px 0;
        }

        .customers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .customers-header h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          margin: 0;
          color: #2c2c2c;
        }

        .customers-search {
          flex: 1;
          max-width: 400px;
          margin-left: 20px;
        }

        .search-input {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b7355;
        }

        .message {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .message.success { background: #c8e6c9; color: #2e7d32; }
        .message.error { background: #ffcdd2; color: #c62828; }

        .close-message {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
        }

        .loading, .no-customers {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 16px;
        }

        .customers-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .customers-table {
          width: 100%;
          border-collapse: collapse;
        }

        .customers-table th,
        .customers-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .customers-table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .customer-row:hover {
          background: #f5f5f5;
        }

        .customer-name .name {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .warning-text {
          font-size: 12px;
          color: #f44336;
          font-weight: 600;
        }

        .customer-contact {
          font-size: 14px;
        }

        .customer-contact .phone {
          color: #666;
          font-size: 13px;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.active { background: #c8e6c9; color: #2e7d32; }
        .status-badge.suspended { background: #ffecb3; color: #f57c00; }
        .status-badge.blocked { background: #ffcdd2; color: #c62828; }

        .view-button {
          padding: 6px 12px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .view-button:hover {
          background: #1976d2;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 15px 0;
        }

        .page-button {
          padding: 8px 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-button:hover:not(:disabled) {
          background: #1976d2;
        }

        .page-info {
          font-size: 14px;
          color: #666;
        }

        .modal-overlay {
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
        }

        .modal {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h3 {
          margin: 0;
          font-family: 'Oswald', sans-serif;
        }

        .close-modal {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .modal-content {
          padding: 20px;
        }

        .customer-details {
          margin-bottom: 20px;
        }

        .detail-row {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-row.warning {
          color: #f44336;
          font-weight: 600;
        }

        .notes {
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          margin-top: 5px;
          width: 100%;
        }

        .recent-appointments h4 {
          font-family: 'Oswald', sans-serif;
          margin-bottom: 10px;
        }

        .appointment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .appointment-date {
          font-size: 14px;
          color: #666;
        }

        .appointment-service {
          font-weight: 600;
        }

        .appointment-status {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .appointment-status.completed { background: #c8e6c9; color: #2e7d32; }
        .appointment-status.confirmed { background: #e3f2fd; color: #1565c0; }
        .appointment-status.cancelled { background: #ffcdd2; color: #c62828; }
        .appointment-status.no_show { background: #ffcdd2; color: #c62828; }

        @media (max-width: 768px) {
          .customers-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .customers-search {
            margin-left: 0;
            max-width: none;
          }

          .customers-table-container {
            overflow-x: auto;
          }

          .customers-table {
            min-width: 600px;
          }

          .pagination {
            flex-direction: column;
            gap: 10px;
          }

          .modal {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
}