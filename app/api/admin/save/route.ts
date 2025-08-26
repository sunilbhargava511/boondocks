import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { Provider, Service } from '@/lib/types';

// Helper to generate CSV content for provider availability
function generateProviderCSV(providers: Provider[]): string {
  const rows: any[] = [];
  
  // Header row
  rows.push({
    'Provider Name': 'Provider Name',
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday',
    'Saturday': 'Saturday',
    'Sunday': 'Sunday',
    'Notes': 'Notes'
  });
  
  // Provider rows
  providers.forEach(provider => {
    const notes: string[] = [];
    
    if (provider.restrictions?.notAcceptingNewClients) {
      notes.push('Not accepting new clients');
    }
    if (provider.restrictions?.cashOnly) {
      notes.push('Cash only');
    }
    if (provider.restrictions?.noKidsUnder) {
      notes.push(`No kids under ${provider.restrictions.noKidsUnder}`);
    }
    if (provider.description) {
      notes.push(provider.description);
    }
    
    rows.push({
      'Provider Name': provider.name,
      'Monday': provider.availability.monday || 'Not Available',
      'Tuesday': provider.availability.tuesday || 'Not Available',
      'Wednesday': provider.availability.wednesday || 'Not Available',
      'Thursday': provider.availability.thursday || 'Not Available',
      'Friday': provider.availability.friday || 'Not Available',
      'Saturday': provider.availability.saturday || 'Not Available',
      'Sunday': provider.availability.sunday || 'Not Available',
      'Notes': notes.join(' - ')
    });
  });
  
  return Papa.unparse(rows);
}

// Helper to generate CSV content for service-provider matrix
function generateServiceProviderMatrix(services: Service[], providers: Provider[]): string {
  const rows: any[] = [];
  
  // Create header row with provider names
  const headerRow: any = { 'Service': 'Service' };
  providers.forEach(provider => {
    headerRow[provider.name] = provider.name;
  });
  rows.push(headerRow);
  
  // Add service rows
  services.forEach(service => {
    const row: any = { 'Service': `${service.name} (${service.duration} min)` };
    
    // For each provider, set the price
    providers.forEach(provider => {
      // Use the service price for all providers (can be enhanced later)
      row[provider.name] = `$${service.price}`;
    });
    
    rows.push(row);
  });
  
  return Papa.unparse(rows);
}

export async function POST(req: NextRequest) {
  try {
    const { providers, services } = await req.json();
    
    // Validate data
    if (!providers || !services) {
      return NextResponse.json(
        { error: 'Missing providers or services data' },
        { status: 400 }
      );
    }
    
    // Generate CSV content
    const providerCSV = generateProviderCSV(providers);
    const matrixCSV = generateServiceProviderMatrix(services, providers);
    
    // Define file paths
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const providerPath = path.join(dataDir, 'boondocks_provider_availability.csv');
    const matrixPath = path.join(dataDir, 'boondocks_service_provider_matrix.csv');
    
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Write CSV files
    await Promise.all([
      fs.writeFile(providerPath, providerCSV, 'utf-8'),
      fs.writeFile(matrixPath, matrixCSV, 'utf-8')
    ]);
    
    // Also save JSON backup
    const jsonBackup = {
      providers,
      services,
      lastUpdated: new Date().toISOString()
    };
    
    const backupPath = path.join(dataDir, 'backup.json');
    await fs.writeFile(backupPath, JSON.stringify(jsonBackup, null, 2), 'utf-8');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data saved successfully' 
    });
    
  } catch (error) {
    console.error('Error saving admin data:', error);
    return NextResponse.json(
      { error: 'Failed to save data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}