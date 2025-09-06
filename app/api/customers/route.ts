import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const accountStatus = searchParams.get('status')?.split(',') as ('active' | 'suspended' | 'blocked')[] | undefined;
    const minLoyaltyPoints = searchParams.get('minLoyaltyPoints') ? parseInt(searchParams.get('minLoyaltyPoints')!) : undefined;
    const noShowThreshold = searchParams.get('noShowThreshold') ? parseInt(searchParams.get('noShowThreshold')!) : undefined;
    const tags = searchParams.get('tags')?.split(',');
    const lastVisitAfter = searchParams.get('lastVisitAfter') ? new Date(searchParams.get('lastVisitAfter')!) : undefined;
    const lastVisitBefore = searchParams.get('lastVisitBefore') ? new Date(searchParams.get('lastVisitBefore')!) : undefined;
    const createdAfter = searchParams.get('createdAfter') ? new Date(searchParams.get('createdAfter')!) : undefined;
    const createdBefore = searchParams.get('createdBefore') ? new Date(searchParams.get('createdBefore')!) : undefined;
    
    // Provider-specific filtering
    const providerId = searchParams.get('providerId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const recentMonths = searchParams.get('recentMonths') ? parseInt(searchParams.get('recentMonths')!) : undefined;

    // Handle direct phone or email lookup
    if (phone) {
      const customer = await customerManager.getCustomerByPhone(phone);
      return NextResponse.json({ customer });
    }

    if (email) {
      const customer = await customerManager.getCustomerByEmail(email);
      return NextResponse.json({ customer });
    }

    let customers;
    let totalCount = 0;

    const filters = {
      accountStatus,
      minLoyaltyPoints,
      noShowThreshold,
      tags,
      lastVisitAfter,
      lastVisitBefore,
      createdAfter,
      createdBefore,
      providerId,
      activeOnly,
      recentMonths,
    };

    if (query) {
      // Search customers
      const result = await customerManager.searchCustomers(query, limit, offset, filters);
      customers = result.customers;
      totalCount = result.total;
    } else {
      // Filter customers
      const result = await customerManager.getCustomersWithFilters(filters, limit, offset);
      customers = result.customers;
      totalCount = result.total;
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({ 
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, phone' },
        { status: 400 }
      );
    }

    // Check if customer already exists by phone
    const existingCustomer = await customerManager.getCustomerByPhone(data.phone);
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 409 }
      );
    }

    const customer = await customerManager.createCustomer(data);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}