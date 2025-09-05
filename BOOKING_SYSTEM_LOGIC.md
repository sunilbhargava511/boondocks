# Boondocks Barbershop Booking System Documentation

## Overview
The Boondocks booking system is a complete appointment management platform that handles service selection, provider scheduling, time slot management, and customer data. It operates primarily from a local database with optional SimplyBook API integration for backup/sync.

## Architecture

### Data Sources
- **Primary**: Local SQLite database (Prisma ORM)
- **Optional**: SimplyBook API (can be toggled on/off via admin settings)
- **Provider Data**: Migrated from CSV files to database (6 providers with complete profiles)

### Key Components
1. **Frontend**: Next.js app with React components
2. **Backend**: Next.js API routes
3. **Database**: SQLite with Prisma ORM
4. **External Integration**: SimplyBook API (optional)

## Booking Flow

### Step 1: Service Selection
- User chooses from available services (haircuts, beard trims, combinations)
- Each service has:
  - Name and description
  - Duration (15-80 minutes)
  - Base price
  - Provider-specific pricing (if different)

### Step 2: Provider Selection
- User selects a barber or "First Available"
- Provider cards display:
  - Name and initials
  - Bio/description
  - Availability status
  - Special restrictions (e.g., "Existing Clients Only", "Cash Only")
  
#### Provider Restrictions
- **Michelle Connolly**: Not accepting new clients (existing clients only)
- **Dante X**: Cash only, Wed-Sat availability
- **Anthony Cortez**: No kids under 6
- **Jan**: Offers conversation level preference (0-3 scale)

### Step 3: Date & Time Selection
- Calendar shows weekly view (Monday-Sunday)
- Only displays days when selected provider is available
- Time slots generated every 30 minutes (9 AM - 8 PM)
- Lunch break excluded (1-2 PM)

### Step 4: Customer Information
- Required fields: First name, Last name, Email, Phone
- Optional: Notes, Conversation level (Jan only)
- System checks for existing customer by email
- Uses passwordless cookie system to remember returning customers

### Step 5: Booking Confirmation
- Creates/updates customer record
- Creates appointment record
- Displays booking confirmation with code

## Time Slot Management

### Duration-Based Blocking
The system intelligently manages time slots based on service duration:

```javascript
// When checking available slots
slotEnd = slotStart + serviceDuration * 60000

// Conflict detection
if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
  // Slot conflicts - mark as unavailable
}
```

### How It Works
1. **Service Duration Storage**
   - Each service has a defined duration (e.g., 30, 45, 60, 80 minutes)
   - Duration is stored with the appointment record

2. **Availability Calculation** (`/api/appointments/available-slots`)
   - Generates potential time slots every 30 minutes
   - For each slot, calculates: `endTime = startTime + serviceDuration`
   - Checks for conflicts with existing appointments
   - Only returns slots where full service duration fits

3. **Conflict Prevention**
   - Checks if new appointment would:
     - Start during an existing appointment
     - End during an existing appointment
     - Overlap with an existing appointment
   - Ensures adequate buffer time between appointments

### Example Scenarios

#### Scenario 1: Standard Haircut (30 min)
- Customer books 2:00 PM slot
- System blocks: 2:00 PM - 2:30 PM
- Next available slot: 2:30 PM

#### Scenario 2: Transformation Cut (45 min)
- Customer books 2:00 PM slot
- System blocks: 2:00 PM - 2:45 PM
- Next available slot: 2:45 PM (not 2:30 PM)

#### Scenario 3: Haircut + Straight Razor Shave (80 min)
- Customer books 2:00 PM slot
- System blocks: 2:00 PM - 3:20 PM
- Next available slot: 3:30 PM (next 30-min increment)

## Database Schema

### Customer Model
```prisma
model Customer {
  id                    String   @id
  email                 String   @unique
  phone                 String
  firstName             String
  lastName              String
  noShowCount          Int      @default(0)
  accountStatus        String   @default("active")
  // ... additional fields
}
```

### Appointment Model
```prisma
model Appointment {
  id               String   @id
  customerId       String
  serviceId        String
  serviceName      String
  providerId       String
  providerName     String
  appointmentDate  DateTime
  duration         Int      // in minutes
  price            Float
  status           String   // confirmed, cancelled, completed, no_show
  bookingCode      String?
  notes            String?
}
```

### ProviderAccount Model
```prisma
model ProviderAccount {
  id                String   @id
  providerId        String   @unique
  email             String   @unique
  firstName         String
  lastName          String
  displayName       String?
  bio               String?
  notAcceptingNewClients Boolean
  cashOnly          Boolean
  noKidsUnder       Int?
  conversationPreference Boolean
  // ... additional fields
}
```

### ProviderWeeklyAvailability Model
```prisma
model ProviderWeeklyAvailability {
  providerId  String
  monday      String?  // e.g., "9:00am-8:00pm"
  tuesday     String?
  wednesday   String?
  thursday    String?
  friday      String?
  saturday    String?
  sunday      String?
}
```

## Validation & Restrictions

### Customer Blocking System
1. **Naughty List Check**
   - Providers can block customers for excessive no-shows
   - System checks blocked email/phone before allowing booking
   - Blocked customers receive error message with reason

2. **Selective Provider Check**
   - Some providers (e.g., Michelle) only accept pre-approved customers
   - System checks `ProviderCustomerApproval` table
   - Non-approved customers directed to contact provider directly

3. **Age Restrictions**
   - Certain providers have age limits (e.g., Anthony - no kids under 6)
   - Enforced during booking process

### Appointment Validation
1. **Time Conflicts**
   - System prevents double-booking
   - Checks entire duration of service
   - Ensures no overlap with existing appointments

2. **Provider Availability**
   - Verifies provider works on selected day
   - Checks against `ProviderUnavailability` table
   - Respects provider-specific schedules

3. **Future Date Requirement**
   - Appointments must be in the future
   - Past dates are disabled in calendar

## API Endpoints

### Provider Management
- `GET /api/providers/public` - Public provider list for booking
- `GET /api/providers` - All provider accounts (admin)
- `POST /api/providers` - Create provider account
- `PUT /api/providers` - Update provider account

### Appointment Management
- `GET /api/appointments` - List appointments (with filters)
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/available-slots` - Get available time slots
- `PUT /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Cancel appointment

### Customer Management
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/check-email` - Check if customer exists
- `PUT /api/customers/[id]` - Update customer

### SimplyBook Integration
- `GET /api/admin/simplybook-sync` - Get sync settings
- `PUT /api/admin/simplybook-sync` - Update sync settings
- `POST /api/admin/simplybook-sync` - Perform manual sync

## Special Features

### Passwordless Booking
- Uses secure HTTP-only cookies
- Remembers customer information for 30 days
- Auto-fills returning customer data
- No password required for booking

### Conversation Preference (Jan Only)
- Customers can specify conversation level (0-3)
- 0 = Minimal conversation
- 3 = Full conversation
- Helps Jan manage appointment timing

### First Available Provider
- System finds next available barber
- Considers service duration
- Respects provider restrictions
- Optimizes for earliest available slot

### No-Show Tracking
- Automatic tracking of missed appointments
- Configurable threshold per provider (default: 3)
- Automatic addition to naughty list when threshold exceeded
- Providers can manually block/unblock customers

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# SimplyBook API (Optional)
NEXT_PUBLIC_SIMPLYBOOK_COMPANY_LOGIN="boondocks"
NEXT_PUBLIC_SIMPLYBOOK_API_KEY="your-api-key"

# Admin Access
ADMIN_PASSWORD="bd25"

# Email Service (Optional)
RESEND_API_KEY="your-resend-key"
FROM_EMAIL="noreply@boondocks.com"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_SHOP_NAME="Boondocks Barbershop"
NEXT_PUBLIC_SHOP_ADDRESS="1152 Arroyo Ave, San Carlos, CA 94070"
NEXT_PUBLIC_SHOP_PHONE="(650) 597-2454"
```

## Deployment

### Local Development
```bash
npm run dev           # Start development server
npx prisma studio    # Open database GUI
npm run seed         # Seed database with providers
```

### Production (Railway)
```bash
railway run npm run seed    # Seed production database
railway logs               # View deployment logs
railway redeploy --yes     # Force redeploy
```

## Security Features

1. **Password Protection**
   - Admin dashboard requires password
   - Provider accounts have individual passwords
   - All passwords hashed with bcrypt

2. **Data Validation**
   - Email format validation
   - Phone number format validation
   - Future date requirement for bookings
   - Service duration validation

3. **Access Control**
   - Provider-specific customer approvals
   - Admin-only endpoints protected
   - Customer blocking system

## Future Enhancements

### Planned Features
- [ ] Email confirmations (when email service configured)
- [ ] SMS reminders
- [ ] Payment integration
- [ ] Recurring appointments
- [ ] Waitlist management
- [ ] Customer loyalty rewards
- [ ] Provider commission tracking
- [ ] Advanced analytics dashboard

### SimplyBook Sync Improvements
- [ ] Real-time bidirectional sync
- [ ] Conflict resolution for dual bookings
- [ ] Automatic customer migration
- [ ] Appointment history import

## Troubleshooting

### Common Issues

1. **Empty Provider Dropdown**
   - Run seed script: `npm run seed`
   - Check database connection
   - Verify provider accounts exist

2. **No Available Time Slots**
   - Check provider availability settings
   - Verify no provider unavailability blocks
   - Check service duration fits in available windows

3. **Booking Fails**
   - Verify customer not on naughty list
   - Check provider restrictions
   - Ensure time slot still available

### Debug Commands
```bash
# Check database contents
npx prisma studio

# View provider accounts
railway run npx prisma db seed

# Check API responses
curl http://localhost:3000/api/providers/public

# Test appointment conflict
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"customerId": "...", "serviceId": "...", ...}'
```

## Support

For issues or questions:
- Phone: (650) 597-2454
- Address: 1152 Arroyo Ave, San Carlos, CA 94070
- GitHub: https://github.com/sunilbhargava511/boondocks

---

*Last Updated: September 2025*
*Version: 1.0.0*