import { NextRequest, NextResponse } from 'next/server';
import { enhancedAPI } from '@/lib/enhanced-simplybook-api';

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    
    switch (action) {
      case 'syncProviders':
        const providers = await enhancedAPI.getRealProviders();
        return NextResponse.json({ success: true, providers });
        
      case 'syncServices':
        const services = await enhancedAPI.getRealServices();
        return NextResponse.json({ success: true, services });
        
      case 'getProviderHours':
        if (!data.providerId) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const hours = await enhancedAPI.getProviderWorkingHours(data.providerId);
        return NextResponse.json({ success: true, hours });
        
      case 'updateProviderHours':
        if (!data.providerId || !data.hours) {
          return NextResponse.json({ error: 'Provider ID and hours required' }, { status: 400 });
        }
        const updated = await enhancedAPI.updateProviderWorkingHours(data.providerId, data.hours);
        return NextResponse.json({ success: updated });
        
      case 'getBookingStats':
        const stats = await enhancedAPI.getBookingStats(
          data.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          data.endDate || new Date().toISOString().split('T')[0]
        );
        return NextResponse.json({ success: true, stats });
        
      case 'getRecentBookings':
        const bookings = await enhancedAPI.getRecentBookings(data.limit || 10);
        return NextResponse.json({ success: true, bookings });
        
      case 'getCompanyInfo':
        const companyInfo = await enhancedAPI.getCompanyDetails();
        return NextResponse.json({ success: true, companyInfo });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Sync operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}