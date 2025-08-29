import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const includeUpcoming = searchParams.get('upcoming') === 'true';
    const includePast = searchParams.get('past') === 'true';

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get customer by email
    const customer = await customerManager.getCustomerByEmail(email.toLowerCase());
    
    if (!customer) {
      return NextResponse.json({ 
        appointments: [],
        hasUpcoming: false,
        hasPast: false
      });
    }

    // Build filters for appointments
    const now = new Date();
    const filters: any = { customerId: customer.id };
    
    // If specific filter requested, apply date range
    if (includeUpcoming && !includePast) {
      filters.appointmentDate = { gte: now };
      filters.status = { in: ['confirmed', 'in_progress'] };
    } else if (includePast && !includeUpcoming) {
      filters.appointmentDate = { lt: now };
    } else if (!includeUpcoming && !includePast) {
      // Default: only upcoming confirmed appointments
      filters.appointmentDate = { gte: now };
      filters.status = { in: ['confirmed', 'in_progress'] };
    }

    // Get appointments
    const appointments = await customerManager.getAppointments(filters, 50);

    // Separate upcoming and past for metadata
    const allAppointments = await customerManager.getAppointments({ customerId: customer.id }, 100);
    const upcoming = allAppointments.filter(apt => 
      apt.appointmentDate >= now && ['confirmed', 'in_progress'].includes(apt.status)
    );
    const past = allAppointments.filter(apt => 
      apt.appointmentDate < now || ['completed', 'cancelled', 'no_show'].includes(apt.status)
    );

    // Format appointment data
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      serviceName: apt.serviceName,
      providerName: apt.providerName,
      appointmentDate: apt.appointmentDate,
      duration: apt.duration,
      price: apt.price,
      status: apt.status,
      bookingCode: apt.bookingCode,
      notes: apt.notes,
      canModify: apt.appointmentDate > now && ['confirmed'].includes(apt.status)
    }));

    return NextResponse.json({ 
      appointments: formattedAppointments,
      hasUpcoming: upcoming.length > 0,
      hasPast: past.length > 0,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Error fetching appointments by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}