import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'boondocks-provider-secret-2024';

// Helper to verify provider from token
function getProviderFromToken(req: NextRequest): any {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// Get provider's unavailable dates
export async function GET(req: NextRequest) {
  try {
    const provider = getProviderFromToken(req);
    if (!provider) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {
      providerId: provider.providerId
    };

    if (startDate || endDate) {
      filters.startDate = {};
      if (startDate) filters.startDate.gte = new Date(startDate);
      if (endDate) filters.startDate.lte = new Date(endDate);
    }

    const unavailableDates = await prisma.providerUnavailability.findMany({
      where: filters,
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json({ unavailableDates });
  } catch (error) {
    console.error('Error fetching unavailable dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unavailable dates' },
      { status: 500 }
    );
  }
}

// Add unavailable date/time
export async function POST(req: NextRequest) {
  try {
    const provider = getProviderFromToken(req);
    if (!provider) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();

    if (!data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.providerId,
        appointmentDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['confirmed', 'in_progress']
        }
      }
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({
        error: `Cannot block this time - you have ${conflictingAppointments.length} appointment(s) scheduled`,
        conflicts: conflictingAppointments.map(apt => ({
          id: apt.id,
          date: apt.appointmentDate,
          service: apt.serviceName,
          customer: apt.customerId
        }))
      }, { status: 409 });
    }

    // Create unavailability record
    const unavailability = await prisma.providerUnavailability.create({
      data: {
        providerId: provider.providerId,
        startDate,
        endDate,
        allDay: data.allDay ?? true,
        reason: data.reason
      }
    });

    return NextResponse.json({ unavailability }, { status: 201 });
  } catch (error) {
    console.error('Error creating unavailability:', error);
    return NextResponse.json(
      { error: 'Failed to create unavailability' },
      { status: 500 }
    );
  }
}

// Delete unavailable date
export async function DELETE(req: NextRequest) {
  try {
    const provider = getProviderFromToken(req);
    if (!provider) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if the unavailability belongs to this provider
    const unavailability = await prisma.providerUnavailability.findFirst({
      where: {
        id,
        providerId: provider.providerId
      }
    });

    if (!unavailability) {
      return NextResponse.json(
        { error: 'Unavailability not found' },
        { status: 404 }
      );
    }

    // Delete the record
    await prisma.providerUnavailability.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Unavailability deleted successfully' });
  } catch (error) {
    console.error('Error deleting unavailability:', error);
    return NextResponse.json(
      { error: 'Failed to delete unavailability' },
      { status: 500 }
    );
  }
}