const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAppointments() {
  console.log('Creating dummy appointments for July and September 2025...');

  // Get all customers (we'll randomly assign them to appointments)
  const customers = await prisma.customer.findMany({
    take: 50
  });

  if (customers.length === 0) {
    console.log('No customers found. Please import customers first.');
    return;
  }

  // Services and their typical durations/prices
  const services = [
    { name: 'Haircut', duration: 30, price: 35 },
    { name: 'Haircut and Beard Trim', duration: 45, price: 45 },
    { name: 'Beard Trim', duration: 20, price: 25 },
    { name: 'Kids Haircut', duration: 30, price: 30 },
    { name: 'Buzz Cut', duration: 20, price: 25 },
    { name: 'Head Shave', duration: 30, price: 35 },
    { name: 'Long Hair Cut', duration: 45, price: 40 }
  ];

  // Provider IDs and names from the database
  const providers = [
    { id: '8', name: 'Anthony Cortez' },
    { id: '5', name: 'Dante X' },
    { id: '3', name: 'Jan' },
    { id: '4', name: 'Jenni Rich' },
    { id: '6', name: 'Pedro Mora' }
  ];

  // Appointment statuses
  const statuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
  
  // Time slots for appointments (in hours)
  const timeSlots = [9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5];

  const appointments = [];

  // Track booked slots to prevent double bookings: "providerId-YYYY-MM-DD-HH:MM"
  const bookedSlots = new Set();

  // Generate appointments for July 2025 (past appointments, mostly completed)
  for (let day = 1; day <= 31; day++) {
    // Skip Sundays (day 6 in 2025 July starts on Tuesday)
    const date = new Date(2025, 6, day); // Month is 0-indexed, so 6 = July
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) continue; // Skip Sundays
    
    // Generate 8-15 appointments per day, but ensure no double bookings
    const maxAttempts = 50; // Prevent infinite loops
    let appointmentsCreated = 0;
    let attempts = 0;
    
    while (appointmentsCreated < 15 && attempts < maxAttempts) {
      attempts++;
      
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      const appointmentDate = new Date(2025, 6, day, Math.floor(timeSlot), (timeSlot % 1) * 60);
      const slotKey = `${provider.id}-${appointmentDate.getFullYear()}-${(appointmentDate.getMonth() + 1).toString().padStart(2, '0')}-${appointmentDate.getDate().toString().padStart(2, '0')}-${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Skip if this provider already has an appointment at this time
      if (bookedSlots.has(slotKey)) {
        continue;
      }
      
      // Mark this slot as booked
      bookedSlots.add(slotKey);
      
      // July appointments are mostly completed or cancelled
      let status = 'completed';
      const statusRoll = Math.random();
      if (statusRoll < 0.1) status = 'cancelled';
      else if (statusRoll < 0.15) status = 'no_show';
      
      appointments.push({
        customerId: customer.id,
        serviceId: `${service.name.replace(/\s+/g, '_').toLowerCase()}`,
        serviceName: service.name,
        providerId: provider.id,
        providerName: provider.name,
        appointmentDate: appointmentDate,
        duration: service.duration,
        price: service.price,
        status: status,
        bookingCode: `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        notes: Math.random() > 0.7 ? 'Regular customer' : null
      });
      
      appointmentsCreated++;
    }
  }

  // Generate appointments for September 2025 (future/current appointments)
  for (let day = 1; day <= 30; day++) {
    const date = new Date(2025, 8, day); // Month 8 = September
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) continue; // Skip Sundays
    
    // Generate 10-20 appointments per day, but ensure no double bookings
    const maxAttempts = 60; // Prevent infinite loops
    let appointmentsCreated = 0;
    let attempts = 0;
    
    while (appointmentsCreated < 20 && attempts < maxAttempts) {
      attempts++;
      
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      const appointmentDate = new Date(2025, 8, day, Math.floor(timeSlot), (timeSlot % 1) * 60);
      const slotKey = `${provider.id}-${appointmentDate.getFullYear()}-${(appointmentDate.getMonth() + 1).toString().padStart(2, '0')}-${appointmentDate.getDate().toString().padStart(2, '0')}-${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Skip if this provider already has an appointment at this time
      if (bookedSlots.has(slotKey)) {
        continue;
      }
      
      // Mark this slot as booked
      bookedSlots.add(slotKey);
      
      // September appointments are mostly confirmed, some completed for early days
      let status = 'confirmed';
      if (day < 6) { // First 5 days might be completed
        const statusRoll = Math.random();
        if (statusRoll < 0.6) status = 'completed';
        else if (statusRoll < 0.1) status = 'cancelled';
        else if (statusRoll < 0.15) status = 'no_show';
      } else {
        const statusRoll = Math.random();
        if (statusRoll < 0.05) status = 'cancelled';
      }
      
      appointments.push({
        customerId: customer.id,
        serviceId: `${service.name.replace(/\s+/g, '_').toLowerCase()}`,
        serviceName: service.name,
        providerId: provider.id,
        providerName: provider.name,
        appointmentDate: appointmentDate,
        duration: service.duration,
        price: service.price,
        status: status,
        bookingCode: `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        notes: Math.random() > 0.8 ? 'First time customer' : Math.random() > 0.6 ? 'Regular' : null
      });
      
      appointmentsCreated++;
    }
  }

  // Add some appointments for today (September 6, 2025)
  const today = new Date(2025, 8, 6);
  const todayAppointments = [];
  
  for (const provider of providers) {
    // Each provider gets 5-8 appointments today, but ensure no double bookings
    const maxAttempts = 30; // Prevent infinite loops
    let appointmentsCreated = 0;
    let attempts = 0;
    
    while (appointmentsCreated < 8 && attempts < maxAttempts) {
      attempts++;
      
      const service = services[Math.floor(Math.random() * services.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      const appointmentDate = new Date(2025, 8, 6, Math.floor(timeSlot), (timeSlot % 1) * 60);
      const slotKey = `${provider.id}-${appointmentDate.getFullYear()}-${(appointmentDate.getMonth() + 1).toString().padStart(2, '0')}-${appointmentDate.getDate().toString().padStart(2, '0')}-${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Skip if this provider already has an appointment at this time
      if (bookedSlots.has(slotKey)) {
        continue;
      }
      
      // Mark this slot as booked
      bookedSlots.add(slotKey);
      
      // Mix of statuses for today
      let status = 'confirmed';
      const currentHour = new Date().getHours();
      if (timeSlot < currentHour) {
        status = Math.random() > 0.9 ? 'no_show' : 'completed';
      } else if (timeSlot === currentHour) {
        status = 'in_progress';
      }
      
      todayAppointments.push({
        customerId: customer.id,
        serviceId: `${service.name.replace(/\s+/g, '_').toLowerCase()}`,
        serviceName: service.name,
        providerId: provider.id,
        providerName: provider.name,
        appointmentDate: appointmentDate,
        duration: service.duration,
        price: service.price,
        status: status,
        bookingCode: `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        notes: null
      });
      
      appointmentsCreated++;
    }
  }

  // Combine all appointments
  const allAppointments = [...appointments, ...todayAppointments];

  console.log(`Creating ${allAppointments.length} appointments...`);

  // Insert appointments in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < allAppointments.length; i += batchSize) {
    const batch = allAppointments.slice(i, i + batchSize);
    await prisma.appointment.createMany({
      data: batch
    });
    console.log(`Created batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(allAppointments.length / batchSize)}`);
  }

  // Get summary statistics
  const julyCount = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: new Date(2025, 6, 1),
        lt: new Date(2025, 7, 1)
      }
    }
  });

  const septemberCount = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: new Date(2025, 8, 1),
        lt: new Date(2025, 9, 1)
      }
    }
  });

  const todayCount = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: new Date(2025, 8, 6, 0, 0, 0),
        lt: new Date(2025, 8, 7, 0, 0, 0)
      }
    }
  });

  console.log('\n✅ Appointment seeding complete!');
  console.log(`📅 July 2025: ${julyCount} appointments`);
  console.log(`📅 September 2025: ${septemberCount} appointments`);
  console.log(`📅 Today (Sept 6): ${todayCount} appointments`);
}

seedAppointments()
  .catch((e) => {
    console.error('Error seeding appointments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });