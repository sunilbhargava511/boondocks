const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAppointments() {
  console.log('Clearing all existing appointments...');
  
  try {
    const result = await prisma.appointment.deleteMany({});
    console.log(`✅ Cleared ${result.count} appointments from database`);
  } catch (error) {
    console.error('Error clearing appointments:', error);
    process.exit(1);
  }
}

clearAppointments()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });