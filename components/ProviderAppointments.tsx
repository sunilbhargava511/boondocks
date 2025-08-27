'use client';

import React, { useState, useEffect } from 'react';

interface ProviderAppointmentsProps {
  provider: any;
}

export default function ProviderAppointments({ provider }: ProviderAppointmentsProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      let url = '/api/providers/appointments?';
      
      const today = new Date();
      if (filter === 'today') {
        url += `startDate=${today.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
      } else if (filter === 'week') {
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        url += `startDate=${today.toISOString().split('T')[0]}&endDate=${nextWeek.toISOString().split('T')[0]}`;
      } else if (filter === 'all') {
        // No date filter
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setMessage('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, action: string, reason?: string) => {
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/appointments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          action,
          reason
        })
      });

      if (response.ok) {
        setMessage(`Appointment ${action}ed successfully`);
        loadAppointments();
        setSelectedAppointment(null);
        setCancelReason('');
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setMessage('Failed to update appointment');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      confirmed: '#4caf50',
      completed: '#2196f3',
      cancelled: '#f44336',
      no_show: '#ff9800',
      in_progress: '#9c27b0'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>My Appointments</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button 
            className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {message && (
        <div className="message-box">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="no-appointments">
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <span className="appointment-time">{formatDate(appointment.appointmentDate)}</span>
                <span 
                  className="appointment-status"
                  style={{ backgroundColor: getStatusColor(appointment.status) }}
                >
                  {appointment.status}
                </span>
              </div>
              
              <div className="appointment-body">
                <h4>{appointment.serviceName}</h4>
                <div className="customer-info">
                  <strong>{appointment.customer?.firstName} {appointment.customer?.lastName}</strong>
                  <div className="contact-details">
                    <span>📧 {appointment.customer?.email}</span>
                    <span>📱 {appointment.customer?.phone}</span>
                  </div>
                  {appointment.notes && (
                    <div className="notes">
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
                
                <div className="appointment-details">
                  <span>Duration: {appointment.duration} min</span>
                  <span>Price: ${appointment.price}</span>
                </div>
              </div>

              {appointment.status === 'confirmed' && (
                <div className="appointment-actions">
                  <button 
                    className="action-btn complete"
                    onClick={() => updateAppointmentStatus(appointment.id, 'complete')}
                  >
                    Mark Complete
                  </button>
                  <button 
                    className="action-btn no-show"
                    onClick={() => updateAppointmentStatus(appointment.id, 'no_show')}
                  >
                    No Show
                  </button>
                  <button 
                    className="action-btn cancel"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Appointment</h3>
            <p>Are you sure you want to cancel this appointment?</p>
            <div className="appointment-summary">
              <strong>{selectedAppointment.customer?.firstName} {selectedAppointment.customer?.lastName}</strong>
              <span>{formatDate(selectedAppointment.appointmentDate)}</span>
              <span>{selectedAppointment.serviceName}</span>
            </div>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedAppointment(null)}
              >
                Keep Appointment
              </button>
              <button 
                className="confirm-btn"
                onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancel', cancelReason)}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .appointments-container {
          background: white;
          border: 2px solid #8b7355;
          padding: 30px;
        }

        .appointments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .appointments-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }

        .filter-buttons {
          display: flex;
          gap: 10px;
        }

        .filter-btn {
          padding: 8px 16px;
          background: white;
          border: 2px solid #8b7355;
          color: #666;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: #c41e3a;
          color: #c41e3a;
        }

        .filter-btn.active {
          background: #c41e3a;
          border-color: #c41e3a;
          color: white;
        }

        .message-box {
          padding: 12px;
          background: #e8f5e9;
          border: 1px solid #4caf50;
          color: #2e7d32;
          margin-bottom: 20px;
          text-align: center;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-appointments {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .appointments-list {
          display: grid;
          gap: 20px;
        }

        .appointment-card {
          border: 2px solid #e0e0e0;
          background: #f9f9f9;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .appointment-card:hover {
          border-color: #8b7355;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .appointment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .appointment-time {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #666;
        }

        .appointment-status {
          padding: 4px 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 12px;
        }

        .appointment-body h4 {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 12px 0;
        }

        .customer-info {
          background: white;
          padding: 12px;
          border-left: 3px solid #8b7355;
          margin-bottom: 12px;
        }

        .customer-info strong {
          display: block;
          margin-bottom: 8px;
          color: #2c2c2c;
        }

        .contact-details {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: #666;
        }

        .notes {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
          font-size: 13px;
          color: #666;
        }

        .appointment-details {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: #666;
        }

        .appointment-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.complete {
          background: #4caf50;
          color: white;
        }

        .action-btn.complete:hover {
          background: #45a049;
        }

        .action-btn.no-show {
          background: #ff9800;
          color: white;
        }

        .action-btn.no-show:hover {
          background: #fb8c00;
        }

        .action-btn.cancel {
          background: #f44336;
          color: white;
        }

        .action-btn.cancel:hover {
          background: #e53935;
        }

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
          padding: 30px;
          max-width: 500px;
          width: 90%;
          border: 3px solid #8b7355;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .modal h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 16px 0;
        }

        .appointment-summary {
          background: #f5f5f5;
          padding: 12px;
          margin: 16px 0;
          border-left: 3px solid #c41e3a;
        }

        .appointment-summary strong {
          display: block;
          margin-bottom: 4px;
        }

        .appointment-summary span {
          display: block;
          font-size: 13px;
          color: #666;
        }

        .modal textarea {
          width: 100%;
          padding: 10px;
          border: 2px solid #8b7355;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn, .confirm-btn {
          padding: 10px 20px;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn {
          background: transparent;
          border: 2px solid #8b7355;
          color: #8b7355;
        }

        .cancel-btn:hover {
          background: #8b7355;
          color: white;
        }

        .confirm-btn {
          background: #c41e3a;
          color: white;
        }

        .confirm-btn:hover {
          background: #a01729;
        }
      `}</style>
    </div>
  );
}