import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appointment = await customerManager.getAppointmentById(params.id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // Check if appointment exists
    const existingAppointment = await customerManager.getAppointmentById(params.id);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // If updating appointment time, check for conflicts
    if (data.appointmentDate || data.duration) {
      const appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : existingAppointment.appointmentDate;
      const duration = data.duration || existingAppointment.duration;
      const providerId = data.providerId || existingAppointment.providerId;

      const hasConflict = await customerManager.checkAppointmentConflict({
        providerId,
        appointmentDate,
        duration,
        excludeId: params.id
      });

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Time slot conflicts with existing appointment' },
          { status: 409 }
        );
      }
    }

    const appointment = await customerManager.updateAppointment(params.id, data);

    // Sync changes to SimplyBook if needed
    if (data.status === 'cancelled') {
      await customerManager.syncAppointmentCancellation(params.id);
    } else if (data.appointmentDate) {
      await customerManager.syncAppointmentReschedule(params.id, new Date(data.appointmentDate));
    }
    
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // Check if appointment exists
    const existingAppointment = await customerManager.getAppointmentById(params.id);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update only the provided fields (typically notes/message)
    const appointment = await customerManager.updateAppointment(params.id, data);
    
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await customerManager.deleteAppointment(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Appointment not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}