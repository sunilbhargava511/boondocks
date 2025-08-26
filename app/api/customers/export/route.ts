import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { customerManager } from '@/lib/services/customer-manager';
import { CustomerExportOptions } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const options: CustomerExportOptions = await req.json();
    
    // Set defaults
    const exportOptions = {
      format: options.format || 'csv',
      includePreferences: options.includePreferences ?? true,
      includeTags: options.includeTags ?? true,
      includeAppointments: options.includeAppointments ?? false,
      ...options,
    };

    // Build filters
    const filters: any = {};
    
    if (exportOptions.filters?.accountStatus) {
      filters.accountStatus = exportOptions.filters.accountStatus;
    }
    
    if (exportOptions.filters?.minLoyaltyPoints !== undefined) {
      filters.minLoyaltyPoints = exportOptions.filters.minLoyaltyPoints;
    }
    
    if (exportOptions.filters?.noShowThreshold !== undefined) {
      filters.noShowThreshold = exportOptions.filters.noShowThreshold;
    }
    
    if (exportOptions.filters?.tags) {
      filters.tags = exportOptions.filters.tags;
    }
    
    if (exportOptions.dateRange) {
      filters.createdAfter = new Date(exportOptions.dateRange.startDate);
      filters.createdBefore = new Date(exportOptions.dateRange.endDate);
    }

    // Get customers
    const customers = await customerManager.getCustomersWithFilters(filters, 10000); // Max 10k customers

    if (exportOptions.format === 'json') {
      // JSON export
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalCustomers: customers.length,
        filters: exportOptions.filters,
        customers: customers.map(customer => formatCustomerForExport(customer, exportOptions)),
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      // CSV export
      const csvData = customers.map(customer => formatCustomerForCSV(customer, exportOptions));
      const csvContent = Papa.unparse(csvData, { header: true });

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting customers:', error);
    return NextResponse.json(
      { error: 'Failed to export customers' },
      { status: 500 }
    );
  }
}

function formatCustomerForExport(customer: any, options: CustomerExportOptions) {
  const baseData = {
    id: customer.id,
    simplybookId: customer.simplybookId,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    dateOfBirth: customer.dateOfBirth,
    conversationPreference: customer.conversationPreference,
    preferredProviderId: customer.preferredProviderId,
    notes: customer.notes,
    loyaltyPoints: customer.loyaltyPoints,
    totalSpent: customer.totalSpent,
    noShowCount: customer.noShowCount,
    cancellationCount: customer.cancellationCount,
    accountStatus: customer.accountStatus,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    lastVisit: customer.lastVisit,
    marketingConsent: customer.marketingConsent,
    smsConsent: customer.smsConsent,
    emailConsent: customer.emailConsent,
    syncStatus: customer.syncStatus,
  };

  if (options.includePreferences && customer.preferences) {
    baseData.preferences = {
      preferredDays: customer.preferences.preferredDays,
      preferredTimes: customer.preferences.preferredTimes,
      preferredServices: customer.preferences.preferredServices,
      allergiesNotes: customer.preferences.allergiesNotes,
      specialInstructions: customer.preferences.specialInstructions,
    };
  }

  if (options.includeTags && customer.tags) {
    baseData.tags = customer.tags.map((tag: any) => tag.tagName);
  }

  if (options.includeAppointments && customer.appointments) {
    baseData.appointments = customer.appointments;
  }

  return baseData;
}

function formatCustomerForCSV(customer: any, options: CustomerExportOptions) {
  const row: any = {
    'Customer ID': customer.id,
    'SimplyBook ID': customer.simplybookId || '',
    'First Name': customer.firstName,
    'Last Name': customer.lastName,
    'Email': customer.email,
    'Phone': customer.phone,
    'Date of Birth': customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : '',
    'Conversation Preference': customer.conversationPreference,
    'Preferred Provider ID': customer.preferredProviderId || '',
    'Notes': customer.notes || '',
    'Loyalty Points': customer.loyaltyPoints,
    'Total Spent': customer.totalSpent,
    'No Show Count': customer.noShowCount,
    'Cancellation Count': customer.cancellationCount,
    'Account Status': customer.accountStatus,
    'Created At': new Date(customer.createdAt).toISOString(),
    'Updated At': new Date(customer.updatedAt).toISOString(),
    'Last Visit': customer.lastVisit ? new Date(customer.lastVisit).toISOString().split('T')[0] : '',
    'Marketing Consent': customer.marketingConsent,
    'SMS Consent': customer.smsConsent,
    'Email Consent': customer.emailConsent,
    'Sync Status': customer.syncStatus,
  };

  if (options.includePreferences && customer.preferences) {
    row['Preferred Days'] = customer.preferences.preferredDays ? 
      (typeof customer.preferences.preferredDays === 'string' ? 
        customer.preferences.preferredDays : 
        JSON.parse(customer.preferences.preferredDays).join(',')
      ) : '';
    row['Preferred Times'] = customer.preferences.preferredTimes ? 
      (typeof customer.preferences.preferredTimes === 'string' ? 
        customer.preferences.preferredTimes : 
        JSON.parse(customer.preferences.preferredTimes).join(',')
      ) : '';
    row['Preferred Services'] = customer.preferences.preferredServices ? 
      (typeof customer.preferences.preferredServices === 'string' ? 
        customer.preferences.preferredServices : 
        JSON.parse(customer.preferences.preferredServices).join(',')
      ) : '';
    row['Allergies/Notes'] = customer.preferences.allergiesNotes || '';
    row['Special Instructions'] = customer.preferences.specialInstructions || '';
  }

  if (options.includeTags && customer.tags) {
    row['Tags'] = customer.tags.map((tag: any) => tag.tagName).join(',');
  }

  if (options.includeAppointments && customer.appointments) {
    // For CSV, we'll just include appointment count and last appointment date
    row['Total Appointments'] = customer.appointments.length;
    row['Last Appointment Date'] = customer.appointments.length > 0 ? 
      new Date(customer.appointments[0].appointmentDate).toISOString().split('T')[0] : '';
    row['Completed Appointments'] = customer.appointments.filter((apt: any) => apt.status === 'completed').length;
    row['Cancelled Appointments'] = customer.appointments.filter((apt: any) => apt.status === 'cancelled').length;
  }

  return row;
}

// Get export templates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'template') {
      // Generate CSV template with headers
      const templateHeaders = {
        'Customer ID': '',
        'SimplyBook ID': '',
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '555-123-4567',
        'Date of Birth': '1990-01-15',
        'Conversation Preference': '2',
        'Preferred Provider ID': 'provider_123',
        'Notes': 'Sample customer notes',
        'Loyalty Points': '100',
        'Total Spent': '250.00',
        'No Show Count': '0',
        'Cancellation Count': '1',
        'Account Status': 'active',
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString(),
        'Last Visit': '2024-01-15',
        'Marketing Consent': 'true',
        'SMS Consent': 'true',
        'Email Consent': 'true',
        'Sync Status': 'synced',
        'Preferred Days': 'monday,tuesday',
        'Preferred Times': 'morning,afternoon',
        'Preferred Services': 'haircut,beard trim',
        'Allergies/Notes': 'No known allergies',
        'Special Instructions': 'Prefers quiet conversation',
        'Tags': 'vip,regular',
        'Total Appointments': '5',
        'Last Appointment Date': '2024-01-10',
        'Completed Appointments': '4',
        'Cancelled Appointments': '1',
      };

      const csvContent = Papa.unparse([templateHeaders], { header: true });

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="customer-export-template.csv"',
        },
      });
    }

    // Return export options/configuration
    return NextResponse.json({
      formats: ['csv', 'json'],
      availableFields: [
        'basicInfo',
        'contactInfo', 
        'preferences',
        'tags',
        'appointments',
        'loyaltyInfo',
        'consentInfo'
      ],
      filterOptions: {
        accountStatus: ['active', 'suspended', 'blocked'],
        dateRanges: ['lastWeek', 'lastMonth', 'lastYear', 'custom'],
        loyaltyTiers: ['bronze', 'silver', 'gold', 'vip']
      }
    });
  } catch (error) {
    console.error('Error handling export GET request:', error);
    return NextResponse.json(
      { error: 'Failed to handle request' },
      { status: 500 }
    );
  }
}