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
  onClose: () => void;
  onNewBooking: () => void;
  hasUpcoming: boolean;
  hasPast: boolean;
}

export default function AppointmentManagementPopup({ 
  appointments, 
  customer, 
  onClose, 
  onNewBooking,
  hasUpcoming,
  hasPast 
}: AppointmentManagementPopupProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReschedule = (appointmentId: string) => {
    // Open reschedule page in new tab
    window.open(`/reschedule/${appointmentId}`, '_blank');
  };

  const handleViewDetails = (bookingCode: string) => {
    // Open manage booking page in new tab
    window.open(`/manage-booking?code=${bookingCode}&email=${customer.email}`, '_blank');
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
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
      setLoading(false);
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

  return (
    <div style={{
      position: 'fixed',
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        maxHeight: '80vh',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#8b7355'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                margin: '0 0 4px 0',
                fontFamily: 'Oswald, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Your Appointments
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0
              }}>
                Welcome back, {customer.firstName}!
              </p>
            </div>
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
          maxHeight: '400px',
          overflowY: 'auto'
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
                          onClick={() => handleViewDetails(appointment.bookingCode)}
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }}
                        >
                          View Details
                        </button>
                        
                        {appointment.canModify && (
                          <>
                            <button
                              onClick={() => handleReschedule(appointment.id)}
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
                              disabled={loading}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                opacity: loading ? 0.5 : 1
                              }}
                              onMouseOver={(e) => {
                                if (!loading) {
                                  e.currentTarget.style.backgroundColor = '#dc2626';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!loading) {
                                  e.currentTarget.style.backgroundColor = '#ef4444';
                                }
                              }}
                            >
                              {loading ? 'Cancelling...' : 'Cancel'}
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
        </div>
      </div>
    </div>
  );
}