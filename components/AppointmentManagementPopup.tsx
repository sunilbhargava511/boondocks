'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

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

interface AppointmentManagementPopupProps {
  appointments: Appointment[];
  customer: Customer;
  onClose?: () => void;
  onNewBooking: () => void;
  hasUpcoming: boolean;
  hasPast: boolean;
  isFullPage?: boolean;
  email?: string;
  onEmailLookup?: (email: string) => Promise<void>;
  showEmailForm?: boolean;
  loading?: boolean;
  error?: string | null;
}

export default function AppointmentManagementPopup({ 
  appointments, 
  customer, 
  onClose, 
  onNewBooking,
  hasUpcoming,
  hasPast,
  isFullPage = false,
  email = '',
  onEmailLookup,
  showEmailForm = false,
  loading = false,
  error: propError = null
}: AppointmentManagementPopupProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(propError);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [message, setMessage] = useState('');

  const handleReschedule = (appointment: Appointment) => {
    // Redirect to booking page with pre-filled info (matching original behavior)
    const params = new URLSearchParams({
      service: appointment.serviceName,
      serviceId: appointment.id,
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
      setInternalLoading(true);
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: message }),
      });

      if (response.ok) {
        setSuccess('Message saved successfully!');
        setShowMessageModal(false);
        setSelectedAppointment(null);
        setMessage('');
        // Refresh appointments would require re-fetching data
      } else {
        setError('Failed to save message');
      }
    } catch (error) {
      setError('Failed to save message');
    } finally {
      setInternalLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      return;
    }

    setInternalLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      setSuccess('Appointment cancelled successfully. The page will refresh automatically.');
      
      // Refresh after a short delay to show success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setInternalLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' };
      case 'cancelled':
        return { backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' };
      case 'completed':
        return { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' };
      case 'no_show':
        return { backgroundColor: '#f9fafb', color: '#374151', borderColor: '#d1d5db' };
      default:
        return { backgroundColor: '#fefce8', color: '#a16207', borderColor: '#fde047' };
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    ['confirmed', 'in_progress'].includes(apt.status) && 
    new Date(apt.appointmentDate) > new Date()
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) <= new Date() || 
    ['completed', 'cancelled', 'no_show'].includes(apt.status)
  );

  // Email form component for full-page mode
  const EmailForm = () => {
    const [emailInput, setEmailInput] = useState(email);
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onEmailLookup && emailInput.trim()) {
        onEmailLookup(emailInput.trim());
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div style={{ maxWidth: '450px', margin: '0 auto' }}>
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
            {propError && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                {propError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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
  };

  if (isFullPage && showEmailForm) {
    return <EmailForm />;
  }

  const containerStyle = isFullPage ? {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '48px 16px'
  } : {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  return (
    <div style={containerStyle}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: isFullPage ? '12px' : '12px',
        maxWidth: isFullPage ? '800px' : '600px',
        maxHeight: isFullPage ? 'none' : '80vh',
        width: '100%',
        margin: isFullPage ? '0 auto' : '0',
        overflow: isFullPage ? 'visible' : 'hidden',
        boxShadow: isFullPage ? '0 1px 3px rgba(0, 0, 0, 0.1)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: isFullPage ? 'transparent' : '#8b7355'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: isFullPage ? '32px' : '20px',
                fontWeight: '600',
                color: isFullPage ? '#1f2937' : 'white',
                margin: '0 0 4px 0',
                fontFamily: 'Oswald, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Your Appointments
              </h2>
              <p style={{
                fontSize: '14px',
                color: isFullPage ? '#6b7280' : 'rgba(255, 255, 255, 0.9)',
                margin: 0
              }}>
                {isFullPage ? email : `Welcome back, ${customer.firstName}!`}
              </p>
            </div>
            {!isFullPage && onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '18px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {success && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#f0fdf4',
            borderLeft: '4px solid #22c55e',
            color: '#166534',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              backgroundColor: activeTab === 'upcoming' ? '#f9fafb' : 'white',
              borderBottom: activeTab === 'upcoming' ? '2px solid #8b7355' : '2px solid transparent',
              color: activeTab === 'upcoming' ? '#8b7355' : '#6b7280',
              fontWeight: activeTab === 'upcoming' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            disabled={!hasUpcoming}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              backgroundColor: activeTab === 'past' ? '#f9fafb' : 'white',
              borderBottom: activeTab === 'past' ? '2px solid #8b7355' : '2px solid transparent',
              color: activeTab === 'past' ? '#8b7355' : '#6b7280',
              fontWeight: activeTab === 'past' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            disabled={!hasPast}
          >
            Past ({pastAppointments.length})
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: isFullPage ? 'none' : '400px',
          overflowY: isFullPage ? 'visible' : 'auto'
        }}>
          {activeTab === 'upcoming' && (
            <div>
              {upcomingAppointments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: '0 0 16px 0' }}>No upcoming appointments</p>
                  <button
                    onClick={onNewBooking}
                    style={{
                      backgroundColor: '#8b7355',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#6d5a42';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#8b7355';
                    }}
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px'
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
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: '0 0 4px 0'
                          }}>
                            {appointment.serviceName}
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            margin: '0 0 4px 0'
                          }}>
                            with {appointment.providerName}
                          </p>
                          <p style={{
                            fontSize: '14px',
                            color: '#1f2937',
                            margin: 0,
                            fontWeight: '500'
                          }}>
                            {format(parseISO(appointment.appointmentDate), 'EEEE, MMMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: '1px solid',
                            ...getStatusStyle(appointment.status)
                          }}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '12px'
                      }}>
                        {appointment.duration} min • ${appointment.price} • Code: {appointment.bookingCode}
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleAddMessage(appointment)}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: '1px solid #d1d5db',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#4b5563';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#6b7280';
                          }}
                        >
                          Add Message
                        </button>
                        
                        {appointment.canModify && (
                          <>
                            <button
                              onClick={() => handleReschedule(appointment)}
                              style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#3b82f6';
                              }}
                            >
                              Reschedule
                            </button>
                            
                            <button
                              onClick={() => cancelAppointment(appointment.id)}
                              disabled={internalLoading || loading}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: (internalLoading || loading) ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                opacity: (internalLoading || loading) ? 0.5 : 1
                              }}
                              onMouseOver={(e) => {
                                if (!(internalLoading || loading)) {
                                  e.currentTarget.style.backgroundColor = '#dc2626';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!(internalLoading || loading)) {
                                  e.currentTarget.style.backgroundColor = '#ef4444';
                                }
                              }}
                            >
                              {(internalLoading || loading) ? 'Cancelling...' : 'Cancel'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* New booking button at the bottom */}
                  <button
                    onClick={onNewBooking}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#8b7355',
                      border: '2px dashed #8b7355',
                      padding: '16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginTop: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    + Book Another Appointment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div>
              {pastAppointments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: 0 }}>No past appointments</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pastAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '14px',
                        backgroundColor: '#f9fafb'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            margin: '0 0 2px 0'
                          }}>
                            {appointment.serviceName}
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            {format(parseISO(appointment.appointmentDate), 'MMM d, yyyy • h:mm a')} • {appointment.providerName}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            border: '1px solid',
                            ...getStatusStyle(appointment.status)
                          }}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isFullPage ? (
          <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => {
                if (onEmailLookup) {
                  // Reset to email form
                  window.location.reload();
                }
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
        ) : (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: 0
            }}>
              Need help? Call us at {process.env.NEXT_PUBLIC_SHOP_PHONE}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>

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
          zIndex: 2000
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
                disabled={internalLoading || loading}
                style={{
                  padding: '8px 16px',
                  background: (internalLoading || loading) ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (internalLoading || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {(internalLoading || loading) ? 'Saving...' : 'Save Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}