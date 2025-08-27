'use client';

import React, { useState } from 'react';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  marketingConsent: boolean;
  smsConsent: boolean;
}

interface CustomerInfoFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function CustomerInfoForm({ onSubmit, onBack, isSubmitting }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    marketingConsent: false,
    smsConsent: false,
  });

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

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

  return (
    <div className="section">
      <h3 className="section-title">Your Information</h3>
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
              className={`form-input ${errors.phone ? 'error' : ''}`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Special Requests or Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              className="form-input"
              rows={3}
              placeholder="Any special requests, allergies, or preferences..."
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
              onClick={onBack} 
              className="btn-secondary"
              disabled={isSubmitting}
            >
              ← Back to Time Selection
            </button>
            <button 
              type="submit" 
              className={`btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Booking...' : 'Complete Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}