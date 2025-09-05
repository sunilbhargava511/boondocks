'use client';

import React, { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  appointmentDate: string;
  serviceName: string;
  duration: number;
  price: number;
  status: string;
  notes?: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    conversationPreference?: number;
    noShowCount: number;
  };
}

interface ProviderAppointmentsViewProps {
  providerId: string;
}

export default function ProviderAppointmentsView({ providerId }: ProviderAppointmentsViewProps) {
  const [appointments, setAppointments] = useState<{
    past: Appointment[];
    future: Appointment[];
    all: Appointment[];
  }>({ past: [], future: [], all: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'future' | 'past' | 'all'>('future');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  useEffect(() => {
    loadAppointments();
  }, [providerId]);

  const loadAppointments = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/appointments/provider?providerId=${providerId}&limit=100`);
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments);
      } else {
        throw new Error(data.error || 'Failed to load appointments');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to load appointments. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getConversationLevel = (level?: number) => {
    const levels = ['Silent', 'Minimal', 'Normal', 'Chatty'];
    return levels[level || 2];
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Appointment status updated successfully' });
        loadAppointments(); // Refresh the list
        setSelectedAppointment(null);
      } else {
        throw new Error('Failed to update appointment');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update appointment status' });
    }
  };

  const getCurrentAppointments = () => {
    switch (currentView) {
      case 'past': return appointments.past;
      case 'future': return appointments.future;
      default: return appointments.all;
    }
  };

  return (
    <div className="provider-appointments-view">
      <div className="appointments-header">
        <h3>My Appointments</h3>
        <div className="view-tabs">
          <button
            className={`tab-button ${currentView === 'future' ? 'active' : ''}`}
            onClick={() => setCurrentView('future')}
          >
            Upcoming ({appointments.future.length})
          </button>
          <button
            className={`tab-button ${currentView === 'past' ? 'active' : ''}`}
            onClick={() => setCurrentView('past')}
          >
            Past 2 Weeks ({appointments.past.length})
          </button>
          <button
            className={`tab-button ${currentView === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentView('all')}
          >
            All ({appointments.all.length})
          </button>
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
        <div className="loading">Loading your appointments...</div>
      ) : getCurrentAppointments().length === 0 ? (
        <div className="no-appointments">
          {currentView === 'future' 
            ? "No upcoming appointments scheduled."
            : currentView === 'past'
            ? "No appointments in the past 2 weeks."
            : "No appointments found."
          }
        </div>
      ) : (
        <div className="appointments-table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentAppointments().map((appointment) => (
                <tr key={appointment.id} className="appointment-row">
                  <td className="date-time">
                    <div className="date">{formatDate(appointment.appointmentDate)}</div>
                    <div className="time">{formatTime(appointment.appointmentDate)}</div>
                  </td>
                  <td className="customer">
                    <div className="customer-name">
                      {appointment.customer.firstName} {appointment.customer.lastName}
                    </div>
                    <div className="customer-contact">
                      {appointment.customer.phone}
                    </div>
                    {appointment.customer.noShowCount > 0 && (
                      <div className="warning-text">
                        No-shows: {appointment.customer.noShowCount}
                      </div>
                    )}
                  </td>
                  <td className="service">
                    <div className="service-name">{appointment.serviceName}</div>
                    <div className="price">${appointment.price.toFixed(2)}</div>
                  </td>
                  <td className="duration">
                    {appointment.duration} min
                  </td>
                  <td className="status">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleAppointmentSelect(appointment)}
                      className="view-button"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="close-modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="appointment-info">
                <div className="info-section">
                  <h4>Customer Information</h4>
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedAppointment.customer.firstName} {selectedAppointment.customer.lastName}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {selectedAppointment.customer.email}
                  </div>
                  <div className="detail-row">
                    <strong>Phone:</strong> {selectedAppointment.customer.phone}
                  </div>
                  <div className="detail-row">
                    <strong>Conversation Level:</strong> {getConversationLevel(selectedAppointment.customer.conversationPreference)}
                  </div>
                  {selectedAppointment.customer.noShowCount > 0 && (
                    <div className="detail-row warning">
                      <strong>No-Shows:</strong> {selectedAppointment.customer.noShowCount}
                    </div>
                  )}
                </div>

                <div className="info-section">
                  <h4>Appointment Details</h4>
                  <div className="detail-row">
                    <strong>Date:</strong> {formatDate(selectedAppointment.appointmentDate)}
                  </div>
                  <div className="detail-row">
                    <strong>Time:</strong> {formatTime(selectedAppointment.appointmentDate)}
                  </div>
                  <div className="detail-row">
                    <strong>Service:</strong> {selectedAppointment.serviceName}
                  </div>
                  <div className="detail-row">
                    <strong>Duration:</strong> {selectedAppointment.duration} minutes
                  </div>
                  <div className="detail-row">
                    <strong>Price:</strong> ${selectedAppointment.price.toFixed(2)}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> 
                    <span className={`status-badge ${selectedAppointment.status}`}>
                      {selectedAppointment.status}
                    </span>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="detail-row">
                      <strong>Notes:</strong>
                      <div className="notes">{selectedAppointment.notes}</div>
                    </div>
                  )}
                </div>

                {/* Status Update Actions */}
                {selectedAppointment.status === 'confirmed' && (
                  <div className="info-section">
                    <h4>Update Status</h4>
                    <div className="status-actions">
                      <button
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                        className="status-button completed"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'no_show')}
                        className="status-button no-show"
                      >
                        Mark No-Show
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                        className="status-button cancelled"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .provider-appointments-view {
          padding: 20px 0;
        }

        .appointments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .appointments-header h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          margin: 0;
          color: #2c2c2c;
        }

        .view-tabs {
          display: flex;
          gap: 10px;
        }

        .tab-button {
          padding: 8px 16px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-button.active {
          background: #2196f3;
          color: white;
          border-color: #2196f3;
        }

        .tab-button:hover:not(.active) {
          background: #e0e0e0;
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

        .loading, .no-appointments {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 16px;
        }

        .appointments-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .appointments-table {
          width: 100%;
          border-collapse: collapse;
        }

        .appointments-table th,
        .appointments-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .appointments-table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .appointment-row:hover {
          background: #f5f5f5;
        }

        .date-time .date {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .date-time .time {
          font-size: 13px;
          color: #666;
        }

        .customer-name {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .customer-contact {
          font-size: 13px;
          color: #666;
        }

        .warning-text {
          font-size: 12px;
          color: #f44336;
          font-weight: 600;
        }

        .service-name {
          font-weight: 500;
          margin-bottom: 2px;
        }

        .price {
          font-size: 13px;
          color: #666;
          font-weight: 600;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.confirmed { background: #e3f2fd; color: #1565c0; }
        .status-badge.completed { background: #c8e6c9; color: #2e7d32; }
        .status-badge.cancelled { background: #ffcdd2; color: #c62828; }
        .status-badge.no_show { background: #ffcdd2; color: #c62828; }
        .status-badge.in_progress { background: #ffecb3; color: #f57c00; }

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

        .info-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .info-section h4 {
          font-family: 'Oswald', sans-serif;
          margin-bottom: 10px;
          color: #333;
        }

        .detail-row {
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
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

        .status-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }

        .status-button.completed {
          background: #4caf50;
          color: white;
        }

        .status-button.no-show {
          background: #f44336;
          color: white;
        }

        .status-button.cancelled {
          background: #ff9800;
          color: white;
        }

        .status-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .appointments-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .view-tabs {
            justify-content: space-between;
          }

          .tab-button {
            flex: 1;
            text-align: center;
          }

          .appointments-table-container {
            overflow-x: auto;
          }

          .appointments-table {
            min-width: 700px;
          }

          .modal {
            width: 95%;
          }

          .status-actions {
            flex-direction: column;
          }

          .status-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}