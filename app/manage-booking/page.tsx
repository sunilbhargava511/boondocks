'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { setGuestBookingAllowed, getStoredEmail } from '@/lib/guest-cookie';

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
}

const ManageBookingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');

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

      setAppointments(data.appointments || []);
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

  const lookupAppointments = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    await lookupAppointmentsForEmail(email);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh appointments
        await lookupAppointmentsForEmail(email);
        setShowCancelModal(false);
        setSelectedAppointment(null);
      } else {
        setError('Failed to cancel appointment');
      }
    } catch (error) {
      setError('Failed to cancel appointment');
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    // Redirect to booking page with pre-filled info
    const params = new URLSearchParams({
      service: appointment.serviceName,
      serviceId: appointment.id, // We'll need to pass the actual service ID
      reschedule: 'true',
      appointmentId: appointment.id
    });
    window.location.href = `/?${params.toString()}`;
  };

  const handleAddMessage = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setMessage(appointment.notes || '');
    setShowMessageModal(true);
  };

  const saveMessage = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: message }),
      });

      if (response.ok) {
        // Refresh appointments
        await lookupAppointmentsForEmail(email);
        setShowMessageModal(false);
        setSelectedAppointment(null);
        setMessage('');
      } else {
        setError('Failed to save message');
      }
    } catch (error) {
      setError('Failed to save message');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) > new Date() && 
    ['confirmed', 'in_progress'].includes(apt.status)
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) <= new Date() || 
    ['completed', 'cancelled', 'no_show'].includes(apt.status)
  );

  if (!showResults) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-width: 450px; margin: 0 auto;">
          <div className="text-center mb-8">
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              View Your Appointments
            </h1>
            <p style={{ color: '#6b7280' }}>
              Enter your email to see all your bookings
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={lookupAppointments}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8b7355';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#8b7355',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#6d5a42';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#8b7355';
                  }
                }}
              >
                {loading ? 'Looking up...' : 'View My Appointments'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a
              href="/"
              style={{
                fontSize: '14px',
                color: '#6b7280',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              ← Back to Booking
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="text-center mb-8">
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Your Appointments
          </h1>
          <p style={{ color: '#6b7280' }}>
            {email}
          </p>
        </div>

        {appointments.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '48px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              No appointments found for this email address.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                background: '#8b7355',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Book an Appointment
            </a>
          </div>
        ) : (
          <>
            {upcomingAppointments.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px'
                }}>
                  Upcoming Appointments
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '20px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '4px'
                          }}>
                            {appointment.serviceName}
                          </h3>
                          <p style={{ color: '#6b7280', marginBottom: '4px' }}>
                            with {appointment.providerName}
                          </p>
                          <p style={{ color: '#1f2937', fontWeight: '500' }}>
                            {format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: `${getStatusColor(appointment.status)}20`,
                          color: getStatusColor(appointment.status),
                          border: `1px solid ${getStatusColor(appointment.status)}`
                        }}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '16px'
                      }}>
                        {appointment.duration} min • ${appointment.price} • Code: {appointment.bookingCode}
                      </div>
                      
                      {/* Action buttons for upcoming appointments */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => handleRescheduleAppointment(appointment)}
                          style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment)}
                          style={{
                            padding: '8px 16px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddMessage(appointment)}
                          style={{
                            padding: '8px 16px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Add Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastAppointments.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px'
                }}>
                  Past Appointments
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pastAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '2px'
                          }}>
                            {appointment.serviceName}
                          </p>
                          <p style={{ fontSize: '14px', color: '#6b7280' }}>
                            {format(parseISO(appointment.appointmentDate), 'MMM d, yyyy')} • {appointment.providerName}
                          </p>
                        </div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: `${getStatusColor(appointment.status)}15`,
                          color: getStatusColor(appointment.status),
                        }}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => {
              setShowResults(false);
              setEmail('');
              setAppointments([]);
            }}
            style={{
              marginRight: '16px',
              fontSize: '14px',
              color: '#6b7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Look up another email
          </button>
          <a
            href="/"
            style={{
              fontSize: '14px',
              color: '#8b7355',
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Book New Appointment →
          </a>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Cancel Appointment
              </h3>
              <p style={{ marginBottom: '24px', color: '#6b7280' }}>
                Are you sure you want to cancel your appointment for {selectedAppointment?.serviceName} with {selectedAppointment?.providerName}?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancelAppointment}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Add Message
              </h3>
              <p style={{ marginBottom: '12px', color: '#6b7280' }}>
                Add a note for your appointment with {selectedAppointment?.providerName}:
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Special requests, preferences, or notes..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowMessageModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveMessage}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Save Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookingPage;