'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { Provider, Service, TimeSlot } from '@/lib/types';
import { isProviderAvailableOnDay } from '@/lib/data';
import { getSimplyBookAPI, formatDateForAPI } from '@/lib/simplybook-api';

interface TimeSlotPickerProps {
  provider: Provider;
  service: Service;
  selectedDate?: Date;
  selectedTime?: string;
  onTimeSelect: (date: Date, time: string) => void;
  onBack: () => void;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  provider,
  service,
  selectedDate,
  selectedTime,
  onTimeSelect,
  onBack
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Start week on Monday
  );
  const [availableSlots, setAvailableSlots] = useState<{ [date: string]: TimeSlot[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => 
    addDays(currentWeekStart, i)
  );

  // Load available time slots for the week
  useEffect(() => {
    const loadAvailableSlots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if we have API credentials configured
        const hasApiCredentials = process.env.NEXT_PUBLIC_SIMPLYBOOK_COMPANY_LOGIN && 
                                  process.env.NEXT_PUBLIC_SIMPLYBOOK_API_KEY;
        
        const slots: { [date: string]: TimeSlot[] } = {};
        
        // Check each day of the week
        for (const date of weekDates) {
          const dateStr = formatDateForAPI(date);
          const dayName = DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Monday start
          
          // Skip if provider not available on this day
          if (!isProviderAvailableOnDay(provider, dayName)) {
            slots[dateStr] = [];
            continue;
          }
          
          // Skip past dates
          if (isBefore(date, startOfDay(new Date()))) {
            slots[dateStr] = [];
            continue;
          }
          
          try {
            if (hasApiCredentials) {
              // Use actual API when credentials are available
              const api = getSimplyBookAPI();
              const availableTimes = await api.getAvailableTimeSlots(
                parseInt(service.id.replace('service_', '')), // Convert to number
                parseInt(provider.id.replace('provider_', '')), // Convert to number
                dateStr,
                dateStr,
                1
              );
              
              const timeSlots: TimeSlot[] = availableTimes[dateStr]?.map(time => ({
                time,
                available: true
              })) || [];
              
              slots[dateStr] = timeSlots;
            } else {
              // Use mock time slots for development
              const mockTimeSlots = generateMockTimeSlots(provider, date, dayName);
              slots[dateStr] = mockTimeSlots;
            }
          } catch (err) {
            console.error(`Error loading slots for ${dateStr}:`, err);
            // Fall back to mock data on API errors
            const mockTimeSlots = generateMockTimeSlots(provider, date, dayName);
            slots[dateStr] = mockTimeSlots;
          }
        }
        
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error loading available slots:', err);
        setError('Failed to load available time slots');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableSlots();
  }, [currentWeekStart, provider, service]);

  // Mock time slot generator (for development without API credentials)
  const generateMockTimeSlots = (provider: Provider, date: Date, dayName: string): TimeSlot[] => {
    const dayAvailability = provider.availability[dayName as keyof typeof provider.availability];
    if (!dayAvailability) return [];

    // Parse working hours (e.g., "9:00am-8:00pm")
    const [startStr, endStr] = dayAvailability.split('-');
    if (!startStr || !endStr) return [];

    // Generate slots every 30 minutes
    const slots: TimeSlot[] = [];
    let currentHour = 9; // Start at 9 AM
    const endHour = endStr.includes('8:00pm') ? 20 : endStr.includes('7:00pm') ? 19 : 18;
    
    while (currentHour < endHour) {
      for (const minutes of ['00', '30']) {
        if (currentHour < endHour || (currentHour === endHour && minutes === '00')) {
          const timeStr = `${currentHour.toString().padStart(2, '0')}:${minutes}`;
          
          // Skip lunch break (1-2 PM)
          if (currentHour === 13) continue;
          
          // Random availability for demo (80% chance available)
          const available = Math.random() > 0.2;
          
          slots.push({
            time: timeStr,
            available
          });
        }
      }
      
      currentHour += 1;
    }
    
    return slots;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = addDays(currentWeekStart, direction === 'next' ? 7 : -7);
    setCurrentWeekStart(newWeekStart);
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  const formatTimeSlot = (time: string): string => {
    const startTime = formatTime(time);
    const endTime = formatTime(calculateEndTime(time, service.duration));
    return `${startTime} - ${endTime}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          ← Back to Barbers
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Date & Time
        </h1>
        <p className="text-gray-600">
          <span className="font-semibold">{provider.name}</span> • {service.name} • {service.duration} min • {service.price === 0 ? 'FREE' : `$${service.price}`}
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigateWeek('prev')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Previous Week
        </button>
        
        <div className="text-lg font-semibold">
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </div>
        
        <button
          onClick={() => navigateWeek('next')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Next Week →
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {weekDates.map((date, index) => {
          const dateStr = formatDateForAPI(date);
          const daySlots = availableSlots[dateStr] || [];
          const availableCount = daySlots.filter(slot => slot.available).length;
          const isToday = isSameDay(date, new Date());
          const isPast = isBefore(date, startOfDay(new Date()));
          const dayName = DAYS_OF_WEEK[index];
          const isProviderAvailable = isProviderAvailableOnDay(provider, dayName);
          
          return (
            <div
              key={dateStr}
              className={`
                p-4 rounded-lg border text-center transition-all
                ${isPast 
                  ? 'bg-gray-100 border-gray-200 opacity-50' 
                  : !isProviderAvailable
                    ? 'bg-red-50 border-red-200'
                    : availableCount > 0
                      ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer'
                      : 'bg-yellow-50 border-yellow-200'
                }
                ${isToday ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              <div className="text-xs font-medium text-gray-600 mb-1">
                {DAY_LABELS[index]}
              </div>
              <div className="text-lg font-bold mb-1">
                {format(date, 'd')}
              </div>
              <div className="text-xs">
                {isPast ? (
                  <span className="text-gray-500">Past</span>
                ) : !isProviderAvailable ? (
                  <span className="text-red-600">Closed</span>
                ) : loading ? (
                  <span className="text-gray-500">Loading...</span>
                ) : availableCount > 0 ? (
                  <span className="text-green-600">{availableCount} slots</span>
                ) : (
                  <span className="text-yellow-600">Booked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Slots for Selected Date */}
      {selectedDate && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">
            Available Times - {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading time slots...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(availableSlots[formatDateForAPI(selectedDate)] || []).map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  className={`
                    p-4 rounded-lg border text-sm font-medium transition-all
                    ${!slot.available
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : selectedTime === slot.time
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 hover:border-blue-300 hover:bg-blue-50'
                    }
                  `}
                  onClick={() => slot.available && onTimeSelect(selectedDate, slot.time)}
                >
                  <div className="text-xs">
                    {formatTimeSlot(slot.time)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Date Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {weekDates.slice(0, 4).map((date) => {
          const dateStr = formatDateForAPI(date);
          const daySlots = availableSlots[dateStr] || [];
          const availableCount = daySlots.filter(slot => slot.available).length;
          const isPast = isBefore(date, startOfDay(new Date()));
          const dayName = DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1];
          const isProviderAvailable = isProviderAvailableOnDay(provider, dayName);
          
          if (isPast || !isProviderAvailable || availableCount === 0) return null;
          
          return (
            <button
              key={dateStr}
              onClick={() => onTimeSelect(date, daySlots.find(slot => slot.available)?.time || '')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="font-semibold text-gray-900">
                {format(date, 'EEEE')}
              </div>
              <div className="text-sm text-gray-600">
                {format(date, 'MMM d')}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Next: {formatTimeSlot(daySlots.find(slot => slot.available)?.time || '')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedDate && selectedTime && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Selected: {format(selectedDate, 'EEEE, MMMM d')} at {formatTime(selectedTime)}
              </h3>
              <p className="text-blue-700 text-sm">
                {provider.name} • {service.name} • {service.duration} minutes
              </p>
            </div>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => onTimeSelect(selectedDate, selectedTime)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Provider Schedule Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">
          {provider.name}'s Schedule
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {Object.entries(provider.availability).map(([day, hours]) => (
            <div key={day} className="flex justify-between">
              <span className="capitalize font-medium">{day.substring(0, 3)}:</span>
              <span className={hours ? 'text-green-600' : 'text-red-600'}>
                {hours || 'Closed'}
              </span>
            </div>
          ))}
        </div>
        
        {provider.restrictions?.cashOnly && (
          <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-800">
            💵 Remember: {provider.name} accepts cash only
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotPicker;