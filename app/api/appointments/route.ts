import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const providerId = searchParams.get('providerId');
    const serviceId = searchParams.get('serviceId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build filters
    const filters: any = {};
    
    if (customerId) filters.customerId = customerId;
    if (status) filters.status = status;
    if (providerId) filters.providerId = providerId;
    if (serviceId) filters.serviceId = serviceId;
    
    if (startDate || endDate) {
      filters.appointmentDate = {};
      if (startDate) filters.appointmentDate.gte = new Date(startDate);
      if (endDate) filters.appointmentDate.lte = new Date(endDate);
    }

    const appointments = await customerManager.getAppointments(filters, limit);

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.customerId || !data.serviceId || !data.providerId || !data.appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, serviceId, providerId, appointmentDate' },
        { status: 400 }
      );
    }

    // Validate appointment date is in the future
    const appointmentDate = new Date(data.appointmentDate);
    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        { error: 'Appointment date must be in the future' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const hasConflict = await customerManager.checkAppointmentConflict({
      providerId: data.providerId,
      appointmentDate,
      duration: data.duration || 30,
      excludeId: null
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing appointment' },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await customerManager.recordAppointment({
      customerId: data.customerId,
      simplybookId: data.simplybookId,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      providerId: data.providerId,
      providerName: data.providerName,
      appointmentDate,
      duration: data.duration || 30,
      price: data.price || 0,
      status: data.status || 'confirmed',
      bookingCode: data.bookingCode,
      notes: data.notes,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}