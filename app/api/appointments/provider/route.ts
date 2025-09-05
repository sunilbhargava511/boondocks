import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Provider-specific appointments endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Provider-specific time filtering: past 2 weeks + all future
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Build filters for provider view
    const filters = {
      providerId,
      OR: [
        // Past 2 weeks
        {
          appointmentDate: {
            gte: twoWeeksAgo,
            lte: new Date()
          }
        },
        // All future appointments
        {
          appointmentDate: {
            gt: new Date()
          }
        }
      ]
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: filters,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              accountStatus: true,
              noShowCount: true,
              conversationPreference: true,
              notes: true,
            }
          },
        },
        orderBy: [
          { appointmentDate: 'asc' } // Future appointments first, then recent past
        ],
        skip: offset,
        take: limit,
      }),
      prisma.appointment.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Separate past and future appointments for provider view
    const now = new Date();
    const pastAppointments = appointments.filter(apt => apt.appointmentDate <= now);
    const futureAppointments = appointments.filter(apt => apt.appointmentDate > now);

    return NextResponse.json({ 
      appointments: {
        past: pastAppointments,
        future: futureAppointments,
        all: appointments
      },
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      summary: {
        totalPast: pastAppointments.length,
        totalFuture: futureAppointments.length,
        totalAll: total
      }
    });
  } catch (error) {
    console.error('Error fetching provider appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}