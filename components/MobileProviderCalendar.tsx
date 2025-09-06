'use client';

import React, { useState, useEffect } from 'react';

interface Provider {
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  displayName?: string;
  avatarInitials?: string;
}

interface MobileProviderCalendarProps {
  provider: Provider;
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

export default function MobileProviderCalendar({ provider }: MobileProviderCalendarProps) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'booked' | 'available'>('booked');

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(`/api/provider/${provider.providerId}/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      
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
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getServiceColor = (duration: number) => {
    if (duration <= 20) return '#E8F5E8'; // Light green for short services
    if (duration <= 30) return '#E8F2FF'; // Light blue for medium services
    if (duration <= 45) return '#FFF3E0'; // Light orange for long services
    return '#F3E5F5'; // Light purple for very long services
  };

  const getServiceBorderColor = (duration: number) => {
    if (duration <= 20) return '#4CAF50';
    if (duration <= 30) return '#2196F3'; 
    if (duration <= 45) return '#FF9800';
    return '#9C27B0';
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const generateTimeBlocks = () => {
    const businessHours = {
      start: 9, // 9 AM
      end: 20,  // 8 PM
      slotDuration: 30 // 30 minutes
    };

    const blocks = [];
    const bookedTimes = new Set(appointments.map(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return `${aptDate.getHours()}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
    }));
    
    // Check if it's a weekend (assuming barbers are off on Sundays)
    const isWeekend = selectedDate.getDay() === 0; // Sunday = 0
    
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minutes = 0; minutes < 60; minutes += businessHours.slotDuration) {
        const timeKey = `${hour}:${minutes.toString().padStart(2, '0')}`;
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, minutes, 0, 0);
        
        const formattedTime = slotDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        let status = 'available';
        let statusText = 'Available';
        
        if (isWeekend) {
          status = 'closed';
          statusText = 'Closed';
        } else if (bookedTimes.has(timeKey)) {
          status = 'booked';
          statusText = 'Booked';
        }
        
        blocks.push({
          time: slotDate,
          formattedTime,
          status,
          statusText,
          timeKey
        });
      }
    }
    
    return blocks;
  };

  const formatDateHeader = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      dayName: days[date.getDay()],
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear()
    };
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || fullName;
  };

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const dateInfo = formatDateHeader(selectedDate);
  const sortedAppointments = appointments.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

  return (
    <div className="mobile-calendar">
      {/* Header */}
      <div className="header">
        <button 
          className="menu-button"
          onClick={() => setShowMenu(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="header-content">
          <div className="header-icon">✂</div>
          <h1 className="header-title">{provider.displayName || provider.firstName}'s Schedule</h1>
        </div>
        <div className="provider-info">
          <div className="provider-avatar">
            {provider.avatarInitials || `${provider.firstName.charAt(0)}${provider.lastName.charAt(0)}`}
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="date-navigation">
        <button 
          className="nav-arrow"
          onClick={() => navigateDate(-1)}
        >
          ‹
        </button>
        
        <div className="date-display">
          <div className="day-name">{dateInfo.dayName}</div>
          <div className="day-number">{dateInfo.day}</div>
          <div className="month-year">{dateInfo.month} {dateInfo.year}</div>
        </div>
        
        <button 
          className="nav-arrow"
          onClick={() => navigateDate(1)}
        >
          ›
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'booked' ? 'active' : ''}`}
          onClick={() => setViewMode('booked')}
        >
          Booked
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'available' ? 'active' : ''}`}
          onClick={() => setViewMode('available')}
        >
          Available
        </button>
      </div>

      {/* Appointment Count */}
      <div className="appointment-count">
        {isLoading ? 'Loading...' : viewMode === 'booked' 
          ? `${appointments.length} appointments` 
          : (() => {
              const timeBlocks = generateTimeBlocks();
              const availableCount = timeBlocks.filter(block => block.status === 'available').length;
              const bookedCount = timeBlocks.filter(block => block.status === 'booked').length;
              const isClosedDay = selectedDate.getDay() === 0;
              
              if (isClosedDay) return 'Barber is off today';
              return `${availableCount} available • ${bookedCount} booked`;
            })()}
      </div>

      {/* Duration Legend */}
      <div className="duration-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#4CAF50' }}></div>
          <span>30m</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#2196F3' }}></div>
          <span>45m</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#FF9800' }}></div>
          <span>1hr</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#9C27B0' }}></div>
          <span>1.5hr+</span>
        </div>
      </div>

      {/* Appointments/Available Slots List */}
      <div className="appointments-list">
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : viewMode === 'booked' ? (
          sortedAppointments.length === 0 ? (
            <div className="no-appointments">No appointments for this day</div>
          ) : (
            sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="appointment-card"
                style={{
                  backgroundColor: getServiceColor(appointment.duration),
                  borderLeftColor: getServiceBorderColor(appointment.duration)
                }}
                onClick={() => handleAppointmentClick(appointment)}
              >
                <div className="appointment-time">
                  <div className="time-display">{formatTime(appointment.appointmentDate)}</div>
                  <div className="time-period">{new Date(appointment.appointmentDate).getHours() < 12 ? 'AM' : 'PM'}</div>
                </div>
                <div className="appointment-details">
                  <span className="customer-name">{getFirstName(appointment.customerName)}</span>
                  <span className="service-name">
                    {appointment.serviceName} ({appointment.duration}m)
                  </span>
                </div>
              </div>
            ))
          )
        ) : (
          (() => {
            const timeBlocks = generateTimeBlocks();
            const availableBlocks = timeBlocks.filter(block => block.status === 'available');
            const bookedBlocks = timeBlocks.filter(block => block.status === 'booked');
            const closedBlocks = timeBlocks.filter(block => block.status === 'closed');
            
            // If it's a closed day, show message
            if (closedBlocks.length === timeBlocks.length) {
              return <div className="status-message closed">Barber is off today</div>;
            }
            
            // If no appointments and no available slots, show message
            if (timeBlocks.length === 0) {
              return <div className="status-message">No time slots available</div>;
            }
            
            // Show all time blocks
            return timeBlocks.map((block, index) => (
              <div
                key={index}
                className={`time-block-card ${block.status}`}
              >
                <div className="appointment-time">
                  <div className="time-display">{block.formattedTime}</div>
                </div>
                <div className="appointment-details">
                  <span className={`status-text ${block.status}`}>{block.statusText}</span>
                  <span className="service-name">30 min slot</span>
                </div>
              </div>
            ));
          })()
        )}
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button onClick={() => setShowAppointmentModal(false)}>×</button>
            </div>
            <div className="appointment-details-full">
              <div className="detail-row">
                <strong>Customer:</strong> {selectedAppointment.customerName}
              </div>
              <div className="detail-row">
                <strong>Service:</strong> {selectedAppointment.serviceName}
              </div>
              <div className="detail-row">
                <strong>Time:</strong> {formatTime(selectedAppointment.appointmentDate)}
              </div>
              <div className="detail-row">
                <strong>Duration:</strong> {selectedAppointment.duration} minutes
              </div>
              <div className="detail-row">
                <strong>Price:</strong> ${selectedAppointment.price}
              </div>
              <div className="detail-row">
                <strong>Contact:</strong>
                <div>{selectedAppointment.customerPhone}</div>
                <div>{selectedAppointment.customerEmail}</div>
              </div>
              {selectedAppointment.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong> {selectedAppointment.notes}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="appointment-actions">
              <button 
                className="action-btn call-btn"
                onClick={() => {
                  if (selectedAppointment.customerPhone) {
                    window.location.href = `tel:${selectedAppointment.customerPhone}`;
                  }
                }}
              >
                📞 Call
              </button>
              <button 
                className="action-btn message-btn"
                onClick={() => {
                  if (selectedAppointment.customerPhone) {
                    window.location.href = `sms:${selectedAppointment.customerPhone}`;
                  }
                }}
              >
                💬 Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hamburger Menu */}
      {showMenu && (
        <div className="menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="menu-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h3>{provider.displayName || provider.firstName}'s Calendar</h3>
              <button 
                className="close-menu"
                onClick={() => setShowMenu(false)}
              >
                ×
              </button>
            </div>
            <div className="menu-content">
              <button
                className="menu-item"
                onClick={() => {
                  setShowDatePicker(true);
                  setShowMenu(false);
                }}
              >
                📅 Jump to Date
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowMenu(false);
                }}
              >
                🏠 Today
              </button>
              <button
                className="menu-item admin-link"
                onClick={() => {
                  window.open('/admin', '_blank');
                  setShowMenu(false);
                }}
              >
                ⚙️ Admin Dashboard
              </button>
              <div className="menu-divider"></div>
              <div className="provider-details">
                <p><strong>Email:</strong> {provider.email}</p>
                {provider.phone && <p><strong>Phone:</strong> {provider.phone}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
          <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Date</h3>
              <button onClick={() => setShowDatePicker(false)}>×</button>
            </div>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
                setShowDatePicker(false);
              }}
              className="date-input"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-calendar {
          min-height: 100vh;
          background: #2c2c2c;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding-bottom: 20px;
        }

        .header {
          background: #2c2c2c;
          color: #f5f5f0;
          padding: 60px 20px 20px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #8b7355;
        }

        .menu-button {
          background: none;
          border: none;
          color: #f5f5f0;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.2s;
          width: 40px;
        }

        .menu-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          justify-content: center;
        }

        .header-icon {
          font-size: 24px;
          color: #c41e3a;
        }

        .header-title {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #f5f5f0;
        }

        .provider-info {
          width: 40px;
          display: flex;
          justify-content: center;
        }

        .provider-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #c41e3a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
        }

        .date-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 15px 0;
          background: #8b7355;
          border-radius: 12px;
          padding: 12px 15px;
          margin: 15px 20px 8px 20px;
          border: 2px solid #6d5a42;
        }

        .nav-arrow {
          background: none;
          border: none;
          color: #f5f5f0;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .nav-arrow:hover {
          background: rgba(245, 245, 240, 0.2);
        }

        .date-display {
          text-align: center;
          color: #f5f5f0;
          margin: 0 25px;
          min-width: 100px;
        }

        .day-name {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .day-number {
          font-family: 'Oswald', sans-serif;
          font-size: 32px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 2px;
          color: #c41e3a;
        }

        .month-year {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        .view-toggle {
          display: flex;
          justify-content: center;
          margin: 20px;
          background: rgba(139, 115, 85, 0.3);
          border-radius: 8px;
          padding: 4px;
          gap: 2px;
        }

        .toggle-btn {
          flex: 1;
          padding: 12px 16px;
          background: transparent;
          color: #f5f5f0;
          border: none;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .toggle-btn.active {
          background: #c41e3a;
          color: white;
          font-weight: 600;
        }

        .appointment-count {
          text-align: center;
          color: #f5f5f0;
          font-size: 16px;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .duration-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 0 20px 20px 20px;
          padding: 12px;
          background: rgba(139, 115, 85, 0.3);
          border-radius: 12px;
          border: 1px solid #8b7355;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f5f5f0;
          font-size: 14px;
          font-weight: 500;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .appointments-list {
          padding: 0 20px;
        }

        .loading, .no-appointments {
          text-align: center;
          color: #f5f5f0;
          padding: 40px 20px;
          font-size: 16px;
        }

        .appointment-card {
          display: flex;
          align-items: center;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 12px;
          border-left: 4px solid;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .appointment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .time-block-card {
          display: flex;
          align-items: center;
          padding: 16px;
          margin-bottom: 8px;
          border-radius: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          color: #ffffff;
        }

        .time-block-card .time-display {
          color: #ffffff !important;
          font-weight: 600;
        }

        .time-block-card .service-name {
          color: #ffffff !important;
        }

        .time-block-card.available {
          background: rgba(76, 175, 80, 0.2);
          border-left: 4px solid #4CAF50;
        }

        .time-block-card.available:hover {
          transform: translateY(-1px);
          background: rgba(76, 175, 80, 0.3);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }

        .time-block-card.booked {
          background: rgba(196, 30, 58, 0.2);
          border-left: 4px solid #c41e3a;
        }

        .time-block-card.booked:hover {
          transform: translateY(-1px);
          background: rgba(196, 30, 58, 0.3);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }

        .time-block-card.closed {
          background: rgba(158, 158, 158, 0.2);
          border-left: 4px solid #9e9e9e;
          opacity: 0.7;
        }

        .status-text {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        .status-text.available {
          color: #ffffff;
        }

        .status-text.booked {
          color: #ffffff;
        }

        .status-text.closed {
          color: #ffffff;
        }

        .status-message {
          text-align: center;
          color: #f5f5f0;
          font-size: 18px;
          padding: 40px 20px;
          background: rgba(139, 115, 85, 0.3);
          border-radius: 12px;
          margin: 20px;
        }

        .status-message.closed {
          background: rgba(158, 158, 158, 0.2);
          color: #9e9e9e;
        }

        .appointment-time {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 70px;
          margin-right: 16px;
        }

        .time-display {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          line-height: 1;
        }

        .time-period {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          margin-top: 2px;
        }

        .appointment-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .customer-name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .service-name {
          font-size: 15px;
          color: #666;
          font-weight: 500;
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
          z-index: 2000;
          padding: 20px;
        }

        .appointment-modal {
          background: white;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .modal-header button {
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

        .appointment-details-full {
          padding: 20px;
        }

        .detail-row {
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .detail-row strong {
          display: block;
          color: #4A90E2;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .appointment-actions {
          padding: 20px;
          border-top: 1px solid #f0f0f0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .action-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .call-btn {
          background: #4CAF50;
          color: white;
        }

        .call-btn:hover {
          background: #45a049;
          transform: translateY(-1px);
        }

        .message-btn {
          background: #2196F3;
          color: white;
        }

        .message-btn:hover {
          background: #1976d2;
          transform: translateY(-1px);
        }

        /* Hamburger Menu Styles */
        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .menu-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 280px;
          background: white;
          z-index: 1001;
          box-shadow: 4px 0 12px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
        }

        .menu-header {
          background: #2c2c2c;
          color: #f5f5f0;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .menu-header h3 {
          margin: 0;
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
        }

        .close-menu {
          background: none;
          border: none;
          color: #f5f5f0;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-content {
          flex: 1;
          padding: 20px;
        }

        .menu-item {
          display: block;
          width: 100%;
          padding: 15px 0;
          background: none;
          border: none;
          text-align: left;
          font-size: 16px;
          cursor: pointer;
          transition: color 0.2s;
          border-bottom: 1px solid #f0f0f0;
          color: #2c2c2c;
        }

        .menu-item:hover {
          color: #c41e3a;
        }

        .admin-link {
          background: linear-gradient(135deg, #c41e3a, #a01729) !important;
          color: white !important;
          border-radius: 8px !important;
          margin: 8px 0 !important;
          border-bottom: none !important;
          font-weight: 600 !important;
          text-align: center !important;
        }

        .admin-link:hover {
          background: linear-gradient(135deg, #a01729, #8b1525) !important;
          color: white !important;
          transform: translateY(-1px);
        }

        .menu-divider {
          height: 2px;
          background: #f0f0f0;
          margin: 20px 0;
        }

        .provider-details {
          margin-top: 20px;
          padding: 15px;
          background: #f8f8f8;
          border: 2px solid #8b7355;
          border-radius: 6px;
        }

        .provider-details p {
          margin: 8px 0;
          font-size: 14px;
          color: #666;
        }

        .provider-details strong {
          color: #8b7355;
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Date Picker Modal */
        .date-picker-modal {
          background: white;
          border-radius: 12px;
          max-width: 300px;
          width: 90%;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .date-input {
          width: 100%;
          padding: 15px 20px;
          border: none;
          font-size: 16px;
          border-radius: 0 0 12px 12px;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .header {
            padding: 50px 20px 15px 20px;
          }
          
          .header-title {
            font-size: 20px;
          }
          
          .date-navigation {
            margin: 15px 15px 10px 15px;
            padding: 15px;
          }
          
          .day-number {
            font-size: 40px;
          }
          
          .duration-legend {
            margin: 0 15px 15px 15px;
            gap: 15px;
          }
          
          .appointments-list {
            padding: 0 15px;
          }
          
          .appointment-card {
            padding: 14px;
          }
          
          .time-display {
            font-size: 18px;
          }
          
          .customer-name {
            font-size: 16px;
          }
          
          .service-name {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}