import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function PUT(req: NextRequest) {
  try {
    const { appointmentId, status, notes } = await req.json();

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'appointmentId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show', 'in_progress'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update appointment status
    await customerManager.updateAppointmentStatus(appointmentId, status, notes);

    return NextResponse.json({ 
      message: 'Appointment status updated successfully',
      appointmentId,
      status
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { appointmentIds, status, notes } = await req.json();

    if (!appointmentIds || !Array.isArray(appointmentIds) || !status) {
      return NextResponse.json(
        { error: 'appointmentIds (array) and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show', 'in_progress'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Batch update appointment statuses
    const results = await customerManager.batchUpdateAppointmentStatus(appointmentIds, status, notes);

    return NextResponse.json({
      message: 'Appointment statuses updated successfully',
      results
    });
  } catch (error) {
    console.error('Error batch updating appointment status:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment statuses' },
      { status: 500 }
    );
  }
}