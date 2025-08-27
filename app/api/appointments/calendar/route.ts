import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const providerId = searchParams.get('providerId');
    const view = searchParams.get('view') || 'month'; // day, week, month

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const filters: any = {
      appointmentDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (providerId) {
      filters.providerId = providerId;
    }

    const appointments = await customerManager.getAppointments(filters);

    // Format for calendar display
    const calendarEvents = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.serviceName} - ${appointment.customer?.firstName} ${appointment.customer?.lastName}`,
      start: appointment.appointmentDate,
      end: new Date(appointment.appointmentDate.getTime() + appointment.duration * 60000),
      backgroundColor: getStatusColor(appointment.status),
      borderColor: getStatusColor(appointment.status, true),
      extendedProps: {
        customerId: appointment.customerId,
        customerName: `${appointment.customer?.firstName} ${appointment.customer?.lastName}`,
        customerPhone: appointment.customer?.phone,
        customerEmail: appointment.customer?.email,
        serviceName: appointment.serviceName,
        providerName: appointment.providerName,
        price: appointment.price,
        status: appointment.status,
        notes: appointment.notes,
        bookingCode: appointment.bookingCode,
      }
    }));

    // Get daily statistics
    const dailyStats = await customerManager.getDailyAppointmentStats(new Date(startDate), new Date(endDate));

    return NextResponse.json({
      events: calendarEvents,
      stats: dailyStats,
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

function getStatusColor(status: string, darker: boolean = false): string {
  const colors = {
    confirmed: darker ? '#1976d2' : '#2196f3',
    completed: darker ? '#388e3c' : '#4caf50', 
    cancelled: darker ? '#d32f2f' : '#f44336',
    no_show: darker ? '#f57c00' : '#ff9800',
    in_progress: darker ? '#7b1fa2' : '#9c27b0',
  };
  
  return colors[status as keyof typeof colors] || colors.confirmed;
}