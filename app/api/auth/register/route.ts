import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await customerManager.getCustomerByEmail(email.toLowerCase());
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await customerManager.createCustomer({
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone,
      passwordHash,
    });

    // Generate auth token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: customer.id,
        email: customer.email,
        role: 'customer',
        name: `${customer.firstName} ${customer.lastName}`
      },
      process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        role: 'customer'
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('✅ Customer registered successfully:', customer.email);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}