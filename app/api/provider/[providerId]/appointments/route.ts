import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get appointments for a specific provider (public access for calendar viewing)
export async function GET(
  req: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const { providerId } = await params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Verify provider exists and is active
    const provider = await prisma.providerAccount.findFirst({
      where: { 
        providerId: providerId,
        isActive: true
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Build filters
    const filters: any = {
      providerId: providerId
    };

    if (startDate || endDate) {
      filters.appointmentDate = {};
      if (startDate) filters.appointmentDate.gte = new Date(startDate);
      if (endDate) filters.appointmentDate.lte = new Date(endDate);
    }

    // Fetch appointments
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

    // Get today's stats for the provider
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        providerId: providerId,
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
        cancelled: todayStats.find(s => s.status === 'cancelled')?._count || 0,
        no_show: todayStats.find(s => s.status === 'no_show')?._count || 0,
      }
    };

    return NextResponse.json({
      appointments,
      stats,
      provider: {
        providerId: provider.providerId,
        firstName: provider.firstName,
        lastName: provider.lastName,
        displayName: provider.displayName
      }
    });

  } catch (error) {
    console.error('Error fetching provider appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}