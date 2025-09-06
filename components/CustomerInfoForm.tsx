'use client';

import React, { useState, useEffect } from 'react';
import { setGuestBookingAllowed, isGuestBookingAllowed, getStoredCustomerInfo, updateStoredCustomerInfo } from '@/lib/guest-cookie';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  conversationPreference?: number;
  notes?: string;
  marketingConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
}

interface CustomerInfoFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  prefilledEmail?: string;
  prefilledPhone?: string;
  emailFromCookie?: boolean;
}

export default function CustomerInfoForm({ onSubmit, onBack, isSubmitting, prefilledEmail, prefilledPhone, emailFromCookie }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: prefilledEmail || '',
    phone: prefilledPhone || '',
    dateOfBirth: '',
    conversationPreference: 2, // Default to normal conversation level
    notes: '',
    marketingConsent: false,
    smsConsent: true, // Default to true for SMS reminders
    emailConsent: false,
  });

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [phoneStep, setPhoneStep] = useState(!prefilledPhone); // Skip phone step if phone already provided
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Set prefilled customer data from cookie or fetch from server
  useEffect(() => {
    // First try to get stored customer info from cookie
    const storedInfo = getStoredCustomerInfo();
    
    if (storedInfo) {
      setFormData(prev => ({
        ...prev,
        firstName: storedInfo.firstName || prev.firstName,
        lastName: storedInfo.lastName || prev.lastName,
        phone: storedInfo.phone || prev.phone,
        email: storedInfo.email || prefilledEmail || prev.email,
        smsConsent: true, // Always default to true
      }));
    } else if (prefilledEmail) {
      // If we only have email, try to fetch customer data from server
      setFormData(prev => ({ ...prev, email: prefilledEmail }));
      
      // Fetch customer data by email if they exist in the system
      fetch(`/api/customers/check-email?email=${encodeURIComponent(prefilledEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data.exists) {
            // Customer exists, fetch their full data
            fetch(`/api/customers?email=${encodeURIComponent(prefilledEmail)}`)
              .then(res => res.json())
              .then(result => {
                if (result.customers && result.customers.length > 0) {
                  const customer = result.customers[0];
                  setFormData(prev => ({
                    ...prev,
                    firstName: customer.firstName || prev.firstName,
                    lastName: customer.lastName || prev.lastName,
                    phone: customer.phone || prev.phone,
                    smsConsent: true, // Always default to true
                  }));
                }
              })
              .catch(error => console.error('Error fetching customer data:', error));
          }
        })
        .catch(error => console.error('Error checking customer email:', error));
    }
  }, [prefilledEmail]);

  const checkPhoneNumber = async (phone: string) => {
    if (!phone.trim()) return;
    
    setIsCheckingPhone(true);
    try {
      // Clean phone number for lookup
      const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
      
      const response = await fetch(`/api/customers?phone=${encodeURIComponent(cleanPhone)}`);
      const data = await response.json();
      
      if (response.ok && data.customer) {
        // Existing customer found
        setIsExistingCustomer(true);
        setFormData(prev => ({
          ...prev,
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          email: data.customer.email,
          phone: cleanPhone,
          dateOfBirth: data.customer.dateOfBirth ? new Date(data.customer.dateOfBirth).toISOString().split('T')[0] : '',
          conversationPreference: data.customer.conversationPreference,
          notes: prev.notes, // Keep any new notes
          marketingConsent: data.customer.marketingConsent,
          smsConsent: data.customer.smsConsent,
          emailConsent: data.customer.emailConsent,
        }));
        // Skip to booking confirmation for existing customers
        onSubmit({
          ...formData,
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          email: data.customer.email,
          phone: cleanPhone,
          dateOfBirth: data.customer.dateOfBirth ? new Date(data.customer.dateOfBirth).toISOString().split('T')[0] : '',
          conversationPreference: data.customer.conversationPreference,
          marketingConsent: data.customer.marketingConsent,
          smsConsent: data.customer.smsConsent,
          emailConsent: data.customer.emailConsent,
        });
      } else {
        // New customer - proceed to full information collection
        setIsExistingCustomer(false);
        setFormData(prev => ({ ...prev, phone: cleanPhone }));
        setPhoneStep(false);
      }
    } catch (error) {
      console.error('Error checking phone number:', error);
      // On error, proceed as new customer
      setIsExistingCustomer(false);
      setFormData(prev => ({ ...prev, phone: phone.trim() }));
      setPhoneStep(false);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Update or set passwordless booking cookie with customer info
      if (!isGuestBookingAllowed()) {
        setGuestBookingAllowed(formData.email, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        });
      } else {
        // Update existing cookie with latest customer info
        updateStoredCustomerInfo({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        });
      }
      
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CustomerInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Phone-first step
  if (phoneStep) {
    return (
      <div className="section">
        <h3 className="section-title">Let's Find Your Account</h3>
        <div className="phone-lookup-form">
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              className={`form-input ${errors.phone ? 'error' : ''}`}
              placeholder="(555) 123-4567"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  checkPhoneNumber(formData.phone);
                }
              }}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
            <div className="form-help">
              We'll check if you have an account with us to speed up your booking.
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onBack} 
              className="btn-secondary"
              disabled={isCheckingPhone}
            >
              ← Back to Time Selection
            </button>
            <button 
              type="button" 
              onClick={() => checkPhoneNumber(formData.phone)}
              className={`btn-primary ${isCheckingPhone ? 'loading' : ''}`}
              disabled={isCheckingPhone || !formData.phone.trim()}
            >
              {isCheckingPhone ? 'Checking...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full information form for new customers
  return (
    <div className="section">
      <h3 className="section-title">Complete Your Information</h3>
      <div className="new-customer-welcome">
        <p>Welcome! We'll collect a bit more information to create your account and make future bookings faster.</p>
      </div>
      
      <div className="customer-info-form">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="name-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                className={`form-input ${errors.firstName ? 'error' : ''}`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <span className="error-message">{errors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                className={`form-input ${errors.lastName ? 'error' : ''}`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <span className="error-message">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange('email')}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              className="form-input"
              disabled={true}
              style={{ background: '#f5f5f5', color: '#666' }}
            />
            <div className="form-help">Phone number confirmed</div>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label htmlFor="dateOfBirth" className="form-label">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
              className="form-input"
              max={new Date().toISOString().split('T')[0]}
            />
            <div className="form-help">Helps us provide age-appropriate services</div>
          </div>

          {/* Conversation Preference */}
          <div className="form-group">
            <label className="form-label">
              Conversation Preference
            </label>
            <div className="conversation-options">
              {[
                { value: 0, label: 'Silent', desc: 'I prefer minimal conversation' },
                { value: 1, label: 'Minimal', desc: 'Just the essentials' },
                { value: 2, label: 'Normal', desc: 'Friendly conversation is fine' },
                { value: 3, label: 'Chatty', desc: 'I enjoy good conversation' }
              ].map((option) => (
                <label key={option.value} className="conversation-option">
                  <input
                    type="radio"
                    name="conversationPreference"
                    value={option.value}
                    checked={formData.conversationPreference === option.value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conversationPreference: parseInt(e.target.value)
                    }))}
                  />
                  <span className="conversation-label">
                    <strong>{option.label}</strong>
                    <small>{option.desc}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Special Requests, Allergies, or Preferences (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              className="form-input"
              rows={3}
              placeholder="Any allergies, styling preferences, or special instructions..."
            />
          </div>

          {/* Consent Checkboxes */}
          <div className="consent-section">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="smsConsent"
                checked={formData.smsConsent}
                onChange={handleChange('smsConsent')}
                className="checkbox-input"
              />
              <label htmlFor="smsConsent" className="checkbox-label">
                Send me text message reminders about my appointments
              </label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="emailConsent"
                checked={formData.emailConsent}
                onChange={handleChange('emailConsent')}
                className="checkbox-input"
              />
              <label htmlFor="emailConsent" className="checkbox-label">
                Send me email confirmations and appointment updates
              </label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange('marketingConsent')}
                className="checkbox-input"
              />
              <label htmlFor="marketingConsent" className="checkbox-label">
                I'd like to receive promotional emails and special offers
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setPhoneStep(true)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              ← Back
            </button>
            <button 
              type="submit" 
              className={`btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Complete Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}