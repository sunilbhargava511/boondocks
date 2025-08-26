import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (customerId) {
      // Sync specific customer
      const success = await customerManager.syncToSimplyBook(customerId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to sync customer to SimplyBook' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: 'Customer synced successfully',
        customerId 
      });
    } else {
      // Sync all pending customers
      const results = await customerManager.syncAllPendingCustomers();
      
      return NextResponse.json({
        message: 'Bulk sync completed',
        results: {
          successful: results.success,
          failed: results.failed,
          total: results.success + results.failed
        }
      });
    }
  } catch (error) {
    console.error('Error syncing customers:', error);
    return NextResponse.json(
      { error: 'Failed to sync customers' },
      { status: 500 }
    );
  }
}