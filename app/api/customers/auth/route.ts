import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customerManager } from '@/lib/services/customer-manager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, action, firstName, lastName, phone, conversationPreference } = body;

    if (action === 'register') {
      // Customer registration
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

      // Create customer with password
      const customer = await customerManager.createCustomer({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        conversationPreference: conversationPreference || 2,
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: customer.id,
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

      // Check if customer has password hash
      if (!customer.passwordHash) {
        return NextResponse.json(
          { error: 'Account not set up for online access. Please use booking code lookup.' },
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
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
          userId: customer.id,
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

    const customer = await customerManager.getCustomerById(decoded.userId);
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