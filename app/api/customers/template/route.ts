import { NextResponse } from 'next/server';

// Generate CSV template for customer import
export async function GET() {
  try {
    // CSV headers based on the customer import format
    const csvHeaders = [
      'First Name',
      'Last Name', 
      'Email',
      'Phone',
      'Date of Birth',
      'Conversation Level',
      'Preferred Provider',
      'Notes',
      'Marketing Consent',
      'SMS Consent', 
      'Email Consent',
      'Preferred Days',
      'Preferred Times',
      'Preferred Services',
      'Allergies/Notes',
      'Special Instructions',
      'Tags'
    ];
    
    // Sample data rows with examples
    const sampleRows = [
      [
        'John',
        'Smith', 
        'john.smith@email.com',
        '555-0123',
        '1985-01-15',
        '2',
        'Jan',
        'Regular customer - prefers morning appointments',
        'true',
        'true',
        'true',
        'monday,wednesday,friday',
        'morning,afternoon',
        'haircut,beard trim',
        'No known allergies',
        'Please use scissors only',
        'regular,loyal'
      ],
      [
        'Jane',
        'Doe',
        'jane.doe@email.com', 
        '555-0456',
        '1992-06-20',
        '3',
        'Dante X',
        'Chatty customer - enjoys conversation',
        'true',
        'false',
        'true',
        'tuesday,thursday',
        'afternoon,evening',
        'color,styling',
        'Sensitive to ammonia',
        'Use organic products when possible',
        'vip,chatty'
      ],
      [
        'Michael',
        'Johnson',
        'michael.johnson@email.com',
        '555-0789',
        '1978-12-03',
        '1',
        'Michelle Connolly',
        'Quiet customer - minimal conversation preferred',
        'false',
        'true',
        'false',
        'saturday',
        'morning',
        'haircut',
        '',
        'Prefers quiet environment',
        'quiet,minimal'
      ]
    ];
    
    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...sampleRows.map(row => 
        row.map(field => 
          // Escape fields that contain commas or quotes
          field.includes(',') || field.includes('"') ? 
            `"${field.replace(/"/g, '""')}"` : 
            field
        ).join(',')
      )
    ].join('\n');
    
    // Add instructions as comments at the top
    const instructions = [
      '# Customer Import Template',
      '# Fill in your customer data below the sample rows',
      '# Required fields: First Name, Last Name, Phone',
      '# Date format: YYYY-MM-DD (e.g., 1985-01-15)',
      '# Conversation Level: 0=Silent, 1=Minimal, 2=Normal, 3=Chatty',
      '# Boolean fields: true/false (Marketing Consent, SMS Consent, Email Consent)',
      '# Multiple values: separate with commas (Preferred Days, Preferred Times, etc.)',
      '# Delete these instruction lines before importing',
      ''
    ].join('\n') + csvContent;
    
    // Return as downloadable CSV file
    return new NextResponse(instructions, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="customer-import-template.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}