'use client';

import React, { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import { Service, Provider } from '@/lib/types';
import { loadServices, loadProviders, isProviderAvailableOnDay } from '@/lib/data';

interface BookingState {
  service?: Service;
  provider?: Provider;
  date?: Date;
  time?: string;
  price?: number;
}

// Generate deterministic seed for consistent availability
const getSlotSeed = (date: Date, provider?: Provider, service?: Service): number => {
  const dateStr = date.toISOString().split('T')[0];
  const providerId = provider?.id || 'no-provider';
  const serviceId = service?.id || 'no-service';
  const combined = `${dateStr}-${providerId}-${serviceId}`;
  
  // Simple hash function for deterministic randomness
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate mock time slots based on provider and service
const generateTimeSlots = (date: Date, provider?: Provider, service?: Service) => {
  const slots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
  ];
  
  const seed = getSlotSeed(date, provider, service);
  
  // If no provider selected, return base availability
  if (!provider) {
    return slots.map((time, index) => {
      const slotSeed = seed + index;
      const pseudo = Math.sin(slotSeed) * 10000;
      const random = pseudo - Math.floor(pseudo);
      return {
        time,
        available: random > 0.3 // 70% base availability
      };
    });
  }
  
  // Provider-specific availability based on their working hours and service duration
  const serviceDuration = service?.duration || 30;
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  
  // Check if provider is available on this day using the proper function
  if (!isProviderAvailableOnDay(provider, dayName)) {
    return slots.map(time => ({ time, available: false }));
  }
  
  // Get provider's working hours for this day
  const workingHours = provider.availability[dayName as keyof typeof provider.availability];
  
  return slots.map((time, index) => {
    // Check if this time slot falls within provider's working hours
    const isWithinWorkingHours = isTimeWithinWorkingHours(time, workingHours);
    
    if (!isWithinWorkingHours) {
      return { time, available: false };
    }
    
    // For slots within working hours, apply availability logic
    const slotSeed = seed + index;
    const pseudo = Math.sin(slotSeed) * 10000;
    const random = pseudo - Math.floor(pseudo);
    return {
      time,
      // Higher availability when both service and provider are selected
      available: random > (service ? 0.2 : 0.3) // 80% or 70% availability within working hours
    };
  });
};

// Helper function to check if a time slot is within working hours
const isTimeWithinWorkingHours = (timeSlot: string, workingHours: string | null): boolean => {
  if (!workingHours) return false;
  
  // Parse working hours (e.g., "9:00am-8:00pm")
  const [startStr, endStr] = workingHours.split('-');
  if (!startStr || !endStr) return false;
  
  // Convert time slot to 24-hour format for comparison
  const slotTime = convertTo24Hour(timeSlot);
  const startTime = convertTo24Hour(startStr.trim());
  const endTime = convertTo24Hour(endStr.trim());
  
  return slotTime >= startTime && slotTime < endTime;
};

// Convert time string to 24-hour format for comparison
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
    
    return hours * 100 + minutes; // e.g., 14:30 becomes 1430
  } catch (error) {
    console.error('Error parsing time:', timeStr, error);
    return 0;
  }
};

// Get available slot count for a specific date, provider, and service
const getAvailableSlotCount = (date: Date, provider?: Provider, service?: Service): number => {
  const slots = generateTimeSlots(date, provider, service);
  return slots.filter(slot => slot.available).length;
};

export default function BookingWidget() {
  const [booking, setBooking] = useState<BookingState>({});
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [timeSlots, setTimeSlots] = useState<{time: string, available: boolean}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, providersData] = await Promise.all([
          loadServices(),
          loadProviders()
        ]);
        setServices(servicesData);
        setProviders(providersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter available providers (show all available barbers immediately)
  const availableProviders = providers.filter(p => !p.restrictions?.notAcceptingNewClients);

  // Generate time slots when date, provider, or service changes
  useEffect(() => {
    if (booking.date) {
      const slots = generateTimeSlots(booking.date, booking.provider, booking.service);
      setTimeSlots(slots);
    }
  }, [booking.date, booking.provider, booking.service]);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const selectService = (service: Service) => {
    setBooking(prev => ({ 
      ...prev, 
      service, 
      price: service.price,
      provider: undefined, // Reset provider selection
      date: undefined,
      time: undefined
    }));
  };

  const selectProvider = (provider: Provider) => {
    setBooking(prev => ({ ...prev, provider }));
  };

  const selectDate = (date: Date) => {
    setBooking(prev => ({ ...prev, date, time: undefined }));
  };

  const selectTime = (time: string) => {
    setBooking(prev => ({ ...prev, time }));
  };

  const getServicesByCategory = (category: string) => {
    return services.filter(service => service.category === category);
  };

  const confirmBooking = () => {
    if (booking.service && booking.provider && booking.date && booking.time) {
      const dateStr = booking.date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
      
      alert(`Booking Confirmed!\n\nService: ${booking.service.name}\nProvider: ${booking.provider.name}\nDate: ${dateStr}\nTime: ${booking.time}\nTotal: $${booking.price}\n\nThank you for booking with Boondocks Barbershop!`);
    }
  };

  const isBookingComplete = booking.service && booking.provider && booking.date && booking.time;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Loading Boondocks Barbershop</h2>
          <p className="text-gray-300">Preparing your booking experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      {/* Header */}
      <div className="header">
        <div className="logo">Boondocks</div>
        <div className="tagline">Traditional Barbershop • San Carlos</div>
        <a href="/admin" className="admin-link" title="Admin Dashboard">⚙️</a>
      </div>

      <div className="booking-wrapper">
        <div className="booking-content">
          
          {/* Service Selection */}
          <div className="section">
            <h3 className="section-title">Select Service</h3>
            <div className="service-categories">
              
              {/* Hair Services */}
              <div className="category">
                <h4 className="category-title">Hair</h4>
                {getServicesByCategory('Haircuts').map((service) => (
                  <div key={service.id} className="service-item">
                    <input 
                      type="radio" 
                      id={service.id} 
                      name="service"
                      className="service-radio"
                      checked={booking.service?.id === service.id}
                      onChange={() => selectService(service)}
                    />
                    <label htmlFor={service.id} className="service-label">
                      <div className="service-left">
                        <span className="service-name">{service.name}</span>
                        {service.description && (
                          <span className="info-icon">
                            i<span className="info-tooltip">{service.description}</span>
                          </span>
                        )}
                      </div>
                      <div className="service-right">
                        <span className="service-duration">{service.duration} min</span>
                        <span className="service-price">{service.price === 0 ? 'FREE' : `$${service.price}`}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Beard Services */}
              <div className="category">
                <h4 className="category-title">Beard</h4>
                {getServicesByCategory('Beards').map((service) => (
                  <div key={service.id} className="service-item">
                    <input 
                      type="radio" 
                      id={service.id} 
                      name="service"
                      className="service-radio"
                      checked={booking.service?.id === service.id}
                      onChange={() => selectService(service)}
                    />
                    <label htmlFor={service.id} className="service-label">
                      <div className="service-left">
                        <span className="service-name">{service.name}</span>
                        {service.description && (
                          <span className="info-icon">
                            i<span className="info-tooltip">{service.description}</span>
                          </span>
                        )}
                      </div>
                      <div className="service-right">
                        <span className="service-duration">{service.duration} min</span>
                        <span className="service-price">{service.price === 0 ? 'FREE' : `$${service.price}`}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Combo Services */}
              <div className="category">
                <h4 className="category-title">Combos</h4>
                {getServicesByCategory('Combination').map((service) => (
                  <div key={service.id} className="service-item">
                    <input 
                      type="radio" 
                      id={service.id} 
                      name="service"
                      className="service-radio"
                      checked={booking.service?.id === service.id}
                      onChange={() => selectService(service)}
                    />
                    <label htmlFor={service.id} className="service-label">
                      <div className="service-left">
                        <span className="service-name">{service.name}</span>
                        {service.description && (
                          <span className="info-icon">
                            i<span className="info-tooltip">{service.description}</span>
                          </span>
                        )}
                      </div>
                      <div className="service-right">
                        <span className="service-duration">{service.duration} min</span>
                        <span className="service-price">{service.price === 0 ? 'FREE' : `$${service.price}`}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="section barber-section">
            <h3 className="section-title">Select Barber</h3>
            <div className="barber-grid">
              {/* First Available Option */}
              <div 
                className={`barber-card first-available ${booking.provider?.name === 'First Available' ? 'selected' : ''}`}
                onClick={() => selectProvider({ id: 'first-available', name: 'First Available', description: '', notes: '', availability: {} as any })}
              >
                <div className="barber-avatar" style={{fontSize: '16px', background: '#c41e3a', borderColor: '#c41e3a'}}>
                  ANY
                </div>
                <div className="barber-name">First Available</div>
                <div className="barber-info-icon">
                  <span className="barber-tooltip">Book with the next available barber</span>
                </div>
              </div>

              {/* Individual Providers - Show all providers */}
              {providers.map((provider) => {
                const initial = provider.name === 'Jenni Rich' ? 'JR' : provider.name.charAt(0);
                const isUnavailable = provider.restrictions?.notAcceptingNewClients;
                
                return (
                  <div 
                    key={provider.id}
                    className={`barber-card ${isUnavailable ? 'unavailable-barber' : ''} ${booking.provider?.id === provider.id ? 'selected' : ''}`}
                    onClick={() => !isUnavailable && selectProvider(provider)}
                  >
                    <div className="barber-avatar" style={provider.name === 'Jenni Rich' ? {fontSize: '18px'} : {}}>
                      {initial}
                    </div>
                    <div className="barber-name">{provider.name.split(' ')[0]}</div>
                    {isUnavailable && <div className="barber-unavailable">Existing Clients Only</div>}
                    <div className="barber-info-icon">
                      <span className="barber-tooltip">
                        {provider.description || provider.notes || 'Expert barber'}
                        {provider.restrictions?.cashOnly && ' • Cash only'}
                        {provider.restrictions?.noKidsUnder && ` • No kids under ${provider.restrictions.noKidsUnder}`}
                        {provider.restrictions?.conversationPreference && ' • Great conversationalist'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="section">
            <h3 className="section-title">Select Date</h3>
            <div className="date-picker">
              {dates.map((date, index) => {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = date.getDate();
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                const availableSlots = getAvailableSlotCount(date, booking.provider, booking.service);
                const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));
                
                return (
                  <div 
                    key={index}
                    className={`date-item ${booking.date && isSameDay(booking.date, date) ? 'selected' : ''} ${isPastDate ? 'past-date' : ''} ${availableSlots === 0 ? 'no-slots' : ''}`}
                    onClick={() => !isPastDate && availableSlots > 0 && selectDate(date)}
                  >
                    <div className="date-day">{dayName}</div>
                    <div className="date-number">{dayNumber}</div>
                    <div className="date-month">{monthName}</div>
                    <div className="date-slots">
                      {isPastDate ? 'Past' : availableSlots === 0 ? 'Full' : `${availableSlots} slots`}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <h3 className="section-title">Select Time</h3>
            <div className="time-slots">
              {timeSlots.map((slot, index) => (
                <div 
                  key={index}
                  className={`time-slot ${!slot.available ? 'unavailable' : ''} ${booking.time === slot.time ? 'selected' : ''}`}
                  onClick={() => slot.available && selectTime(slot.time)}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="booking-summary">
            <div className="summary-row">
              <span className="summary-label">Service</span>
              <span className="summary-value">{booking.service?.name || 'Not selected'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Barber</span>
              <span className="summary-value">{booking.provider?.name || 'Not selected'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Date & Time</span>
              <span className="summary-value">
                {booking.date && booking.time ? 
                  `${booking.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${booking.time}` : 
                  'Not selected'
                }
              </span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total:</span>
              <span>${booking.price || 0}</span>
            </div>
            <button 
              className="book-button" 
              disabled={!isBookingComplete}
              onClick={confirmBooking}
            >
              Book Appointment
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        .booking-container {
          max-width: 900px;
          margin: 0 auto;
          background: #f5f5f0;
          border-radius: 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 3px solid #8b7355;
          overflow: hidden;
        }

        /* iPhone 15 and mobile optimizations */
        @media (max-width: 430px) {
          .booking-container {
            margin: 0;
            border-left: none;
            border-right: none;
            border-radius: 0;
            min-height: 100vh;
            box-shadow: none;
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }

          /* Improve touch targets and scrolling */
          * {
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: rgba(196, 30, 58, 0.1);
          }
          
          /* Smooth scrolling on iOS */
          .date-picker, 
          .time-slots {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Mobile tooltip improvements */
          .info-icon:active .info-tooltip,
          .barber-info-icon:active .barber-tooltip {
            opacity: 1;
            visibility: visible;
          }
          
          /* Disable hover effects on mobile */
          .service-label:hover,
          .barber-card:hover,
          .date-item:hover,
          .time-slot:hover {
            transform: none;
            box-shadow: none;
          }
          
          /* Enable active states for better feedback */
          .service-label:active {
            background: #fff;
            border-color: #8b7355;
          }
          
          .barber-card:active {
            transform: translateY(1px);
          }
          
          .date-item:active,
          .time-slot:active {
            transform: translateY(1px);
            background: #f0f0f0;
          }
        }

        .booking-wrapper {
          overflow: visible;
        }

        .header {
          background: #2c2c2c;
          color: #f5f5f0;
          padding: 40px 30px;
          text-align: center;
          position: relative;
          border-bottom: 5px solid #8b7355;
        }

        .admin-link {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          text-decoration: none;
          font-size: 16px;
          transition: all 0.2s;
          opacity: 0.5;
        }

        .admin-link:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: repeating-linear-gradient(
            45deg,
            #c41e3a,
            #c41e3a 10px,
            #f5f5f0 10px,
            #f5f5f0 20px,
            #1e4d8b 20px,
            #1e4d8b 30px,
            #f5f5f0 30px,
            #f5f5f0 40px
          );
        }

        .logo {
          font-family: 'Bebas Neue', cursive;
          font-size: 48px;
          font-weight: 400;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: #8b7355;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        @media (max-width: 430px) {
          .header {
            padding: 30px 20px 25px;
          }
          
          .logo {
            font-size: 36px;
            letter-spacing: 2px;
            margin-bottom: 6px;
          }
          
          .tagline {
            font-size: 13px;
          }
        }

        .tagline {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #f5f5f0;
          opacity: 0.8;
        }

        .booking-content {
          padding: 40px 30px;
          background: #f5f5f0;
          overflow: visible;
        }

        @media (max-width: 430px) {
          .booking-content {
            padding: 20px 16px;
          }
        }

        .section {
          margin-bottom: 32px;
          overflow: visible;
        }

        .section-title {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #2c2c2c;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-title::after {
          content: '';
          flex: 1;
          height: 2px;
          background: #8b7355;
        }

        /* Service Categories */
        .service-categories {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          overflow: visible;
        }

        @media (max-width: 768px) {
          .service-categories {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 430px) {
          .service-categories {
            gap: 16px;
            margin-bottom: 24px;
          }
          
          .category {
            padding: 14px;
          }
          
          .category-title {
            font-size: 16px;
            margin-bottom: 12px;
          }
        }

        .category {
          background: white;
          border: 2px solid #8b7355;
          padding: 16px;
          position: relative;
          overflow: visible;
        }

        .category-title {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #8b7355;
          margin-bottom: 12px;
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e5e5;
        }

        .service-item {
          margin-bottom: 6px;
          position: relative;
          z-index: 1;
        }

        .service-item:hover {
          z-index: 10;
        }

        .service-radio {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .service-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          padding-left: 36px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f9f9f9;
          position: relative;
        }

        @media (max-width: 430px) {
          .service-label {
            padding: 14px 12px;
            padding-left: 38px;
            min-height: 50px;
          }
          
          .service-name {
            font-size: 14px;
            line-height: 1.3;
          }
          
          .service-duration {
            font-size: 10px;
          }
          
          .service-price {
            font-size: 13px;
          }
        }

        .service-label::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: 2px solid #8b7355;
          border-radius: 50%;
          background: white;
          transition: all 0.2s ease;
        }

        .service-radio:checked + .service-label::before {
          background: #c41e3a;
          border-color: #c41e3a;
          box-shadow: inset 0 0 0 3px white;
        }

        .service-label:hover {
          border-color: #8b7355;
          background: #fff;
        }

        .service-label:hover::before {
          border-color: #c41e3a;
        }

        .service-radio:checked + .service-label {
          border-color: #c41e3a;
          background: #fff;
          box-shadow: 0 2px 8px rgba(196, 30, 58, 0.1);
        }

        .service-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .service-name {
          font-weight: 500;
          color: #2c2c2c;
          font-size: 13px;
        }

        .info-icon {
          width: 16px;
          height: 16px;
          background: #8b7355;
          color: white;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-style: normal;
          font-weight: bold;
          cursor: help;
          position: relative;
          flex-shrink: 0;
          user-select: none;
        }

        .info-icon:hover {
          background: #c41e3a;
        }

        .info-tooltip {
          position: absolute;
          background: #2c2c2c;
          color: #f5f5f0;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: normal;
          white-space: normal;
          max-width: 250px;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.2s ease;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .info-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #2c2c2c;
        }

        .info-icon:hover .info-tooltip {
          opacity: 1;
          visibility: visible;
        }

        .service-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          margin-left: auto;
        }

        .service-duration {
          font-family: 'Roboto', sans-serif;
          font-size: 11px;
          color: #8b7355;
          font-weight: 500;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .service-price {
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          color: #c41e3a;
          font-size: 14px;
        }

        /* Barber Section */
        .barber-section {
          margin-bottom: 32px;
          overflow: visible;
          position: relative;
          z-index: 100;
        }

        .barber-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 14px;
        }

        @media (max-width: 600px) {
          .barber-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 430px) {
          .barber-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .barber-card {
            min-height: 110px;
            padding: 14px 10px 16px;
          }
          
          .barber-avatar {
            width: 44px;
            height: 44px;
            font-size: 20px;
            margin-bottom: 6px;
          }
          
          .barber-name {
            font-size: 12px;
            line-height: 1.2;
          }
          
          .barber-unavailable {
            font-size: 9px;
          }
          
          .barber-info-icon {
            width: 18px;
            height: 18px;
            font-size: 11px;
          }
        }

        .barber-card {
          text-align: center;
          padding: 16px 12px;
          padding-top: 20px;
          background: white;
          border: 3px solid #8b7355;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: visible;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .barber-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(
            90deg,
            #c41e3a,
            #c41e3a 5px,
            #1e4d8b 5px,
            #1e4d8b 10px
          );
        }

        .barber-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }

        .barber-card.selected {
          border-color: #c41e3a;
          background: #fff;
        }

        .unavailable-barber {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .unavailable-barber:hover {
          transform: none;
          box-shadow: none;
          z-index: 1;
        }

        .first-available {
          border-color: #c41e3a;
        }

        .first-available .barber-name {
          color: #c41e3a;
          font-weight: 600;
        }

        .barber-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #2c2c2c;
          color: #8b7355;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bebas Neue', cursive;
          font-size: 24px;
          margin: 0 auto 8px;
          border: 2px solid #8b7355;
        }

        .barber-name {
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          color: #2c2c2c;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }


        .barber-unavailable {
          font-size: 10px;
          color: #c41e3a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 4px;
        }

        .barber-info-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 16px;
          height: 16px;
          background: #8b7355;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-style: normal;
          font-weight: bold;
          cursor: help;
          z-index: 2;
          user-select: none;
        }

        .barber-info-icon::before {
          content: 'i';
        }

        .barber-info-icon:hover {
          background: #c41e3a;
        }

        .barber-tooltip {
          position: absolute;
          background: #2c2c2c;
          color: #f5f5f0;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: normal;
          white-space: normal;
          max-width: 250px;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.2s ease;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-family: 'Roboto', sans-serif;
          text-transform: none;
          letter-spacing: normal;
          text-align: left;
          line-height: 1.4;
        }

        .barber-tooltip::after {
          content: '';
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-left-color: #2c2c2c;
        }

        .barber-info-icon:hover .barber-tooltip {
          opacity: 1;
          visibility: visible;
        }

        /* Date & Time Selection */
        .date-picker {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding: 4px 0;
        }

        .date-item {
          flex-shrink: 0;
          padding: 16px;
          background: white;
          border: 3px solid #8b7355;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          min-width: 90px;
        }

        @media (max-width: 430px) {
          .date-picker {
            gap: 10px;
            margin-bottom: 20px;
            padding: 4px 2px;
            -webkit-overflow-scrolling: touch;
          }
          
          .date-item {
            min-width: 75px;
            padding: 14px 8px;
            min-height: 48px;
          }
          
          .date-day {
            font-size: 11px;
          }
          
          .date-number {
            font-size: 20px;
          }
          
          .date-slots {
            font-size: 9px;
            padding: 2px 4px;
            margin-top: 3px;
          }
        }

        .date-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .date-item.selected {
          border-color: #c41e3a;
          background: #2c2c2c;
          color: #f5f5f0;
        }

        .date-day {
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
        }

        .date-number {
          font-family: 'Bebas Neue', cursive;
          font-size: 28px;
          margin: 4px 0;
        }

        .date-month {
          font-family: 'Oswald', sans-serif;
          font-size: 11px;
          text-transform: uppercase;
        }

        .date-slots {
          font-family: 'Roboto', sans-serif;
          font-size: 10px;
          margin-top: 4px;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: 500;
          text-transform: lowercase;
        }

        .date-item .date-slots {
          background: rgba(139, 115, 85, 0.1);
          color: #8b7355;
        }

        .date-item.selected .date-slots {
          background: rgba(255, 255, 255, 0.2);
          color: #f5f5f0;
        }

        .date-item.past-date {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .date-item.past-date .date-slots {
          background: rgba(139, 115, 85, 0.1);
          color: #999;
        }

        .date-item.no-slots {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .date-item.no-slots .date-slots {
          background: rgba(196, 30, 58, 0.1);
          color: #c41e3a;
        }

        .time-slots {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }

        @media (max-width: 430px) {
          .time-slots {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }

        .time-slot {
          padding: 14px;
          background: white;
          border: 2px solid #8b7355;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          font-family: 'Oswald', sans-serif;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        @media (max-width: 430px) {
          .time-slot {
            padding: 16px 8px;
            min-height: 48px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .time-slot:hover {
          border-color: #c41e3a;
          transform: translateY(-2px);
        }

        .time-slot.selected {
          border-color: #c41e3a;
          background: #c41e3a;
          color: white;
        }

        .time-slot.unavailable {
          opacity: 0.4;
          cursor: not-allowed;
          background: #e5e5e5;
          text-decoration: line-through;
        }

        /* Booking Summary */
        .booking-summary {
          background: #2c2c2c;
          color: #f5f5f0;
          padding: 30px;
          margin: 40px -30px -40px -30px;
          border-top: 5px solid #8b7355;
        }

        @media (max-width: 430px) {
          .booking-summary {
            padding: 20px 16px;
            margin: 30px -16px -20px -16px;
          }
          
          .summary-row {
            margin-bottom: 14px;
            font-size: 14px;
          }
          
          .book-button {
            padding: 16px 24px !important;
            font-size: 16px !important;
            width: 100% !important;
            min-height: 50px !important;
          }
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 15px;
        }

        .summary-label {
          color: #8b7355;
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .summary-value {
          font-weight: 500;
          color: #f5f5f0;
        }

        .summary-divider {
          height: 2px;
          background: #8b7355;
          margin: 20px 0;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 24px;
          font-family: 'Bebas Neue', cursive;
          letter-spacing: 2px;
          color: #f5f5f0;
        }

        .book-button {
          width: 100%;
          padding: 20px;
          background: #c41e3a;
          color: white;
          border: none;
          font-family: 'Bebas Neue', cursive;
          font-size: 24px;
          letter-spacing: 3px;
          cursor: pointer;
          margin-top: 24px;
          transition: all 0.2s ease;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
        }

        .book-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .book-button:hover::before {
          left: 100%;
        }

        .book-button:hover {
          background: #a01729;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(196, 30, 58, 0.4);
        }

        .book-button:disabled {
          background: #666;
          cursor: not-allowed;
          transform: none;
        }

        .book-button:disabled::before {
          display: none;
        }
      `}</style>
    </div>
  );
}