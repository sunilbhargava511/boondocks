import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Filter parameters
    const accountStatus = searchParams.get('status')?.split(',') as ('active' | 'suspended' | 'blocked')[] | undefined;
    const minLoyaltyPoints = searchParams.get('minLoyaltyPoints') ? parseInt(searchParams.get('minLoyaltyPoints')!) : undefined;
    const noShowThreshold = searchParams.get('noShowThreshold') ? parseInt(searchParams.get('noShowThreshold')!) : undefined;
    const tags = searchParams.get('tags')?.split(',');
    const lastVisitAfter = searchParams.get('lastVisitAfter') ? new Date(searchParams.get('lastVisitAfter')!) : undefined;
    const lastVisitBefore = searchParams.get('lastVisitBefore') ? new Date(searchParams.get('lastVisitBefore')!) : undefined;
    const createdAfter = searchParams.get('createdAfter') ? new Date(searchParams.get('createdAfter')!) : undefined;
    const createdBefore = searchParams.get('createdBefore') ? new Date(searchParams.get('createdBefore')!) : undefined;

    let customers;

    if (query) {
      // Search customers
      customers = await customerManager.searchCustomers(query, limit);
    } else if (accountStatus || minLoyaltyPoints || noShowThreshold || tags || lastVisitAfter || lastVisitBefore || createdAfter || createdBefore) {
      // Filter customers
      customers = await customerManager.getCustomersWithFilters({
        accountStatus,
        minLoyaltyPoints,
        noShowThreshold,
        tags,
        lastVisitAfter,
        lastVisitBefore,
        createdAfter,
        createdBefore,
      }, limit);
    } else {
      // Get all customers with basic filters
      customers = await customerManager.getCustomersWithFilters({}, limit);
    }

    return NextResponse.json({ customers });
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
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await customerManager.getCustomerByEmail(data.email);
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
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