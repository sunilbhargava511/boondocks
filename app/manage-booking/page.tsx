'use client';

import React, { useState, useEffect } from 'react';
import { setGuestBookingAllowed, getStoredEmail } from '@/lib/guest-cookie';
import AppointmentManagementPopup from '@/components/AppointmentManagementPopup';

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
  canModify: boolean;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const ManageBookingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Check for stored email and auto-lookup appointments if available
  useEffect(() => {
    const storedEmail = getStoredEmail();
    if (storedEmail) {
      setEmail(storedEmail);
      // Auto-lookup appointments for returning users
      lookupAppointmentsForEmail(storedEmail);
    }
  }, []);

  const lookupAppointmentsForEmail = async (emailAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/by-email?email=${encodeURIComponent(emailAddress)}&upcoming=true&past=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup appointments');
      }

      // Transform appointments to match the popup interface
      const transformedAppointments = (data.appointments || []).map((apt: any) => ({
        ...apt,
        canModify: ['confirmed', 'in_progress'].includes(apt.status) && 
                   new Date(apt.appointmentDate) > new Date()
      }));

      setAppointments(transformedAppointments);
      
      // Create a customer object from the email
      setCustomer({
        id: 'guest',
        firstName: 'Guest',
        lastName: 'User',
        email: emailAddress
      });

      setShowResults(true);
      
      // Store email in cookie for passwordless booking flow
      setGuestBookingAllowed(emailAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewBooking = () => {
    window.location.href = '/';
  };

  const upcomingAppointments = appointments.filter(apt => 
    ['confirmed', 'in_progress'].includes(apt.status) && 
    new Date(apt.appointmentDate) > new Date()
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) <= new Date() || 
    ['completed', 'cancelled', 'no_show'].includes(apt.status)
  );

  if (!customer) {
    // Show email form
    return (
      <AppointmentManagementPopup
        appointments={[]}
        customer={{ id: '', firstName: '', lastName: '', email: '' }}
        onNewBooking={handleNewBooking}
        hasUpcoming={false}
        hasPast={false}
        isFullPage={true}
        email={email}
        onEmailLookup={lookupAppointmentsForEmail}
        showEmailForm={true}
        loading={loading}
        error={error}
      />
    );
  }

  // Show appointments
  return (
    <AppointmentManagementPopup
      appointments={appointments}
      customer={customer}
      onNewBooking={handleNewBooking}
      hasUpcoming={upcomingAppointments.length > 0}
      hasPast={pastAppointments.length > 0}
      isFullPage={true}
      email={email}
      onEmailLookup={lookupAppointmentsForEmail}
      showEmailForm={false}
      loading={loading}
      error={error}
    />
  );
};

export default ManageBookingPage;