import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get provider's appointments
export async function GET(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build filters
    const filters: any = {
      providerId: provider.providerId
    };

    if (startDate || endDate) {
      filters.appointmentDate = {};
      if (startDate) filters.appointmentDate.gte = new Date(startDate);
      if (endDate) filters.appointmentDate.lte = new Date(endDate);
    }

    if (status) {
      filters.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: filters,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            notes: true
          }
        }
      },
      orderBy: { appointmentDate: 'asc' }
    });

    // Get daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        providerId: provider.providerId,
        appointmentDate: {
          gte: today,
          lt: tomorrow
        }
      },
      _count: true
    });

    const stats = {
      today: {
        total: todayStats.reduce((sum, s) => sum + s._count, 0),
        confirmed: todayStats.find(s => s.status === 'confirmed')?._count || 0,
        completed: todayStats.find(s => s.status === 'completed')?._count || 0,
      }
    };

    return NextResponse.json({
      appointments,
      stats
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching provider appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// Cancel an appointment
export async function PUT(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);

    const data = await req.json();
    
    if (!data.appointmentId || !data.action) {
      return NextResponse.json(
        { error: 'Appointment ID and action are required' },
        { status: 400 }
      );
    }

    // Check if appointment belongs to this provider
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: data.appointmentId,
        providerId: provider.providerId
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    // Handle different actions
    let updateData: any = {};
    let notificationMessage = '';

    switch (data.action) {
      case 'cancel':
        updateData.status = 'cancelled';
        updateData.notes = data.reason ? `Cancelled by provider: ${data.reason}` : 'Cancelled by provider';
        notificationMessage = 'Your appointment has been cancelled by the provider';
        break;
      
      case 'complete':
        updateData.status = 'completed';
        notificationMessage = 'Your appointment has been marked as completed';
        break;
      
      case 'no_show':
        updateData.status = 'no_show';
        notificationMessage = 'You were marked as a no-show for your appointment';
        break;
      
      case 'confirm':
        updateData.status = 'confirmed';
        notificationMessage = 'Your appointment has been confirmed';
        break;
      
      case 'reschedule':
        if (!data.newDateTime) {
          return NextResponse.json(
            { error: 'New date and time are required for rescheduling' },
            { status: 400 }
          );
        }
        updateData.appointmentDate = new Date(data.newDateTime);
        updateData.status = 'confirmed'; // Keep confirmed status after reschedule
        const oldDate = new Date(appointment.appointmentDate).toLocaleDateString();
        const newDate = new Date(data.newDateTime).toLocaleDateString();
        const oldTime = new Date(appointment.appointmentDate).toLocaleTimeString();
        const newTime = new Date(data.newDateTime).toLocaleTimeString();
        updateData.notes = appointment.notes ? 
          `${appointment.notes} | Rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newTime}` : 
          `Rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newTime}`;
        notificationMessage = `Your appointment has been rescheduled to ${newDate} at ${newTime}`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: updateData,
      include: {
        customer: true
      }
    });

    // TODO: Send notification to customer (email/SMS)
    console.log(`Would notify customer: ${notificationMessage}`);

    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}