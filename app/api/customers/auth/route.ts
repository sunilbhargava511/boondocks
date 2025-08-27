import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customerManager } from '@/lib/services/customer-manager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { email, password, action } = await req.json();

    if (action === 'register') {
      // Customer registration
      const { firstName, lastName, phone, conversationPreference } = await req.json();
      
      if (!firstName || !lastName || !email || !phone || !password) {
        return NextResponse.json(
          { error: 'All fields are required for registration' },
          { status: 400 }
        );
      }

      // Check if customer already exists
      const existingCustomer = await customerManager.getCustomerByEmail(email);
      if (existingCustomer) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create customer with password and sync to SimplyBook
      const customer = await customerManager.createCustomer({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        conversationPreference: conversationPreference || 2,
        marketingConsent: false,
        smsConsent: false,
        emailConsent: true,
        syncToSimplyBook: true, // Enable sync for new registrations
      });

      // Store password hash (we'll need to add this to the schema)
      await customerManager.setCustomerPassword(customer.id, passwordHash);

      // Generate JWT token
      const token = jwt.sign(
        { 
          customerId: customer.id,
          email: customer.email,
          role: 'customer'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return NextResponse.json({
        token,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        }
      });

    } else {
      // Customer login
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      // Find customer by email
      const customer = await customerManager.getCustomerByEmail(email.toLowerCase());
      if (!customer) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Get stored password hash
      const passwordHash = await customerManager.getCustomerPassword(customer.id);
      if (!passwordHash) {
        return NextResponse.json(
          { error: 'Account not set up for online access. Please use booking code lookup.' },
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Update last login
      await customerManager.updateCustomer(customer.id, {
        // We'll track last login in the customer record
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          customerId: customer.id,
          email: customer.email,
          role: 'customer'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return NextResponse.json({
        token,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        }
      });
    }
  } catch (error) {
    console.error('Customer auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const customer = await customerManager.getCustomerById(decoded.customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}