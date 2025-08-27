'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isPast, isToday, isFuture } from 'date-fns';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: string;
  serviceName: string;
  providerName: string;
  appointmentDate: string;
  duration: number;
  price: number;
  status: string;
  bookingCode: string;
  notes?: string;
}

const CustomerDashboard: React.FC = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      window.location.href = '/customers';
      return;
    }

    try {
      const response = await fetch('/api/customers/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        localStorage.removeItem('customerToken');
        window.location.href = '/customers';
        return;
      }

      const data = await response.json();
      setCustomer(data.customer);
      await loadAppointments(token);
    } catch (error) {
      localStorage.removeItem('customerToken');
      window.location.href = '/customers';
    }
  };

  const loadAppointments = async (token: string) => {
    try {
      const response = await fetch('/api/customers/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      } else {
        setError('Failed to load appointments');
      }
    } catch (error) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    window.location.href = '/customers';
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmed) return;

    const token = localStorage.getItem('customerToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        // Reload appointments
        await loadAppointments(token);
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (error) {
      alert('Failed to cancel appointment');
    }
  };

  const formatTime = (dateStr: string): string => {
    return format(parseISO(dateStr), 'h:mm a');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'no_show':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getAppointmentsByStatus = () => {
    const now = new Date();
    const upcoming = appointments.filter(apt => 
      apt.status === 'confirmed' && isFuture(parseISO(apt.appointmentDate))
    );
    const today = appointments.filter(apt => 
      apt.status === 'confirmed' && isToday(parseISO(apt.appointmentDate))
    );
    const past = appointments.filter(apt => 
      apt.status === 'completed' || isPast(parseISO(apt.appointmentDate))
    );
    const cancelled = appointments.filter(apt => apt.status === 'cancelled');
    
    return { upcoming, today, past, cancelled };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const { upcoming, today, past, cancelled } = getAppointmentsByStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {customer.firstName}!
              </h1>
              <p className="text-gray-600">Manage your appointments at Boondocks Barbershop</p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Book New Appointment
              </a>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{today.length}</div>
            <div className="text-sm text-gray-600">Today's Appointments</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{upcoming.length}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{past.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{cancelled.length}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>

        {/* Today's Appointments */}
        {today.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Appointments</h2>
            <div className="space-y-3">
              {today.map((appointment) => (
                <div key={appointment.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{appointment.serviceName}</div>
                      <div className="text-sm text-gray-600">with {appointment.providerName}</div>
                      <div className="text-sm text-gray-600">
                        {formatTime(appointment.appointmentDate)} • {appointment.duration} min • ${appointment.price}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Booking: {appointment.bookingCode}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No upcoming appointments</p>
              <a
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Book Your Next Appointment
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{appointment.serviceName}</div>
                      <div className="text-sm text-gray-600">with {appointment.providerName}</div>
                      <div className="text-sm text-gray-600">
                        {format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')} at {formatTime(appointment.appointmentDate)}
                      </div>
                      <div className="text-sm text-gray-600">{appointment.duration} min • ${appointment.price}</div>
                      <div className="text-xs text-gray-500 mt-1">Booking: {appointment.bookingCode}</div>
                      {appointment.notes && (
                        <div className="text-xs text-gray-500 mt-1">Notes: {appointment.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Appointment History</h2>
          {past.length === 0 && cancelled.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No appointment history yet</p>
          ) : (
            <div className="space-y-3">
              {[...past, ...cancelled].sort((a, b) => 
                new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
              ).map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{appointment.serviceName}</div>
                      <div className="text-sm text-gray-600">with {appointment.providerName}</div>
                      <div className="text-sm text-gray-600">
                        {format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')} at {formatTime(appointment.appointmentDate)}
                      </div>
                      <div className="text-sm text-gray-600">{appointment.duration} min • ${appointment.price}</div>
                      <div className="text-xs text-gray-500 mt-1">Booking: {appointment.bookingCode}</div>
                    </div>
                    <span className={getStatusBadge(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;