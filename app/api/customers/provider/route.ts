import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

// Provider-specific customers endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Provider-specific filters: active customers with appointments in last 3 months
    const filters = {
      providerId,
      activeOnly: true,
      recentMonths: 3,
      accountStatus: ['active'], // Only active customers for providers
    };

    let result;

    if (query) {
      // Search customers for this provider
      result = await customerManager.searchCustomers(query, limit, offset, filters);
    } else {
      // Get all customers for this provider
      result = await customerManager.getCustomersWithFilters(filters, limit, offset);
    }

    const totalPages = Math.ceil(result.total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({ 
      customers: result.customers,
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
    console.error('Error fetching provider customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}