const fs = require('fs');
const path = require('path');

// Arrays of sample data
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Maria',
  'William', 'Elizabeth', 'Richard', 'Jennifer', 'Thomas', 'Linda', 'Charles', 'Patricia', 'Christopher', 'Barbara',
  'Daniel', 'Susan', 'Matthew', 'Jessica', 'Anthony', 'Karen', 'Mark', 'Nancy', 'Donald', 'Betty',
  'Steven', 'Helen', 'Paul', 'Sandra', 'Andrew', 'Donna', 'Joshua', 'Carol', 'Kenneth', 'Ruth',
  'Kevin', 'Sharon', 'Brian', 'Michelle', 'George', 'Laura', 'Timothy', 'Sarah', 'Ronald', 'Kimberly',
  'Jason', 'Deborah', 'Edward', 'Dorothy', 'Jeffrey', 'Lisa', 'Ryan', 'Nancy', 'Jacob', 'Karen'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const providers = ['Jan', 'Dante X', 'Jenni Rich', 'Pedro Mora', 'Michelle Connolly', 'Anthony Cortez'];

const services = [
  'haircut', 'beard trim', 'transformation cut', 'color', 'shave', 'styling', 'wash', 'treatment'
];

const preferredDays = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

const preferredTimes = [
  'morning', 'afternoon', 'evening'
];

const tags = [
  'regular', 'vip', 'new', 'loyal', 'cash', 'existing', 'quiet', 'chatty', 'long-hair', 'color', 'adult'
];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices(array, count = 1) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join(',');
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPhone() {
  return `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

function generateCustomer(index) {
  const firstName = randomChoice(firstNames);
  const lastName = randomChoice(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@email.com`;
  const phone = randomPhone();
  const birthDate = randomDate(new Date(1960, 0, 1), new Date(2000, 11, 31));
  const conversationLevel = Math.floor(Math.random() * 4); // 0-3
  const provider = randomChoice(providers);
  const loyaltyPoints = Math.floor(Math.random() * 200);
  const totalSpent = (Math.random() * 1000).toFixed(2);
  
  const notes = [
    'Regular customer', 'New client', 'Prefers morning appointments', 'Cash preferred',
    'Loyal customer', 'No special requests', 'Chatty customer', 'Quiet customer',
    'Long hair specialty', 'Color specialist', 'Beard trim regular', 'Weekly appointments'
  ];

  return {
    'First Name': firstName,
    'Last Name': lastName,
    'Email': email,
    'Phone': phone,
    'Date of Birth': birthDate.toISOString().split('T')[0],
    'Conversation Level': conversationLevel.toString(),
    'Preferred Provider': provider,
    'Notes': randomChoice(notes),
    'Marketing Consent': Math.random() > 0.3 ? 'true' : 'false',
    'SMS Consent': Math.random() > 0.4 ? 'true' : 'false',
    'Email Consent': Math.random() > 0.2 ? 'true' : 'false',
    'Loyalty Points': loyaltyPoints.toString(),
    'Total Spent': totalSpent,
    'Preferred Days': randomChoices(preferredDays, Math.floor(Math.random() * 3) + 1),
    'Preferred Times': randomChoices(preferredTimes, Math.floor(Math.random() * 2) + 1),
    'Preferred Services': randomChoices(services, Math.floor(Math.random() * 3) + 1),
    'Allergies/Notes': Math.random() > 0.7 ? randomChoice(['Sensitive scalp', 'No ammonia', 'Allergic to certain products']) : '',
    'Special Instructions': Math.random() > 0.8 ? randomChoice(['Use organic products', 'Please use scissors only', 'Color expert needed']) : '',
    'Tags': randomChoices(tags, Math.floor(Math.random() * 3) + 1)
  };
}

// Generate 2500 customers
const customers = [];
const header = [
  'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Conversation Level',
  'Preferred Provider', 'Notes', 'Marketing Consent', 'SMS Consent', 'Email Consent',
  'Loyalty Points', 'Total Spent', 'Preferred Days', 'Preferred Times', 'Preferred Services',
  'Allergies/Notes', 'Special Instructions', 'Tags'
];

// Add header
let csvContent = header.join(',') + '\n';

console.log('Generating 2500 test customers...');

for (let i = 1; i <= 2500; i++) {
  const customer = generateCustomer(i);
  const row = header.map(field => {
    const value = customer[field] || '';
    // Escape commas and quotes in CSV
    return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
  });
  csvContent += row.join(',') + '\n';
  
  if (i % 500 === 0) {
    console.log(`Generated ${i} customers...`);
  }
}

// Ensure the test-data directory exists
const testDataDir = path.join(__dirname, '..', 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Write to file
const filePath = path.join(testDataDir, 'bulk-test-customers-2500.csv');
fs.writeFileSync(filePath, csvContent);

console.log(`✅ Generated ${filePath} with 2500 test customers`);
console.log(`📊 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
console.log('Ready for bulk import testing!');