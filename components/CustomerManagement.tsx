'use client';

import React, { useState, useEffect } from 'react';
import { Customer, CustomerExportOptions } from '@/lib/types';
import CustomerProfile from './CustomerProfile';

interface CustomerManagementState {
  customers: Customer[];
  searchQuery: string;
  selectedCustomer: Customer | null;
  isLoading: boolean;
  importProgress: any;
  exportOptions: CustomerExportOptions;
  filters: {
    accountStatus: string[];
    minLoyaltyPoints: number;
    noShowThreshold: number;
    tags: string[];
  };
  showImportDialog: boolean;
  showExportDialog: boolean;
  importFile: File | null;
  importMapping: { [key: string]: string };
  message: { type: 'success' | 'error' | ''; text: string };
}

export default function CustomerManagement() {
  const [state, setState] = useState<CustomerManagementState>({
    customers: [],
    searchQuery: '',
    selectedCustomer: null,
    isLoading: true,
    importProgress: null,
    exportOptions: {
      format: 'csv',
      includePreferences: true,
      includeTags: true,
      includeAppointments: false,
    },
    filters: {
      accountStatus: [],
      minLoyaltyPoints: 0,
      noShowThreshold: 0,
      tags: [],
    },
    showImportDialog: false,
    showExportDialog: false,
    importFile: null,
    importMapping: {},
    message: { type: '', text: '' },
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25, // Smaller page size for performance
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table for better performance

  useEffect(() => {
    loadCustomers();
  }, [pagination.page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.searchQuery.length >= 2 || state.searchQuery.length === 0) {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadCustomers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.searchQuery, state.filters]);

  const loadCustomers = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (state.searchQuery) {
        params.append('q', state.searchQuery);
      }
      
      if (state.filters?.accountStatus?.length) {
        params.append('status', state.filters.accountStatus.join(','));
      }
      
      if (state.filters?.minLoyaltyPoints) {
        params.append('minLoyaltyPoints', state.filters.minLoyaltyPoints.toString());
      }
      
      if (state.filters?.noShowThreshold) {
        params.append('noShowThreshold', state.filters.noShowThreshold.toString());
      }
      
      if (state.filters?.tags?.length) {
        params.append('tags', state.filters.tags.join(','));
      }

      const response = await fetch(`/api/customers?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setState(prev => ({
          ...prev,
          customers: data.customers,
          isLoading: false,
        }));
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to load customers');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        message: { type: 'error', text: 'Failed to load customers' },
      }));
    }
  };

  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleFilter = (newFilters: any) => {
    setState(prev => ({ ...prev, filters: newFilters }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setState(prev => ({ ...prev, selectedCustomer: customer }));
  };

  const handleImport = async () => {
    if (!state.importFile) return;

    const formData = new FormData();
    formData.append('file', state.importFile);
    formData.append('mapping', JSON.stringify(state.importMapping));
    formData.append('createdBy', 'admin');

    try {
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          showImportDialog: false,
          importFile: null,
          importMapping: {},
          message: { type: 'success', text: `Import started with ${data.totalRows} rows` },
        }));

        // Poll for import progress
        pollImportProgress(data.jobId);
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: { type: 'error', text: 'Import failed' },
      }));
    }
  };

  const pollImportProgress = async (jobId: string) => {
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/customers/import?jobId=${jobId}`);
        const data = await response.json();

        if (response.ok && data.job) {
          setState(prev => ({ ...prev, importProgress: data.job }));

          if (data.job.status === 'completed' || data.job.status === 'failed') {
            setState(prev => ({
              ...prev,
              message: {
                type: data.job.status === 'completed' ? 'success' : 'error',
                text: data.job.status === 'completed' 
                  ? `Import completed: ${data.job.successCount} customers imported`
                  : 'Import failed',
              },
            }));
            loadCustomers(); // Reload customers
          } else {
            setTimeout(checkProgress, 2000); // Check again in 2 seconds
          }
        }
      } catch (error) {
        console.error('Error checking import progress:', error);
      }
    };

    checkProgress();
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/customers/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state.exportOptions,
          filters: state.filters,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-export-${new Date().toISOString().split('T')[0]}.${state.exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setState(prev => ({
          ...prev,
          showExportDialog: false,
          message: { type: 'success', text: 'Export completed' },
        }));
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: { type: 'error', text: 'Export failed' },
      }));
    }
  };

  const syncCustomers = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          message: { 
            type: 'success', 
            text: `Sync completed: ${data.results.successful} successful, ${data.results.failed} failed` 
          },
        }));
        loadCustomers(); // Reload customers
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        message: { type: 'error', text: 'Sync failed' },
      }));
    }
  };

  return (
    <div className="customer-management">
      <div className="customer-header">
        <h2>Customer Management</h2>
        <div className="header-controls">
          <div className="view-controls">
            <button 
              className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button 
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
          </div>
          <div className="customer-actions">
            <button 
              onClick={() => setState(prev => ({ ...prev, showImportDialog: true }))}
              className="action-button import-btn"
            >
              Import CSV
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, showExportDialog: true }))}
              className="action-button export-btn"
            >
              Export Data
            </button>
            <button 
              onClick={syncCustomers}
              className="action-button sync-btn"
              disabled={state.isLoading}
            >
              {state.isLoading ? 'Syncing...' : 'Sync SimplyBook'}
            </button>
          </div>
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

      {state.importProgress && state.importProgress.status !== 'completed' && state.importProgress.status !== 'failed' && (
        <div className="import-progress">
          <h4>Import Progress</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(state.importProgress.processedRows / state.importProgress.totalRows) * 100}%` 
              }}
            />
          </div>
          <p>{state.importProgress.processedRows} / {state.importProgress.totalRows} rows processed</p>
          <p>Success: {state.importProgress.successCount}, Errors: {state.importProgress.errorCount}</p>
        </div>
      )}

      <div className="customer-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={state.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <select
            multiple
            value={state.filters.accountStatus}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              handleFilter({ ...state.filters, accountStatus: values });
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>

          <input
            type="number"
            placeholder="Min Loyalty Points"
            value={state.filters.minLoyaltyPoints || ''}
            onChange={(e) => handleFilter({ 
              ...state.filters, 
              minLoyaltyPoints: parseInt(e.target.value) || 0 
            })}
            className="filter-input"
            min="0"
          />

          <input
            type="number"
            placeholder="Min No-Shows"
            value={state.filters.noShowThreshold || ''}
            onChange={(e) => handleFilter({ 
              ...state.filters, 
              noShowThreshold: parseInt(e.target.value) || 0 
            })}
            className="filter-input"
            min="0"
          />

          <button
            onClick={() => handleFilter({
              accountStatus: [],
              minLoyaltyPoints: 0,
              noShowThreshold: 0,
              tags: [],
            })}
            className="clear-filters"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="customer-content">
        {state.isLoading ? (
          <div className="loading">Loading customers...</div>
        ) : state.customers.length === 0 ? (
          <div className="no-customers">
            {state.searchQuery 
              ? `No customers found matching "${state.searchQuery}"`
              : "No customers found. Try adjusting your search or filters, or import customer data."
            }
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Last Visit</th>
                      <th>Total Spent</th>
                      <th>Loyalty Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.customers.map((customer) => (
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
                        <td className="status">
                          <span className={`status-badge ${customer.accountStatus}`}>
                            {customer.accountStatus}
                          </span>
                        </td>
                        <td className="last-visit">
                          {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="total-spent">
                          ${customer.totalSpent.toFixed(2)}
                        </td>
                        <td className="loyalty-points">
                          {customer.loyaltyPoints}
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
            ) : (
              <div className="customer-grid">
                {state.customers.map((customer) => (
                  <div 
                    key={customer.id}
                    className={`customer-card ${state.selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="customer-header-card">
                      <div className="customer-name">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className={`customer-status ${customer.accountStatus}`}>
                        {customer.accountStatus}
                      </div>
                    </div>
                    
                    <div className="customer-details">
                      <p><strong>Email:</strong> {customer.email}</p>
                      <p><strong>Phone:</strong> {customer.phone}</p>
                      <p><strong>Loyalty Points:</strong> {customer.loyaltyPoints}</p>
                      <p><strong>Total Spent:</strong> ${customer.totalSpent}</p>
                      {customer.noShowCount > 0 && (
                        <p className="warning"><strong>No-Shows:</strong> {customer.noShowCount}</p>
                      )}
                    </div>

                    {customer.tags && customer.tags.length > 0 && (
                      <div className="customer-tags">
                        {customer.tags.map((tag: any, index: number) => (
                          <span key={index} className="customer-tag">
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="customer-meta">
                      <span>Created: {new Date(customer.createdAt).toLocaleDateString()}</span>
                      {customer.lastVisit && (
                        <span>Last Visit: {new Date(customer.lastVisit).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} customers
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPreviousPage}
                    className="page-button"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="page-button"
                  >
                    Previous
                  </button>
                  <span className="page-numbers">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="page-button"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                    className="page-button"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Dialog */}
      {state.showImportDialog && (
        <div className="dialog-overlay" onClick={() => setState(prev => ({ ...prev, showImportDialog: false }))}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Import Customers</h3>
              <button 
                onClick={() => setState(prev => ({ ...prev, showImportDialog: false }))}
                className="close-dialog"
              >
                ×
              </button>
            </div>
            
            <div className="dialog-content">
              <div className="file-upload">
                <label>Choose CSV File:</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    importFile: e.target.files?.[0] || null 
                  }))}
                />
              </div>

              <div className="template-download">
                <p>Need a template? 
                  <a 
                    href="/api/customers/template" 
                    download="customer-import-template.csv"
                    className="template-link"
                  >
                    Download CSV Template
                  </a>
                </p>
                <div className="template-info">
                  <small>
                    The template includes sample data and instructions. 
                    Required fields: First Name, Last Name, Email.
                  </small>
                </div>
              </div>

              <div className="dialog-actions">
                <button 
                  onClick={() => setState(prev => ({ ...prev, showImportDialog: false }))}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!state.importFile}
                  className="import-button"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {state.showExportDialog && (
        <div className="dialog-overlay" onClick={() => setState(prev => ({ ...prev, showExportDialog: false }))}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Export Customers</h3>
              <button 
                onClick={() => setState(prev => ({ ...prev, showExportDialog: false }))}
                className="close-dialog"
              >
                ×
              </button>
            </div>
            
            <div className="dialog-content">
              <div className="export-options">
                <label>Format:</label>
                <select
                  value={state.exportOptions.format}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    exportOptions: { ...prev.exportOptions, format: e.target.value as 'csv' | 'json' }
                  }))}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.exportOptions.includePreferences}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      exportOptions: { ...prev.exportOptions, includePreferences: e.target.checked }
                    }))}
                  />
                  Include Preferences
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.exportOptions.includeTags}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      exportOptions: { ...prev.exportOptions, includeTags: e.target.checked }
                    }))}
                  />
                  Include Tags
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.exportOptions.includeAppointments}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      exportOptions: { ...prev.exportOptions, includeAppointments: e.target.checked }
                    }))}
                  />
                  Include Appointment History
                </label>
              </div>

              <div className="dialog-actions">
                <button 
                  onClick={() => setState(prev => ({ ...prev, showExportDialog: false }))}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExport}
                  className="export-button"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {state.selectedCustomer && (
        <CustomerProfile 
          customer={state.selectedCustomer}
          onUpdate={(updatedCustomer) => {
            setState(prev => ({
              ...prev,
              selectedCustomer: updatedCustomer,
              customers: prev.customers.map(c => 
                c.id === updatedCustomer.id ? updatedCustomer : c
              ),
            }));
          }}
          onClose={() => setState(prev => ({ ...prev, selectedCustomer: null }))}
        />
      )}

      <style jsx>{`
        .customer-management {
          padding: 0;
        }

        .customer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .view-controls {
          display: flex;
          gap: 5px;
        }

        .view-button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: #f5f5f5;
          cursor: pointer;
          font-size: 12px;
          border-radius: 3px;
        }

        .view-button.active {
          background: #2196f3;
          color: white;
          border-color: #2196f3;
        }

        .view-button:hover:not(.active) {
          background: #e0e0e0;
        }

        .customer-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          margin: 0;
        }

        .customer-actions {
          display: flex;
          gap: 10px;
        }

        .action-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }

        .import-btn { background: #4caf50; color: white; }
        .export-btn { background: #2196f3; color: white; }
        .sync-btn { background: #ff9800; color: white; }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .import-progress {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }

        .progress-fill {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s ease;
        }

        .customer-filters {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .search-section {
          margin-bottom: 15px;
        }

        .search-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .filter-section {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-select, .filter-input {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .clear-filters {
          padding: 6px 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .customer-content {
          min-height: 400px;
        }

        .loading, .no-customers {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 16px;
        }

        .customer-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .customer-table {
          width: 100%;
          border-collapse: collapse;
        }

        .customer-table th,
        .customer-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .customer-table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 14px;
          color: #333;
          position: sticky;
          top: 0;
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
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .pagination-info {
          font-size: 14px;
          color: #666;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .page-button {
          padding: 8px 12px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-button:hover:not(:disabled) {
          background: #2196f3;
          color: white;
          border-color: #2196f3;
        }

        .page-numbers {
          font-weight: 600;
          margin: 0 10px;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .customer-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .customer-card:hover {
          border-color: #8b7355;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .customer-card.selected {
          border-color: #8b7355;
          background: #f5f5f0;
        }

        .customer-header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .customer-name {
          font-size: 18px;
          font-weight: 600;
          color: #2c2c2c;
        }

        .customer-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .customer-status.active { background: #c8e6c9; color: #2e7d32; }
        .customer-status.suspended { background: #ffecb3; color: #f57c00; }
        .customer-status.blocked { background: #ffcdd2; color: #c62828; }

        .customer-details p {
          margin: 4px 0;
          font-size: 14px;
        }

        .customer-details .warning {
          color: #f44336;
          font-weight: 600;
        }

        .customer-tags {
          display: flex;
          gap: 6px;
          margin: 10px 0;
          flex-wrap: wrap;
        }

        .customer-tag {
          padding: 2px 8px;
          background: #e3f2fd;
          color: #1565c0;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .customer-meta {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }

        .dialog-overlay {
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

        .dialog {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80%;
          overflow-y: auto;
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .dialog-header h3 {
          margin: 0;
          font-family: 'Oswald', sans-serif;
        }

        .close-dialog {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .dialog-content {
          padding: 20px;
        }

        .file-upload label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .file-upload input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .template-download {
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .template-link {
          color: #2196f3;
          text-decoration: none;
          font-weight: 600;
        }

        .template-link:hover {
          text-decoration: underline;
        }

        .template-info {
          margin-top: 8px;
          color: #666;
          font-size: 13px;
          line-height: 1.4;
        }

        .export-options label {
          display: block;
          margin-bottom: 12px;
        }

        .export-options select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px !important;
        }

        .dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-button {
          padding: 8px 16px;
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .import-button, .export-button {
          padding: 8px 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .import-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .customer-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .header-controls {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .view-controls {
            justify-content: center;
          }

          .customer-actions {
            justify-content: center;
          }

          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .customer-table-container {
            overflow-x: auto;
          }

          .customer-table {
            min-width: 700px;
          }

          .customer-grid {
            grid-template-columns: 1fr;
          }

          .pagination {
            flex-direction: column;
            gap: 15px;
          }

          .pagination-controls {
            order: -1;
          }

          .dialog {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
}