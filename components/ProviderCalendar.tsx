'use client';

import React, { useState, useEffect } from 'react';

interface ProviderCalendarProps {
  provider: any;
}

interface CalendarAppointment {
  id: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  duration: number;
  price: number;
  status: string;
  notes?: string;
}

export default function ProviderCalendar({ provider }: ProviderCalendarProps) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [currentDate, view]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      
      // Calculate date range based on view
      let startDate: Date;
      let endDate: Date;
      
      if (view === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else {
        // Week view
        const today = new Date(currentDate);
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek); // Start of week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
      }

      const url = `/api/providers/appointments?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const transformedAppointments = (data.appointments || []).map((apt: any) => ({
          id: apt.id,
          serviceName: apt.serviceName,
          customerName: `${apt.customer?.firstName || ''} ${apt.customer?.lastName || ''}`.trim(),
          customerEmail: apt.customer?.email || '',
          customerPhone: apt.customer?.phone || '',
          appointmentDate: apt.appointmentDate,
          duration: apt.duration,
          price: apt.price,
          status: apt.status,
          notes: apt.notes
        }));
        setAppointments(transformedAppointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: '#4caf50',
      completed: '#2196f3',
      cancelled: '#f44336',
      no_show: '#ff9800',
      in_progress: '#9c27b0'
    };
    return colors[status as keyof typeof colors] || '#666';
  };

  const sendMessage = async () => {
    if (!selectedAppointment || !messageContent.trim()) {
      setActionMessage('Please enter a message');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          type: messageType,
          subject: messageType === 'email' ? messageSubject : undefined,
          message: messageContent
        })
      });

      if (response.ok) {
        setActionMessage('Message sent successfully!');
        setShowMessageModal(false);
        resetMessageForm();
      } else {
        const data = await response.json();
        setActionMessage(data.error || 'Failed to send message');
      }
    } catch (error) {
      setActionMessage('Failed to send message');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/appointments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          action: 'cancel',
          reason: cancelReason
        })
      });

      if (response.ok) {
        setActionMessage('Appointment cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedAppointment(null);
        loadAppointments();
      } else {
        const data = await response.json();
        setActionMessage(data.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      setActionMessage('Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      setActionMessage('Please select a date and time');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
      
      const response = await fetch('/api/providers/appointments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          action: 'reschedule',
          newDateTime: newDateTime.toISOString()
        })
      });

      if (response.ok) {
        setActionMessage('Appointment rescheduled successfully');
        setShowRescheduleModal(false);
        setRescheduleDate('');
        setRescheduleTime('');
        setSelectedAppointment(null);
        loadAppointments();
      } else {
        const data = await response.json();
        setActionMessage(data.error || 'Failed to reschedule appointment');
      }
    } catch (error) {
      setActionMessage('Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const resetMessageForm = () => {
    setMessageSubject('');
    setMessageContent('');
    setMessageType('email');
  };

  const handleMessageAppointment = (appointment: CalendarAppointment, type: 'email' | 'sms') => {
    setSelectedAppointment(appointment);
    setMessageType(type);
    if (type === 'email') {
      setMessageSubject(`Regarding your appointment on ${formatTime(appointment.appointmentDate)}`);
    }
    setShowMessageModal(true);
  };

  const handleCancelAppointment = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleRescheduleAppointment = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    const currentDate = new Date(appointment.appointmentDate);
    setRescheduleDate(currentDate.toISOString().split('T')[0]);
    setRescheduleTime(currentDate.toTimeString().slice(0, 5));
    setShowRescheduleModal(true);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    const today = new Date();
    
    // Empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return (
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
            <div key={dayName} className="day-header">{dayName}</div>
          ))}
        </div>
        <div className="calendar-body">
          {days.map((date, index) => (
            <div 
              key={index} 
              className={`calendar-day ${date ? 'has-date' : ''} ${
                date && date.toDateString() === today.toDateString() ? 'today' : ''
              }`}
            >
              {date && (
                <>
                  <span className="day-number">{date.getDate()}</span>
                  <div className="day-appointments">
                    {getAppointmentsForDate(date).map(apt => (
                      <div 
                        key={apt.id} 
                        className="appointment-dot"
                        style={{ backgroundColor: getStatusColor(apt.status) }}
                        onClick={() => setSelectedAppointment(apt)}
                        title={`${formatTime(apt.appointmentDate)} - ${apt.serviceName} with ${apt.customerName}`}
                      >
                        <span className="appointment-time">{formatTime(apt.appointmentDate)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const today = new Date(currentDate);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const todayStr = new Date().toDateString();

    return (
      <div className="week-view">
        <div className="week-header">
          {weekDays.map(date => (
            <div key={date.toDateString()} className={`week-day-header ${date.toDateString() === todayStr ? 'today' : ''}`}>
              <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="day-date">{date.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="week-body">
          {weekDays.map(date => (
            <div key={date.toDateString()} className="week-day-column">
              {getAppointmentsForDate(date).map(apt => (
                <div 
                  key={apt.id} 
                  className="week-appointment"
                  style={{ borderLeftColor: getStatusColor(apt.status) }}
                  onClick={() => setSelectedAppointment(apt)}
                >
                  <div className="appointment-time">{formatTime(apt.appointmentDate)}</div>
                  <div className="appointment-service">{apt.serviceName}</div>
                  <div className="appointment-customer">{apt.customerName}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="calendar-controls">
        <div className="calendar-navigation">
          <button 
            className="nav-btn"
            onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
          >
            ‹
          </button>
          <h2 className="current-period">
            {view === 'month' 
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
          </h2>
          <button 
            className="nav-btn"
            onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
          >
            ›
          </button>
        </div>
        
        <div className="view-controls">
          <button 
            className={`view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button 
            className="today-btn"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {isLoading ? (
        <div className="loading">Loading calendar...</div>
      ) : (
        <>
          {view === 'month' ? renderMonthView() : renderWeekView()}
        </>
      )}

      {/* Action Message */}
      {actionMessage && (
        <div className="action-message">
          {actionMessage}
          <button onClick={() => setActionMessage('')} className="message-close">×</button>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && !showMessageModal && !showCancelModal && !showRescheduleModal && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button className="close-btn" onClick={() => setSelectedAppointment(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="appointment-details">
                <div className="detail-row">
                  <span className="label">Service:</span>
                  <span className="value">{selectedAppointment.serviceName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Customer:</span>
                  <span className="value">{selectedAppointment.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date & Time:</span>
                  <span className="value">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {formatTime(selectedAppointment.appointmentDate)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Duration:</span>
                  <span className="value">{selectedAppointment.duration} minutes</span>
                </div>
                <div className="detail-row">
                  <span className="label">Price:</span>
                  <span className="value">${selectedAppointment.price}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedAppointment.status) }}
                    >
                      {selectedAppointment.status}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Contact:</span>
                  <span className="value">
                    <div>{selectedAppointment.customerEmail}</div>
                    <div>{selectedAppointment.customerPhone}</div>
                  </span>
                </div>
                {selectedAppointment.notes && (
                  <div className="detail-row">
                    <span className="label">Notes:</span>
                    <span className="value">{selectedAppointment.notes}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="appointment-actions">
                <div className="action-group">
                  <span className="action-group-label">Contact Customer:</span>
                  <button 
                    className="action-btn email-btn"
                    onClick={() => handleMessageAppointment(selectedAppointment, 'email')}
                  >
                    📧 Send Email
                  </button>
                  <button 
                    className="action-btn sms-btn"
                    onClick={() => handleMessageAppointment(selectedAppointment, 'sms')}
                  >
                    📱 Send SMS
                  </button>
                </div>
                
                {selectedAppointment.status === 'confirmed' && (
                  <div className="action-group">
                    <span className="action-group-label">Manage Appointment:</span>
                    <button 
                      className="action-btn reschedule-btn"
                      onClick={() => handleRescheduleAppointment(selectedAppointment)}
                    >
                      🔄 Reschedule
                    </button>
                    <button 
                      className="action-btn cancel-btn"
                      onClick={() => handleCancelAppointment(selectedAppointment)}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send {messageType === 'email' ? 'Email' : 'SMS'} to {selectedAppointment.customerName}</h3>
              <button className="close-btn" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="message-form">
                {messageType === 'email' && (
                  <div className="form-group">
                    <label>Subject:</label>
                    <input
                      type="text"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Email subject"
                      className="form-input"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Message:</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={`Enter your ${messageType} message...`}
                    className="form-textarea"
                    rows={6}
                  />
                </div>
                <div className="form-actions">
                  <button className="btn-secondary" onClick={() => setShowMessageModal(false)}>
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={sendMessage}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Sending...' : `Send ${messageType === 'email' ? 'Email' : 'SMS'}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Appointment</h3>
              <button className="close-btn" onClick={() => setShowCancelModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this appointment?</p>
              <div className="appointment-summary">
                <strong>{selectedAppointment.customerName}</strong>
                <span>{new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
                <span>{selectedAppointment.serviceName}</span>
              </div>
              <div className="form-group">
                <label>Cancellation Reason (optional):</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                  Keep Appointment
                </button>
                <button 
                  className="btn-danger" 
                  onClick={cancelAppointment}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button className="close-btn" onClick={() => setShowRescheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="appointment-summary">
                <strong>{selectedAppointment.customerName}</strong>
                <span>{selectedAppointment.serviceName}</span>
                <span>Current: {new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="datetime-inputs">
                <div className="form-group">
                  <label>New Date:</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>New Time:</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowRescheduleModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={rescheduleAppointment}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rescheduling...' : 'Reschedule Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          background: white;
          border: 2px solid #8b7355;
          padding: 30px;
        }

        .calendar-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .calendar-navigation {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-btn {
          background: #8b7355;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          transition: background 0.2s;
        }

        .nav-btn:hover {
          background: #6d5a42;
        }

        .current-period {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0;
          min-width: 250px;
          text-align: center;
        }

        .view-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .view-btn, .today-btn {
          padding: 8px 16px;
          border: 2px solid #8b7355;
          background: white;
          color: #8b7355;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn:hover, .today-btn:hover {
          background: #8b7355;
          color: white;
        }

        .view-btn.active {
          background: #c41e3a;
          border-color: #c41e3a;
          color: white;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: #666;
          font-size: 18px;
        }

        /* Month View Styles */
        .calendar-grid {
          border: 2px solid #e0e0e0;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f8f8;
        }

        .day-header {
          padding: 12px;
          text-align: center;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid #e0e0e0;
        }

        .day-header:last-child {
          border-right: none;
        }

        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          min-height: 120px;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          padding: 8px;
          position: relative;
        }

        .calendar-day:last-child {
          border-right: none;
        }

        .calendar-day.today {
          background: #fff3f3;
        }

        .day-number {
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          color: #2c2c2c;
          font-size: 16px;
        }

        .day-appointments {
          margin-top: 4px;
        }

        .appointment-dot {
          background: #ccc;
          border-radius: 4px;
          padding: 2px 6px;
          margin: 2px 0;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 11px;
        }

        .appointment-dot:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .appointment-time {
          color: white;
          font-weight: 500;
          font-size: 10px;
        }

        /* Week View Styles */
        .week-view {
          border: 2px solid #e0e0e0;
        }

        .week-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f8f8;
        }

        .week-day-header {
          padding: 15px 12px;
          text-align: center;
          border-right: 1px solid #e0e0e0;
        }

        .week-day-header:last-child {
          border-right: none;
        }

        .week-day-header.today {
          background: #fff3f3;
        }

        .day-name {
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }

        .day-date {
          font-size: 24px;
          font-weight: 700;
          color: #666;
          margin-top: 4px;
        }

        .week-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          min-height: 400px;
        }

        .week-day-column {
          border-right: 1px solid #e0e0e0;
          padding: 10px;
        }

        .week-day-column:last-child {
          border-right: none;
        }

        .week-appointment {
          background: #f9f9f9;
          border-left: 4px solid #ccc;
          padding: 8px;
          margin: 4px 0;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 4px;
        }

        .week-appointment:hover {
          background: #f0f0f0;
          transform: translateX(2px);
        }

        .appointment-service {
          font-weight: 600;
          color: #2c2c2c;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .appointment-customer {
          color: #666;
          font-size: 11px;
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

        .appointment-details {
          display: grid;
          gap: 16px;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .label {
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          color: #8b7355;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }

        .value {
          color: #2c2c2c;
          font-weight: 500;
        }

        .status-badge {
          padding: 4px 8px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 12px;
        }

        /* Action Message */
        .action-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4caf50;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 300px;
        }

        .message-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          margin-left: auto;
        }

        /* Appointment Actions */
        .appointment-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }

        .action-group {
          margin-bottom: 15px;
        }

        .action-group-label {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #8b7355;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .action-btn {
          margin-right: 10px;
          margin-bottom: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .email-btn {
          background: #2196f3;
          color: white;
        }

        .email-btn:hover {
          background: #1976d2;
        }

        .sms-btn {
          background: #4caf50;
          color: white;
        }

        .sms-btn:hover {
          background: #45a049;
        }

        .reschedule-btn {
          background: #ff9800;
          color: white;
        }

        .reschedule-btn:hover {
          background: #f57c00;
        }

        .cancel-btn {
          background: #f44336;
          color: white;
        }

        .cancel-btn:hover {
          background: #d32f2f;
        }

        /* Form Styles */
        .message-form {
          display: grid;
          gap: 15px;
        }

        .form-group {
          display: grid;
          gap: 5px;
        }

        .form-group label {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input, .form-textarea {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #8b7355;
        }

        .form-textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-primary, .btn-secondary, .btn-danger {
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

        .appointment-summary {
          background: #f8f8f8;
          padding: 15px;
          border-left: 4px solid #8b7355;
          margin: 15px 0;
        }

        .appointment-summary strong {
          display: block;
          margin-bottom: 5px;
          color: #2c2c2c;
        }

        .appointment-summary span {
          display: block;
          font-size: 13px;
          color: #666;
          margin-bottom: 3px;
        }

        .datetime-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .calendar-controls {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .calendar-navigation {
            justify-content: center;
          }

          .current-period {
            min-width: auto;
            font-size: 20px;
          }

          .view-controls {
            justify-content: center;
          }

          .calendar-day {
            min-height: 80px;
            padding: 4px;
          }

          .day-number {
            font-size: 14px;
          }

          .appointment-dot {
            font-size: 9px;
            padding: 1px 4px;
          }

          .week-body {
            min-height: 300px;
          }

          .detail-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}