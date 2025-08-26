import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'boondocks2024';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    const isValid = password === ADMIN_PASSWORD;
    
    if (isValid) {
      // In a production app, you'd set a secure session cookie here
      return NextResponse.json({ 
        success: true, 
        message: 'Authentication successful' 
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}