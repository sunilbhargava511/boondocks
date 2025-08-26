'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Service, Provider, ClientInfo, BookingResult } from '@/lib/types';
import { getSimplyBookAPI, formatDateTimeForAPI } from '@/lib/simplybook-api';

interface BookingConfirmationProps {
  service: Service;
  provider: Provider;
  date: Date;
  time: string;
  clientInfo: ClientInfo;
  onNewBooking: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  service,
  provider,
  date,
  time,
  clientInfo,
  onNewBooking
}) => {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createBooking = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if we have API credentials configured
        const hasApiCredentials = process.env.NEXT_PUBLIC_SIMPLYBOOK_COMPANY_LOGIN && 
                                  process.env.NEXT_PUBLIC_SIMPLYBOOK_API_KEY;

        if (hasApiCredentials) {
          // Use actual API when credentials are available
          const api = getSimplyBookAPI();
          
          const bookingRequest = {
            eventId: parseInt(service.id.replace('service_', '')),
            unitId: parseInt(provider.id.replace('provider_', '')),
            date: format(date, 'yyyy-MM-dd'),
            time: time + ':00',
            clientData: {
              name: clientInfo.name,
              email: clientInfo.email,
              phone: clientInfo.phone
            },
            additional: {
              ...(clientInfo.conversationLevel !== undefined && {
                conversation_level: clientInfo.conversationLevel.toString()
              }),
              ...(clientInfo.notes && { notes: clientInfo.notes })
            }
          };

          const response = await api.createBooking(bookingRequest);
          
          const result: BookingResult = {
            bookingId: response.bookings[0].id,
            bookingCode: response.bookings[0].code,
            status: response.require_confirm ? 'pending' : 'confirmed',
            service,
            provider,
            dateTime: formatDateTimeForAPI(date, time),
            clientInfo
          };

          setBookingResult(result);
        } else {
          // Use mock booking for development
          const mockResult: BookingResult = {
            bookingId: `booking_${Date.now()}`,
            bookingCode: generateBookingCode(),
            status: 'confirmed',
            service,
            provider,
            dateTime: formatDateTimeForAPI(date, time),
            clientInfo
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setBookingResult(mockResult);
        }
      } catch (err) {
        console.error('Booking creation failed:', err);
        setError('Failed to create booking. Please try again or call (650) 597-2454.');
      } finally {
        setLoading(false);
      }
    };

    createBooking();
  }, [service, provider, date, time, clientInfo]);

  const generateBookingCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAddToCalendar = () => {
    const startDate = new Date(`${format(date, 'yyyy-MM-dd')}T${time}:00`);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    
    const title = `${service.name} - Boondocks Barbershop`;
    const details = `Barber: ${provider.name}\\nService: ${service.name}\\nDuration: ${service.duration} minutes\\nPrice: ${service.price === 0 ? 'FREE' : `$${service.price}`}`;
    const location = '1152 Arroyo Ave, San Carlos, CA 94070';
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Booking...</h2>
          <p className="text-gray-600">Please wait while we confirm your appointment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <a
              href="tel:6505972454"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Call (650) 597-2454
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingResult) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-gray-600">
          Your appointment has been successfully scheduled
        </p>
      </div>

      {/* Booking Details */}
      <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-xl font-bold text-green-900 mb-4">Appointment Details</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-green-800 mb-2">Service & Barber</h3>
            <div className="text-green-700 space-y-1">
              <div>{service.name}</div>
              <div>with {provider.name}</div>
              <div>{service.duration} minutes • {service.price === 0 ? 'FREE' : `$${service.price}`}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-green-800 mb-2">Date & Time</h3>
            <div className="text-green-700 space-y-1">
              <div>{format(date, 'EEEE, MMMM d, yyyy')}</div>
              <div>{formatTime(time)}</div>
              <div className="text-sm">Please arrive 5 minutes early</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-green-800 mb-2">Booking Reference</h3>
            <div className="text-green-700">
              <div className="font-mono text-lg">{bookingResult.bookingCode}</div>
              <div className="text-sm">Show this code at your appointment</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-green-800 mb-2">Contact</h3>
            <div className="text-green-700 space-y-1">
              <div>{clientInfo.name}</div>
              <div>{clientInfo.email}</div>
              <div>{clientInfo.phone}</div>
            </div>
          </div>
        </div>
        
        {clientInfo.conversationLevel !== undefined && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-800 mb-1">Conversation Preference</h3>
            <div className="text-blue-700 text-sm">
              Level {clientInfo.conversationLevel}: {
                clientInfo.conversationLevel === 0 ? 'Minimal to no talk' :
                clientInfo.conversationLevel === 1 ? 'Very little conversation' :
                clientInfo.conversationLevel === 2 ? 'Some conversation' :
                'Constant flow of conversation'
              }
            </div>
          </div>
        )}
        
        {clientInfo.notes && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-medium text-gray-800 mb-1">Special Notes</h3>
            <div className="text-gray-700 text-sm">{clientInfo.notes}</div>
          </div>
        )}
      </div>

      {/* Important Reminders */}
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-3">Important Reminders</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li className="flex items-start">
            <svg className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Arrive 5 minutes early to ensure your appointment starts on time
          </li>
          
          {provider.restrictions?.cashOnly && (
            <li className="flex items-start">
              <svg className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
              <span><strong>{provider.name} accepts cash only</strong> - please bring exact payment</span>
            </li>
          )}
          
          {service.name.includes('Teenager Cut') && (
            <li className="flex items-start">
              <svg className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Please bring reference pictures for the best results with your teenager cut
            </li>
          )}
          
          <li className="flex items-start">
            <svg className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Need to reschedule? Call us at (650) 597-2454 at least 24 hours in advance
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCalendar}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
          </svg>
          Add to Calendar
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:6505972454"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Us
          </a>
          
          <button
            onClick={onNewBooking}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Book Another
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Boondocks Barbershop</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>1152 Arroyo Ave, San Carlos, CA 94070</div>
          <div>Phone: (650) 597-2454</div>
          <div className="pt-2">
            <a
              href="https://maps.google.com/?q=1152+Arroyo+Ave,+San+Carlos,+CA+94070"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Get Directions →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;