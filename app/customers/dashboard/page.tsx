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
  serviceId?: string;
  providerId?: string;
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
    
    // Check for success messages from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('rescheduled') === 'true') {
      // Show success message for reschedule
      setTimeout(() => {
        alert('✅ Your appointment has been successfully rescheduled!');
      }, 500);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      showAuthExpiredMessage();
      return;
    }

    try {
      const response = await fetch('/api/customers/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        localStorage.removeItem('customerToken');
        if (response.status === 401) {
          showAuthExpiredMessage('Your session has expired. Please sign in again.');
        } else {
          showAuthExpiredMessage();
        }
        return;
      }

      const data = await response.json();
      setCustomer(data.customer);
      await loadAppointments(token);
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('customerToken');
      showAuthExpiredMessage('Connection error. Please try signing in again.');
    }
  };

  const showAuthExpiredMessage = (message?: string) => {
    setError(message || 'Please sign in to access your dashboard');
    setLoading(false);
    // Auto-redirect after showing error message
    setTimeout(() => {
      window.location.href = '/customers';
    }, 3000);
  };

  const loadAppointments = async (token: string) => {
    try {
      const response = await fetch('/api/customers/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      } else if (response.status === 404) {
        // No appointments found - this is normal for new customers
        setAppointments([]);
      } else {
        // Only set error for actual server/network issues
        setError('Unable to connect to appointment system');
      }
    } catch (error) {
      // Network or parsing error
      setError('Unable to connect to appointment system');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    window.location.href = '/customers';
  };

  const handleBookAgain = (appointment: Appointment) => {
    // Create a URL with pre-filled service and provider parameters
    const params = new URLSearchParams();
    params.set('service', appointment.serviceName);
    params.set('provider', appointment.providerName);
    
    if (appointment.serviceId) {
      params.set('serviceId', appointment.serviceId);
    }
    if (appointment.providerId) {
      params.set('providerId', appointment.providerId);
    }
    
    window.location.href = `/?${params.toString()}`;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmed) return;

    const token = localStorage.getItem('customerToken');
    if (!token) {
      showAuthExpiredMessage();
      return;
    }

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
      } else if (response.status === 401) {
        localStorage.removeItem('customerToken');
        showAuthExpiredMessage('Your session has expired. Please sign in again.');
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('Cancel appointment error:', error);
      alert('Network error. Please check your connection and try again.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <a
                href="/manage-booking"
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                View My Appointments
              </a>
              <button
                onClick={() => window.location.reload()}
                className="block w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Try Refreshing
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Redirecting automatically in a few seconds...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const { upcoming, today, past, cancelled } = getAppointmentsByStatus();
  const hasAnyAppointments = appointments.length > 0;
  const isNewCustomer = !hasAnyAppointments && !error;

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

        {/* New Customer Welcome */}
        {isNewCustomer && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow p-6 mb-6 text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Boondocks Barbershop!</h2>
              <p className="text-blue-100 mb-4">
                You're all set up! Ready to book your first appointment with our skilled barbers?
              </p>
              <a
                href="/"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium text-lg shadow-lg transition-colors"
              >
                📅 Book Your First Appointment
              </a>
            </div>
          </div>
        )}

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
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNewCustomer ? "Ready for your first cut?" : "No upcoming appointments"}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {isNewCustomer 
                    ? "Book your first appointment and experience the Boondocks difference. Our skilled barbers are ready to give you the perfect cut."
                    : "Schedule your next appointment to keep looking sharp."
                  }
                </p>
              </div>
              <a
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg shadow-sm"
              >
                {isNewCustomer ? "Book Your First Appointment" : "Book Your Next Appointment"}
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
                      {appointment.notes && (
                        <div className="text-xs text-gray-500 mt-1">Notes: {appointment.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/reschedule/${appointment.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
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
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl">✂️</span>
              </div>
              <p className="text-gray-500">
                {isNewCustomer 
                  ? "Your appointment history will appear here after your first visit"
                  : "No appointment history yet"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...past, ...cancelled].sort((a, b) => 
                new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
              ).map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{appointment.serviceName}</div>
                      <div className="text-sm text-gray-600">with {appointment.providerName}</div>
                      <div className="text-sm text-gray-600">
                        {format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')} at {formatTime(appointment.appointmentDate)}
                      </div>
                      <div className="text-sm text-gray-600">{appointment.duration} min • ${appointment.price}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {appointment.status === 'completed' && (
                        <button
                          onClick={() => handleBookAgain(appointment)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 hover:border-blue-300 px-3 py-1 rounded-md transition-colors"
                          title="Book the same service with the same provider"
                        >
                          Book Again
                        </button>
                      )}
                      <span className={getStatusBadge(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
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