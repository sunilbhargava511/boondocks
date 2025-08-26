'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Service, Provider, ClientInfo } from '@/lib/types';

interface BookingFormProps {
  service: Service;
  provider: Provider;
  date: Date;
  time: string;
  onSubmit: (clientInfo: ClientInfo) => void;
  onBack: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  conversationLevel?: number;
  notes?: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  service,
  provider,
  date,
  time,
  onSubmit,
  onBack
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormData>();

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    const clientInfo: ClientInfo = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      conversationLevel: data.conversationLevel,
      notes: data.notes
    };

    try {
      await onSubmit(clientInfo);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          ← Back to Time Selection
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Information
        </h1>
        <p className="text-gray-600">
          Just a few details to complete your booking
        </p>
      </div>

      {/* Booking Summary */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <div><span className="font-medium">Service:</span> {service.name}</div>
          <div><span className="font-medium">Barber:</span> {provider.name}</div>
          <div><span className="font-medium">Date & Time:</span> {format(date, 'EEEE, MMMM d, yyyy')} at {formatTime(time)}</div>
          <div><span className="font-medium">Duration:</span> {service.duration} minutes</div>
          <div><span className="font-medium">Price:</span> {service.price === 0 ? 'FREE' : `$${service.price}`}</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { 
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
            className={`
              w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
              ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className={`
              w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
              ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            We'll send your booking confirmation here
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            {...register('phone', { 
              required: 'Phone number is required',
              pattern: {
                value: /^\(\d{3}\) \d{3}-\d{4}$/,
                message: 'Please enter a valid phone number'
              }
            })}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              e.target.value = formatted;
            }}
            className={`
              w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
              ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="(650) 555-0123"
            maxLength={14}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            For appointment reminders and confirmations
          </p>
        </div>

        {/* Conversation Level (Jan only) */}
        {provider.restrictions?.conversationPreference && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Preference for {provider.name}
            </label>
            <div className="space-y-2">
              {[
                { value: 0, label: 'Minimal to no talk - I prefer quiet' },
                { value: 1, label: 'Very little conversation - Just the basics' },
                { value: 2, label: 'Some conversation - Light chat is nice' },
                { value: 3, label: 'Constant flow of conversation - Let\'s chat!' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    {...register('conversationLevel')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    {option.value}: {option.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-blue-600">
              {provider.name} appreciates knowing your preference ahead of time!
            </p>
          </div>
        )}

        {/* Special Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Special Notes or Requests
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Any special requests, allergies, or preferences..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional - let us know if there's anything special we should know
          </p>
        </div>

        {/* Important Reminders */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Important Reminders:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Please arrive 5 minutes early for your appointment</li>
            {provider.restrictions?.cashOnly && (
              <li>• {provider.name} accepts <strong>cash only</strong></li>
            )}
            {provider.name === 'Jan' && service.name.includes('Kid') && (
              <li>• Kids cuts with Jan take 45 minutes (longer than usual)</li>
            )}
            {service.name.includes('Teenager Cut') && (
              <li>• Please bring reference pictures for the best results</li>
            )}
            <li>• Call (650) 597-2454 if you need to reschedule</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium transition-all
              ${isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Booking...
              </span>
            ) : (
              'Book Appointment →'
            )}
          </button>
        </div>
      </form>

      {/* Contact Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          Questions? Call us at{' '}
          <a href="tel:6505972454" className="font-medium text-blue-600 hover:text-blue-800">
            (650) 597-2454
          </a>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          1152 Arroyo Ave, San Carlos, CA 94070
        </p>
      </div>
    </div>
  );
};

export default BookingForm;