import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function POST(req: NextRequest) {
  try {
    const { bookingCode, email } = await req.json();
    
    if (!bookingCode || !email) {
      return NextResponse.json(
        { error: 'Booking code and email are required' },
        { status: 400 }
      );
    }

    // Find appointment by booking code and customer email
    const appointment = await customerManager.findAppointmentByCode(bookingCode, email);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found. Please check your booking code and email.' },
        { status: 404 }
      );
    }

    // Don't allow changes to completed or cancelled appointments
    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'This appointment cannot be modified as it has already been completed or cancelled.' },
        { status: 400 }
      );
    }

    // Check if appointment is in the past
    const now = new Date();
    if (appointment.appointmentDate < now) {
      return NextResponse.json(
        { error: 'Past appointments cannot be modified.' },
        { status: 400 }
      );
    }

    // Return appointment details without sensitive info
    const appointmentData = {
      id: appointment.id,
      serviceName: appointment.serviceName,
      providerName: appointment.providerName,
      appointmentDate: appointment.appointmentDate,
      duration: appointment.duration,
      price: appointment.price,
      status: appointment.status,
      bookingCode: appointment.bookingCode,
      customer: {
        firstName: appointment.customer.firstName,
        lastName: appointment.customer.lastName,
        email: appointment.customer.email,
        phone: appointment.customer.phone
      }
    };

    return NextResponse.json({ appointment: appointmentData });
  } catch (error) {
    console.error('Error looking up appointment:', error);
    return NextResponse.json(
      { error: 'Failed to lookup appointment' },
      { status: 500 }
    );
  }
}