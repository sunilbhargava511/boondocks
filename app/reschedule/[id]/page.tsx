'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, addDays, startOfDay, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  appointmentDate: string;
  duration: number;
  price: number;
  status: string;
}

interface Provider {
  id: string;
  name: string;
  availability: Record<string, string | null>;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const ReschedulePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      router.push('/customers');
      return;
    }

    try {
      // Verify auth and load appointment
      const [appointmentResponse, providersResponse, servicesResponse] = await Promise.all([
        fetch(`/api/appointments/${appointmentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/providers'),
        fetch('/api/settings')
      ]);

      if (!appointmentResponse.ok) {
        if (appointmentResponse.status === 401) {
          localStorage.removeItem('customerToken');
          router.push('/customers');
          return;
        }
        throw new Error('Failed to load appointment');
      }

      const appointmentData = await appointmentResponse.json();
      const providersData = await providersResponse.json();
      
      // Load services from settings
      const settingsData = await servicesResponse.json();
      const servicesData = JSON.parse(settingsData.services || '[]');

      setAppointment(appointmentData.appointment);
      setProviders(providersData.providers || []);
      setServices(servicesData);
      setSelectedProvider(appointmentData.appointment.providerId);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date: Date, providerId: string) => {
    if (!appointment) return;

    setLoading(true);
    try {
      // Generate time slots based on provider availability (similar to booking widget)
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const provider = providers.find(p => p.id === providerId);
      
      if (!provider) {
        throw new Error('Provider not found');
      }

      const workingHours = provider.availability[dayName as keyof typeof provider.availability];
      const slots = generateTimeSlots(date, provider, workingHours);
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Failed to load available times');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date: Date, provider: Provider, workingHours: string | null): TimeSlot[] => {
    const slots = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
    ];

    if (!workingHours) {
      return slots.map(time => ({ time, available: false }));
    }

    return slots.map((time, index) => {
      const isWithinWorkingHours = isTimeWithinWorkingHours(time, workingHours);
      if (!isWithinWorkingHours) {
        return { time, available: false };
      }

      // Mock availability - in production this would check actual bookings
      const pseudo = Math.sin(date.getTime() + index) * 10000;
      const random = pseudo - Math.floor(pseudo);
      return {
        time,
        available: Math.abs(random) > 0.3 // 70% availability
      };
    });
  };

  const isTimeWithinWorkingHours = (timeSlot: string, workingHours: string): boolean => {
    try {
      const [startStr, endStr] = workingHours.split('-');
      if (!startStr || !endStr) return false;
      
      const slotTime = convertTo24Hour(timeSlot);
      const startTime = convertTo24Hour(startStr.trim());
      const endTime = convertTo24Hour(endStr.trim());
      
      return slotTime >= startTime && slotTime < endTime;
    } catch {
      return false;
    }
  };

  const convertTo24Hour = (timeStr: string): number => {
    try {
      const cleanTime = timeStr.replace(/\s+/g, '').toLowerCase();
      let [time, period] = cleanTime.includes('am') || cleanTime.includes('pm') 
        ? [cleanTime.slice(0, -2), cleanTime.slice(-2)]
        : [cleanTime, ''];
      
      const timeParts = time.split(':');
      let hours = parseInt(timeParts[0]) || 0;
      let minutes = parseInt(timeParts[1]) || 0;
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      return hours * 100 + minutes;
    } catch {
      return 0;
    }
  };

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        router.push('/customers');
        return;
      }

      // Parse selected time and combine with date
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let adjustedHours = hours;
      if (period === 'PM' && hours !== 12) adjustedHours += 12;
      if (period === 'AM' && hours === 12) adjustedHours = 0;
      
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(adjustedHours, minutes, 0, 0);

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentDate: newDateTime.toISOString(),
          providerId: selectedProvider,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reschedule appointment');
      }

      // Success - redirect back to dashboard
      router.push('/customers/dashboard?rescheduled=true');
      
    } catch (error) {
      console.error('Reschedule error:', error);
      setError(error instanceof Error ? error.message : 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 1; i <= 30; i++) {
      dates.push(addDays(today, i));
    }
    
    return dates;
  };

  if (loading && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Appointment Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The appointment you\'re trying to reschedule could not be found.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/customers/dashboard')}
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/customers/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reschedule Appointment</h1>
          <p className="text-gray-600">Choose a new date and time for your appointment</p>
        </div>

        {/* Current Appointment Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Current Appointment</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">Service</div>
              <div className="font-medium">{appointment.serviceName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Provider</div>
              <div className="font-medium">{appointment.providerName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Current Date & Time</div>
              <div className="font-medium">
                {format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')}
                <br />
                {format(parseISO(appointment.appointmentDate), 'h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Duration & Price</div>
              <div className="font-medium">{appointment.duration} min • ${appointment.price}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Reschedule Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Choose New Date & Time</h2>

          <div className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barber
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setSelectedTime(null);
                  if (selectedDate) {
                    loadAvailableSlots(selectedDate, e.target.value);
                  }
                }}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
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

            {/* Time Selection */}
            {selectedDate && selectedProvider && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Times
                </label>
                {loading ? (
                  <div className="text-gray-500 text-sm py-4">Loading available times...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 text-sm border rounded-lg transition-colors ${
                          selectedTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : slot.available
                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm py-4">No available times for this date</div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
              <button
                onClick={() => router.push('/customers/dashboard')}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReschedulePage;