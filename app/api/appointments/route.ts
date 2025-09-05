import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status')?.split(',');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const providerId = searchParams.get('providerId');
    const serviceId = searchParams.get('serviceId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Time-based filtering for providers
    const recentWeeks = searchParams.get('recentWeeks') ? parseInt(searchParams.get('recentWeeks')!) : undefined;
    const includeFuture = searchParams.get('includeFuture') === 'true';

    // Build filters
    const filters: any = {};
    
    if (customerId) filters.customerId = customerId;
    if (status) filters.status = status.length === 1 ? status[0] : { in: status };
    if (providerId) filters.providerId = providerId;
    if (serviceId) filters.serviceId = serviceId;
    
    // Date filtering
    if (startDate || endDate || recentWeeks || includeFuture) {
      filters.appointmentDate = {};
      
      if (startDate) {
        filters.appointmentDate.gte = new Date(startDate);
      } else if (recentWeeks) {
        // Show appointments from X weeks ago
        const weeksAgo = new Date(Date.now() - recentWeeks * 7 * 24 * 60 * 60 * 1000);
        filters.appointmentDate.gte = weeksAgo;
      }
      
      if (endDate) {
        filters.appointmentDate.lte = new Date(endDate);
      } else if (includeFuture) {
        // Include all future appointments (no end date filter)
      } else if (!endDate && !includeFuture) {
        // If no end date specified and not including future, show up to now
        filters.appointmentDate.lte = new Date();
      }
    }

    const result = await getAppointmentsWithPagination(filters, limit, offset);

    const totalPages = Math.ceil(result.total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({ 
      appointments: result.appointments,
      pagination: {
        page,
        limit,
        totalCount: result.total,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
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

    // Get customer info for blocking checks
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { email: true, phone: true, firstName: true, lastName: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer is on naughty list (blocked)
    const naughtyListEntry = await prisma.providerNaughtyList.findFirst({
      where: {
        providerId: data.providerId,
        OR: [
          { blockedEmail: customer.email },
          { blockedPhone: customer.phone }
        ]
      }
    });

    if (naughtyListEntry) {
      return NextResponse.json(
        { 
          error: `This customer is blocked due to: ${naughtyListEntry.reason}. Contact the provider to resolve.`,
          code: 'CUSTOMER_BLOCKED'
        },
        { status: 403 }
      );
    }

    // Check provider selectivity - if provider is selective, customer must be approved
    const providerAccount = await prisma.providerAccount.findUnique({
      where: { providerId: data.providerId },
      select: { isSelective: true, firstName: true, lastName: true }
    });

    if (providerAccount?.isSelective) {
      // Check if customer is approved for this provider
      const approval = await prisma.providerCustomerApproval.findUnique({
        where: {
          providerId_customerId: {
            providerId: data.providerId,
            customerId: data.customerId
          }
        },
        select: { status: true }
      });

      if (!approval || approval.status !== 'approved') {
        return NextResponse.json(
          { 
            error: `${providerAccount.firstName} ${providerAccount.lastName} is selective and you are not on their approved customer list. Please contact the provider directly.`,
            code: 'PROVIDER_SELECTIVE'
          },
          { status: 403 }
        );
      }
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

async function getAppointmentsWithPagination(
  filters: any, 
  limit: number, 
  offset: number
): Promise<{ appointments: any[]; total: number }> {
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
          }
        },
      },
      orderBy: [
        { appointmentDate: 'desc' }
      ],
      skip: offset,
      take: limit,
    }),
    prisma.appointment.count({ where: filters }),
  ]);

  return { appointments, total };
}