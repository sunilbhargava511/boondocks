const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importCustomers() {
  console.log('Starting customer import...');
  
  try {
    // Read the CSV file
    const csvPath = path.join(__dirname, '../customers_import.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');
    
    // Skip header row
    const customers = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handling quoted fields)
      const fields = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current); // Add the last field
      
      if (fields.length >= 5) {
        const [customerSince, firstName, lastName, email, mobile] = fields;
        
        // Clean up phone number
        let phone = mobile.replace(/[^\d]/g, '');
        if (phone.length === 10) {
          phone = `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
        }
        
        // Parse customer since date
        let customerSinceDate;
        try {
          customerSinceDate = new Date(customerSince);
          if (isNaN(customerSinceDate.getTime())) {
            customerSinceDate = new Date();
          }
        } catch {
          customerSinceDate = new Date();
        }
        
        if (phone && firstName) {
          customers.push({
            phone: phone,
            firstName: firstName.trim() || 'Unknown',
            lastName: lastName.trim() || '',
            email: email.trim() === '---' ? '' : email.trim(),
            customerSince: customerSinceDate,
          });
        }
      }
    }
    
    console.log(`Parsed ${customers.length} customers from CSV`);
    
    // Insert customers using upsert to avoid duplicates
    let created = 0;
    let updated = 0;
    
    for (const customer of customers) {
      try {
        const result = await prisma.customer.upsert({
          where: { phone: customer.phone },
          update: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            customerSince: customer.customerSince,
          },
          create: customer,
        });
        
        if (result) {
          // Check if it was created or updated (Prisma doesn't easily tell us)
          created++;
        }
      } catch (error) {
        console.error(`Error importing customer ${customer.firstName} ${customer.lastName}:`, error.message);
      }
    }
    
    console.log(`\n✅ Customer import complete!`);
    console.log(`📊 Processed: ${created} customers`);
    
  } catch (error) {
    console.error('Error importing customers:', error);
    process.exit(1);
  }
}

importCustomers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });