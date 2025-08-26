import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { customerManager } from '@/lib/services/customer-manager';
import { PrismaClient } from '@prisma/client';
import { CSVCustomerRow, CustomerImportMapping } from '@/lib/types';

const prisma = new PrismaClient();

interface ImportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mappingData = formData.get('mapping') as string;
    const createdBy = formData.get('createdBy') as string || 'admin';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Parse column mapping if provided
    let columnMapping: CustomerImportMapping | null = null;
    if (mappingData) {
      try {
        columnMapping = JSON.parse(mappingData);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid column mapping JSON' },
          { status: 400 }
        );
      }
    }

    // Read file content
    const fileContent = await file.text();
    
    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing failed', details: parseResult.errors },
        { status: 400 }
      );
    }

    const rows = parseResult.data as any[];
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Create import job
    const importJob = await prisma.importJob.create({
      data: {
        fileName: file.name,
        status: 'pending',
        totalRows: rows.length,
        createdBy,
      },
    });

    // Start processing in background
    processImportJob(importJob.id, rows, columnMapping);

    return NextResponse.json({
      message: 'Import job started',
      jobId: importJob.id,
      totalRows: rows.length,
    });
  } catch (error) {
    console.error('Error starting import:', error);
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job status
      const job = await prisma.importJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ job });
    } else {
      // Get all jobs
      const jobs = await prisma.importJob.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({ jobs });
    }
  } catch (error) {
    console.error('Error fetching import jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

async function processImportJob(
  jobId: string, 
  rows: any[], 
  columnMapping: CustomerImportMapping | null
) {
  try {
    // Update job status to processing
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    const errors: string[] = [];
    let successCount = 0;
    let processedRows = 0;

    for (const [index, rawRow] of rows.entries()) {
      try {
        // Map columns if mapping is provided
        const mappedRow = columnMapping ? mapRowColumns(rawRow, columnMapping) : rawRow;
        
        // Convert to CSVCustomerRow format
        const customerRow: CSVCustomerRow = {
          firstName: mappedRow.firstName || mappedRow['First Name'] || '',
          lastName: mappedRow.lastName || mappedRow['Last Name'] || '',
          email: mappedRow.email || mappedRow.Email || '',
          phone: mappedRow.phone || mappedRow.Phone || '',
          dateOfBirth: mappedRow.dateOfBirth || mappedRow['Date of Birth'],
          conversationPreference: mappedRow.conversationPreference || mappedRow['Conversation Level'],
          preferredProvider: mappedRow.preferredProvider || mappedRow['Preferred Provider'],
          notes: mappedRow.notes || mappedRow.Notes,
          marketingConsent: mappedRow.marketingConsent || mappedRow['Marketing Consent'],
          smsConsent: mappedRow.smsConsent || mappedRow['SMS Consent'],
          emailConsent: mappedRow.emailConsent || mappedRow['Email Consent'],
          loyaltyPoints: mappedRow.loyaltyPoints || mappedRow['Loyalty Points'],
          totalSpent: mappedRow.totalSpent || mappedRow['Total Spent'],
          preferredDays: mappedRow.preferredDays || mappedRow['Preferred Days'],
          preferredTimes: mappedRow.preferredTimes || mappedRow['Preferred Times'],
          preferredServices: mappedRow.preferredServices || mappedRow['Preferred Services'],
          allergiesNotes: mappedRow.allergiesNotes || mappedRow['Allergies/Notes'],
          specialInstructions: mappedRow.specialInstructions || mappedRow['Special Instructions'],
          tags: mappedRow.tags || mappedRow.Tags,
        };

        // Create customer
        const result = await customerManager.createCustomerFromCSVRow(customerRow, jobId);
        
        if (result.success) {
          successCount++;
        } else {
          errors.push(`Row ${index + 1}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      processedRows++;

      // Update progress every 10 rows
      if (processedRows % 10 === 0) {
        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            processedRows,
            successCount,
            errorCount: errors.length,
            errors: errors.slice(0, 100), // Limit stored errors
          },
        });
      }
    }

    // Final update
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        processedRows,
        successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 100),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error processing import job:', error);
    
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        completedAt: new Date(),
      },
    });
  }
}

function mapRowColumns(row: any, mapping: CustomerImportMapping): any {
  const mappedRow: any = {};
  
  Object.entries(mapping).forEach(([csvColumn, targetField]) => {
    if (row[csvColumn] !== undefined) {
      mappedRow[targetField] = row[csvColumn];
    }
  });

  return mappedRow;
}

// Template generation endpoint
export async function PUT(req: NextRequest) {
  try {
    const templateHeaders = [
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
      'Loyalty Points',
      'Total Spent',
      'Preferred Days',
      'Preferred Times',
      'Preferred Services',
      'Allergies/Notes',
      'Special Instructions',
      'Tags',
    ];

    const templateRow = {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
      'Phone': '555-123-4567',
      'Date of Birth': '1990-01-15',
      'Conversation Level': '2',
      'Preferred Provider': 'Jan',
      'Notes': 'Prefers morning appointments',
      'Marketing Consent': 'true',
      'SMS Consent': 'true',
      'Email Consent': 'true',
      'Loyalty Points': '50',
      'Total Spent': '150.00',
      'Preferred Days': 'monday,tuesday',
      'Preferred Times': 'morning,afternoon',
      'Preferred Services': 'haircut,beard trim',
      'Allergies/Notes': 'Allergic to certain hair products',
      'Special Instructions': 'Please use organic products only',
      'Tags': 'vip,regular',
    };

    const csvContent = Papa.unparse([templateRow], {
      header: true,
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="customer-import-template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}