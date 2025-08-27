'use client';

import React, { useState } from 'react';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { getSimplyBookAPI } from '@/lib/simplybook-api';

interface Appointment {
  id: string;
  serviceName: string;
  providerName: string;
  appointmentDate: string;
  duration: number;
  price: number;
  status: string;
  bookingCode: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Provider {
  id: string;
  name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const ManageBookingPage: React.FC = () => {
  const [step, setStep] = useState<'lookup' | 'manage' | 'reschedule'>('lookup');
  const [lookupData, setLookupData] = useState({ bookingCode: '', email: '' });
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Reschedule state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const lookupAppointment = async () => {
    if (!lookupData.bookingCode || !lookupData.email) {
      setError('Please enter both booking code and email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup appointment');
      }

      setAppointment(data.appointment);
      setSelectedProvider(data.appointment.providerId || '');
      setStep('manage');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup appointment');
    } finally {
      setLoading(false);
    }
  };

  const startReschedule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load services and providers
      const api = getSimplyBookAPI();
      const [servicesData, providersData] = await Promise.all([
        api.getServices(),
        api.getProviders()
      ]);

      setServices(servicesData);
      setProviders(providersData);
      setStep('reschedule');
    } catch (err) {
      setError('Failed to load reschedule options');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date: Date, providerId: string) => {
    if (!appointment) return;

    setLoading(true);
    try {
      const api = getSimplyBookAPI();
      const currentService = services.find(s => s.name === appointment.serviceName);
      
      if (!currentService) {
        throw new Error('Service not found');
      }

      const slots = await api.getAvailableSlots(
        parseInt(currentService.id.replace('service_', '')),
        parseInt(providerId.replace('provider_', '')),
        format(date, 'yyyy-MM-dd')
      );

      setAvailableSlots(slots);
    } catch (err) {
      setError('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!appointment) return;

    const confirmed = window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      setSuccess('Your appointment has been cancelled successfully.');
      setAppointment({ ...appointment, status: 'cancelled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAppointment = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;

    setLoading(true);
    setError(null);

    try {
      const newDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`);
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: newDateTime.toISOString(),
          providerId: selectedProvider,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reschedule appointment');
      }

      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment.appointment);
      setSuccess('Your appointment has been rescheduled successfully!');
      setStep('manage');
      setSelectedDate(null);
      setSelectedTime(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 1; i <= 30; i++) {
      dates.push(addDays(today, i));
    }
    
    return dates;
  };

  if (step === 'lookup') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Your Booking</h1>
            <p className="text-gray-600">Enter your booking details to view or modify your appointment</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC123XY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={lookupData.bookingCode}
                  onChange={(e) => setLookupData({ ...lookupData, bookingCode: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={lookupData.email}
                  onChange={(e) => setLookupData({ ...lookupData, email: e.target.value })}
                />
              </div>

              <button
                onClick={lookupAppointment}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Looking up...' : 'Find My Appointment'}
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to Booking
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'manage' && appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Appointment</h1>
            <p className="text-gray-600">View details and manage your booking</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Service & Provider</h3>
                <div className="text-gray-600 space-y-1">
                  <div>{appointment.serviceName}</div>
                  <div>with {appointment.providerName}</div>
                  <div>{appointment.duration} minutes • ${appointment.price}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Date & Time</h3>
                <div className="text-gray-600 space-y-1">
                  <div>{format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')}</div>
                  <div>{format(parseISO(appointment.appointmentDate), 'h:mm a')}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Customer</h3>
                <div className="text-gray-600 space-y-1">
                  <div>{appointment.customer.firstName} {appointment.customer.lastName}</div>
                  <div>{appointment.customer.email}</div>
                  <div>{appointment.customer.phone}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Booking Reference</h3>
                <div className="text-gray-600">
                  <div className="font-mono text-lg">{appointment.bookingCode}</div>
                </div>
              </div>
            </div>
          </div>

          {appointment.status === 'confirmed' && (
            <div className="space-y-3">
              <button
                onClick={startReschedule}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Loading...' : 'Reschedule Appointment'}
              </button>

              <button
                onClick={cancelAppointment}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          )}

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setStep('lookup');
                setAppointment(null);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              ← Look up another appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'reschedule' && appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reschedule Appointment</h1>
            <p className="text-gray-600">Choose a new date and time for your {appointment.serviceName}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  if (selectedDate) {
                    loadAvailableSlots(selectedDate, e.target.value);
                  }
                }}
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? parseISO(e.target.value) : null;
                  setSelectedDate(date);
                  setSelectedTime(null);
                  if (date && selectedProvider) {
                    loadAvailableSlots(date, selectedProvider);
                  }
                }}
              >
                <option value="">Select a date</option>
                {generateDateOptions().map((date) => (
                  <option key={format(date, 'yyyy-MM-dd')} value={format(date, 'yyyy-MM-dd')}>
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </option>
                ))}
              </select>
            </div>

            {selectedDate && selectedProvider && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Times
                </label>
                {loading ? (
                  <div className="text-gray-500 text-sm">Loading available times...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-2 text-sm border rounded ${
                          selectedTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : slot.available
                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No available times for this date</div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={rescheduleAppointment}
                disabled={!selectedDate || !selectedTime || loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>

              <button
                onClick={() => setStep('manage')}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ManageBookingPage;