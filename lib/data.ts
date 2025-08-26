import Papa from 'papaparse';
import { Service, Provider, ServiceProviderPrice, ProviderAvailability } from './types';

// Cache for parsed data
let servicesCache: Service[] | null = null;
let providersCache: Provider[] | null = null;
let priceMatrixCache: ServiceProviderPrice[] | null = null;

// Parse CSV data from the service provider matrix
export async function loadServiceProviderMatrix(): Promise<ServiceProviderPrice[]> {
  if (priceMatrixCache) return priceMatrixCache;

  try {
    const response = await fetch('/data/boondocks_service_provider_matrix.csv');
    const csvText = await response.text();
    
    const result = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    const prices: ServiceProviderPrice[] = [];
    
    // Get provider names from row 1 (skip first 5 columns)
    const providerNames = (result.data[0] as string[]).slice(5);
    
    // Skip the provider info rows (first 4 rows) and get service pricing data
    const serviceRows = result.data.slice(4) as string[][];
    
    serviceRows.forEach((row: string[], index: number) => {
      const serviceId = `service_${index + 1}`;
      
      providerNames.forEach((providerName, providerIndex) => {
        const providerId = `provider_${providerIndex + 1}`;
        const priceValue = row[5 + providerIndex]; // Price columns start at index 5
        const price = parseFloat(priceValue || '0');
        
        prices.push({
          serviceId,
          providerId,
          price,
          available: !isNaN(price) && price >= 0
        });
      });
    });

    priceMatrixCache = prices;
    return prices;
  } catch (error) {
    console.error('Error loading service provider matrix:', error);
    return [];
  }
}

// Load services from CSV
export async function loadServices(): Promise<Service[]> {
  if (servicesCache) return servicesCache;

  try {
    const response = await fetch('/data/boondocks_service_provider_matrix.csv');
    const csvText = await response.text();
    
    // Parse CSV without header mode first to get raw data
    const result = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });
    
    // Row 4 (index 3) contains the headers
    const headerRow = result.data[3] as string[];
    const serviceRows = result.data.slice(4) as string[][];
    
    const services: Service[] = serviceRows.map((row: string[], index: number) => ({
      id: `service_${index + 1}`,
      category: row[0] as 'Haircuts' | 'Beards' | 'Combination',
      name: row[1] || '',
      duration: parseInt(row[2]) || 30,
      description: row[3] || '',
      price: parseFloat(row[4]) || 0,
    })).filter(service => service.name); // Filter out empty services

    servicesCache = services;
    return services;
  } catch (error) {
    console.error('Error loading services:', error);
    return [];
  }
}

// Load providers from CSV
export async function loadProviders(): Promise<Provider[]> {
  if (providersCache) return providersCache;

  try {
    // Load provider availability
    const availabilityResponse = await fetch('/data/boondocks_provider_availability.csv');
    const availabilityCsv = await availabilityResponse.text();
    
    const availabilityResult = Papa.parse(availabilityCsv, {
      header: true,
      skipEmptyLines: true,
    });

    // Filter to only actual providers (first 6 rows with valid Provider Name)
    const providerAvailabilityRows = availabilityResult.data.filter((row: any) => 
      row['Provider Name'] && 
      ['Jan', 'Dante X', 'Jenni Rich', 'Pedro Mora', 'Michelle Connolly', 'Anthony Cortez'].includes(row['Provider Name'])
    );

    // Load provider matrix for descriptions (parse as raw data)
    const matrixResponse = await fetch('/data/boondocks_service_provider_matrix.csv');
    const matrixCsv = await matrixResponse.text();
    
    const matrixResult = Papa.parse(matrixCsv, {
      header: false,
      skipEmptyLines: true,
    });

    // Row 1 has provider names, Row 2 has descriptions, Row 3 has notes
    const providerNames = (matrixResult.data[0] as string[]).slice(5); // Skip first 5 columns
    const descriptions = (matrixResult.data[1] as string[]).slice(5);
    const notes = (matrixResult.data[2] as string[]).slice(5);

    const providers: Provider[] = providerNames.map((name, index) => {
      const providerId = `provider_${index + 1}`;
      
      // Find availability data
      const availabilityRow = providerAvailabilityRows.find((row: any) => 
        row['Provider Name'] === name
      ) as any;

      const availability: ProviderAvailability = {
        monday: availabilityRow?.Monday === 'Not Available' ? null : availabilityRow?.Monday || null,
        tuesday: availabilityRow?.Tuesday === 'Not Available' ? null : availabilityRow?.Tuesday || null,
        wednesday: availabilityRow?.Wednesday === 'Not Available' ? null : availabilityRow?.Wednesday || null,
        thursday: availabilityRow?.Thursday === 'Not Available' ? null : availabilityRow?.Thursday || null,
        friday: availabilityRow?.Friday === 'Not Available' ? null : availabilityRow?.Friday || null,
        saturday: availabilityRow?.Saturday === 'Not Available' ? null : availabilityRow?.Saturday || null,
        sunday: availabilityRow?.Sunday === 'Not Available' ? null : availabilityRow?.Sunday || null,
      };

      // Set specific restrictions based on provider
      let restrictions: any = {};
      
      if (name === 'Michelle Connolly') {
        restrictions.notAcceptingNewClients = true;
      }
      if (name === 'Dante X') {
        restrictions.cashOnly = true;
      }
      if (name === 'Anthony Cortez') {
        restrictions.noKidsUnder = 6;
      }
      if (name === 'Jan') {
        restrictions.conversationPreference = true;
      }

      return {
        id: providerId,
        name,
        description: descriptions[index] || '',
        notes: notes[index] || '',
        availability,
        restrictions: Object.keys(restrictions).length > 0 ? restrictions : undefined,
      };
    });

    providersCache = providers;
    return providers;
  } catch (error) {
    console.error('Error loading providers:', error);
    return [];
  }
}

// Get services by category
export function getServicesByCategory(services: Service[], category: string): Service[] {
  return services.filter(service => service.category === category);
}

// Get available providers for a service
export function getAvailableProvidersForService(
  providers: Provider[], 
  priceMatrix: ServiceProviderPrice[], 
  serviceId: string
): Provider[] {
  const availableProviderIds = priceMatrix
    .filter(price => price.serviceId === serviceId && price.available)
    .map(price => price.providerId);
    
  return providers.filter(provider => 
    availableProviderIds.includes(provider.id) &&
    !provider.restrictions?.notAcceptingNewClients
  );
}

// Get price for service-provider combination
export function getServiceProviderPrice(
  priceMatrix: ServiceProviderPrice[], 
  serviceId: string, 
  providerId: string
): number {
  const priceEntry = priceMatrix.find(
    price => price.serviceId === serviceId && price.providerId === providerId
  );
  return priceEntry?.price || 0;
}

// Check if provider is available on a specific day
export function isProviderAvailableOnDay(provider: Provider, dayName: string): boolean {
  const dayKey = dayName.toLowerCase() as keyof ProviderAvailability;
  return provider.availability[dayKey] !== null;
}