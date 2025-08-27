'use client';

import React, { useState, useEffect } from 'react';

interface ProviderAvailabilityProps {
  provider: any;
}

export default function ProviderAvailability({ provider }: ProviderAvailabilityProps) {
  const [unavailableDates, setUnavailableDates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    allDay: true,
    reason: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUnavailableDates();
  }, []);

  const loadUnavailableDates = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/availability', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnavailableDates(data.unavailableDates);
      }
    } catch (error) {
      console.error('Failed to load unavailable dates:', error);
      setMessage('Failed to load unavailable dates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUnavailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch('/api/providers/availability', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Unavailability added successfully');
        loadUnavailableDates();
        setShowAddForm(false);
        setFormData({ startDate: '', endDate: '', allDay: true, reason: '' });
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to add unavailability');
      }
    } catch (error) {
      console.error('Error adding unavailability:', error);
      setMessage('Failed to add unavailability');
    }
  };

  const handleDeleteUnavailability = async (id: string) => {
    if (!confirm('Are you sure you want to remove this unavailability?')) {
      return;
    }

    try {
      const token = localStorage.getItem('providerToken');
      const response = await fetch(`/api/providers/availability?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('Unavailability removed successfully');
        loadUnavailableDates();
      } else {
        setMessage('Failed to remove unavailability');
      }
    } catch (error) {
      console.error('Error removing unavailability:', error);
      setMessage('Failed to remove unavailability');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="availability-container">
      <div className="availability-header">
        <h2>Manage Availability</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Block Time'}
        </button>
      </div>

      {message && (
        <div className="message-box">
          {message}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddUnavailability} className="add-form">
          <div className="form-row">
            <div className="form-group">
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date & Time</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData({...formData, allDay: e.target.checked})}
              />
              All Day
            </label>
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <select 
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            >
              <option value="">Select reason...</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Block This Time
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="loading">Loading unavailable dates...</div>
      ) : unavailableDates.length === 0 ? (
        <div className="no-dates">
          <p>No blocked dates. Your full schedule is available for bookings.</p>
        </div>
      ) : (
        <div className="unavailable-list">
          {unavailableDates.map(item => (
            <div key={item.id} className="unavailable-card">
              <div className="date-info">
                <span className="date-range">
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </span>
                {item.reason && (
                  <span className="reason-badge">{item.reason}</span>
                )}
                <span className="all-day-badge">
                  {item.allDay ? 'All Day' : 'Partial'}
                </span>
              </div>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteUnavailability(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="info-section">
        <h3>Important Information</h3>
        <ul>
          <li>Blocking time will prevent customers from booking appointments during those periods</li>
          <li>You cannot block times that already have confirmed appointments</li>
          <li>If you need to cancel existing appointments, do so from the Appointments tab first</li>
          <li>For regular schedule changes, contact the admin to update your working hours</li>
        </ul>
      </div>

      <style jsx>{`
        .availability-container {
          background: white;
          border: 2px solid #8b7355;
          padding: 30px;
        }

        .availability-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .availability-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }

        .add-btn {
          padding: 10px 20px;
          background: #c41e3a;
          color: white;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-btn:hover {
          background: #a01729;
        }

        .message-box {
          padding: 12px;
          background: #e8f5e9;
          border: 1px solid #4caf50;
          color: #2e7d32;
          margin-bottom: 20px;
          text-align: center;
        }

        .add-form {
          background: #f9f9f9;
          padding: 20px;
          border: 2px solid #e0e0e0;
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          color: #2c2c2c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }

        .form-group input[type="datetime-local"],
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 2px solid #8b7355;
          font-size: 14px;
        }

        .form-group input[type="checkbox"] {
          margin-right: 8px;
        }

        .submit-btn {
          padding: 12px 24px;
          background: #4caf50;
          color: white;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover {
          background: #45a049;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-dates {
          text-align: center;
          padding: 40px;
          background: #f0f9ff;
          border: 1px solid #2196f3;
          color: #1976d2;
        }

        .unavailable-list {
          display: grid;
          gap: 12px;
          margin-bottom: 30px;
        }

        .unavailable-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #fff;
          border: 2px solid #e0e0e0;
          transition: all 0.2s ease;
        }

        .unavailable-card:hover {
          border-color: #8b7355;
        }

        .date-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .date-range {
          font-weight: 500;
          color: #2c2c2c;
        }

        .reason-badge {
          padding: 4px 8px;
          background: #8b7355;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 4px;
        }

        .all-day-badge {
          padding: 4px 8px;
          background: #e0e0e0;
          color: #666;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 4px;
        }

        .delete-btn {
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          font-family: 'Oswald', sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: #e53935;
        }

        .info-section {
          background: #fff3e0;
          padding: 20px;
          border: 2px solid #ff9800;
          margin-top: 30px;
        }

        .info-section h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #e65100;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .info-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .info-section li {
          margin-bottom: 8px;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}