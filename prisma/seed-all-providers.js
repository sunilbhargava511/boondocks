const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedProviders() {
  try {
    console.log('🌱 Seeding all provider accounts with complete profiles...\n');
    
    // Password for all providers
    const password = 'bd25';
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Complete provider data from CSV files
    const providers = [
      {
        providerId: '3',
        email: 'jan@boondocks.com',
        firstName: 'Jan',
        lastName: 'Barber',
        displayName: 'Jan',
        avatarInitials: 'J',
        bio: 'I converse a lot which has caused appointments to run over time. Feel free to add a note with conversation levels (0-3).',
        role: 'provider',
        isActive: true,
        isSelective: false,
        noShowThreshold: 3,
        enableNaughtyList: true,
        notAcceptingNewClients: false,
        cashOnly: false,
        noKidsUnder: null,
        conversationPreference: true,
        specialNotes: 'Kids haircuts take 45 minutes',
        availability: {
          monday: '9:00am-8:00pm',
          tuesday: '9:00am-8:00pm',
          wednesday: '9:00am-8:00pm',
          thursday: '9:00am-8:00pm',
          friday: '9:00am-8:00pm',
          saturday: '9:00am-7:00pm',
          sunday: '9:00am-6:00pm'
        }
      },
      {
        providerId: '5',
        email: 'dante@boondocks.com',
        firstName: 'Dante',
        lastName: 'X',
        displayName: 'Dante X',
        avatarInitials: 'D',
        bio: 'Here Wednesday through Saturday.',
        role: 'provider',
        isActive: true,
        isSelective: false,
        noShowThreshold: 3,
        enableNaughtyList: true,
        notAcceptingNewClients: false,
        cashOnly: true,
        noKidsUnder: null,
        conversationPreference: false,
        specialNotes: 'Cash only',
        availability: {
          monday: null,
          tuesday: null,
          wednesday: '9:00am-8:00pm',
          thursday: '9:00am-8:00pm',
          friday: '9:00am-8:00pm',
          saturday: '9:00am-7:00pm',
          sunday: null
        }
      },
      {
        providerId: '4',
        email: 'jenni@boondocks.com',
        firstName: 'Jenni',
        lastName: 'Rich',
        displayName: 'Jenni Rich',
        avatarInitials: 'JR',
        bio: '',
        role: 'provider',
        isActive: true,
        isSelective: false,
        noShowThreshold: 3,
        enableNaughtyList: true,
        notAcceptingNewClients: false,
        cashOnly: false,
        noKidsUnder: null,
        conversationPreference: false,
        specialNotes: '',
        availability: {
          monday: '9:00am-8:00pm',
          tuesday: '9:00am-8:00pm',
          wednesday: '9:00am-8:00pm',
          thursday: '9:00am-8:00pm',
          friday: '9:00am-8:00pm',
          saturday: '9:00am-7:00pm',
          sunday: '9:00am-6:00pm'
        }
      },
      {
        providerId: '6',
        email: 'pedro@boondocks.com',
        firstName: 'Pedro',
        lastName: 'Mora',
        displayName: 'Pedro Mora',
        avatarInitials: 'P',
        bio: '',
        role: 'provider',
        isActive: true,
        isSelective: false,
        noShowThreshold: 3,
        enableNaughtyList: true,
        notAcceptingNewClients: false,
        cashOnly: false,
        noKidsUnder: null,
        conversationPreference: false,
        specialNotes: '',
        availability: {
          monday: '9:00am-8:00pm',
          tuesday: '9:00am-8:00pm',
          wednesday: '9:00am-8:00pm',
          thursday: '9:00am-8:00pm',
          friday: '9:00am-8:00pm',
          saturday: '9:00am-7:00pm',
          sunday: '9:00am-6:00pm'
        }
      },
      {
        providerId: '7',
        email: 'michelle@boondocks.com',
        firstName: 'Michelle',
        lastName: 'Connolly',
        displayName: 'Michelle Connolly',
        avatarInitials: 'M',
        bio: 'Currently not accepting new clients or children\'s haircuts.',
        role: 'admin', // Owner
        isActive: true,
        isSelective: true, // Existing clients only
        noShowThreshold: 3,
        enableNaughtyList: true,
        notAcceptingNewClients: true,
        cashOnly: false,
        noKidsUnder: null,
        conversationPreference: false,
        specialNotes: 'Not accepting new clients',
        availability: {
          monday: null,
          tuesday: null,
          wednesday: null,
          thursday: null,
          friday: null,
          saturday: null,
          sunday: null
        }
      },
      {
        providerId: '8',
        email: 'anthony@boondocks.com',
        firstName: 'Anthony',
        lastName: 'Cortez',
        displayName: 'Anthony Cortez',
        avatarInitials: 'A',
        bio: 'Barber apprentice since 2020. Habla espanol. IG: Monzta_cutz94',
        role: 'provider',
        isActive: true,
        isSelective: false,
        noShowThreshold: 3,
        enableNaughtyList: true,
        notAcceptingNewClients: false,
        cashOnly: false,
        noKidsUnder: 6,
        conversationPreference: false,
        specialNotes: 'No kids under 6',
        availability: {
          monday: '9:00am-8:00pm',
          tuesday: '9:00am-8:00pm',
          wednesday: '9:00am-8:00pm',
          thursday: '9:00am-8:00pm',
          friday: '9:00am-8:00pm',
          saturday: '9:00am-7:00pm',
          sunday: '9:00am-6:00pm'
        }
      }
    ];
    
    // Create or update each provider with their availability
    for (const provider of providers) {
      const { availability, ...providerData } = provider;
      
      // Upsert provider account
      const result = await prisma.providerAccount.upsert({
        where: { email: provider.email },
        update: {
          ...providerData,
          passwordHash
        },
        create: {
          ...providerData,
          passwordHash
        }
      });
      
      // Create or update weekly availability
      if (availability) {
        await prisma.providerWeeklyAvailability.upsert({
          where: { providerId: provider.providerId },
          update: availability,
          create: {
            providerId: provider.providerId,
            ...availability
          }
        });
      }
      
      console.log(`✅ ${result.firstName} ${result.lastName} (${result.email})`);
      console.log(`   Role: ${result.role}`);
      if (result.bio) console.log(`   Bio: ${result.bio}`);
      if (result.specialNotes) console.log(`   Notes: ${result.specialNotes}`);
      if (result.notAcceptingNewClients) console.log(`   ⚠️  Not accepting new clients`);
      if (result.cashOnly) console.log(`   💵 Cash only`);
      if (result.noKidsUnder) console.log(`   👶 No kids under ${result.noKidsUnder}`);
      if (result.conversationPreference) console.log(`   💬 Conversation preference enabled`);
      console.log('');
    }
    
    // Initialize system settings
    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        simplybookSyncEnabled: false,
        autoSyncNewCustomers: false,
        autoSyncAppointments: false
      }
    });
    
    console.log('📊 Database Statistics:');
    const providerCount = await prisma.providerAccount.count();
    const availabilityCount = await prisma.providerWeeklyAvailability.count();
    console.log(`   ${providerCount} provider accounts`);
    console.log(`   ${availabilityCount} availability schedules`);
    console.log('\n✨ All provider accounts seeded successfully!');
    console.log('🔐 All passwords set to: bd25');
    
  } catch (error) {
    console.error('❌ Error seeding providers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedProviders();