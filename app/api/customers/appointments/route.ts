import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { requireCustomerAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const customer = requireCustomerAuth(req);
    
    const appointments = await customerManager.getCustomerAppointments(customer.customerId);
    
    // Format appointments for response
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      serviceName: appointment.serviceName,
      providerName: appointment.providerName,
      serviceId: appointment.serviceId,
      providerId: appointment.providerId,
      appointmentDate: appointment.appointmentDate,
      duration: appointment.duration,
      price: appointment.price,
      status: appointment.status,
      bookingCode: appointment.bookingCode,
      notes: appointment.notes
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Error fetching customer appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}