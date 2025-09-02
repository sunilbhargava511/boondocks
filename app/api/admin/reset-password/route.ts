import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const { newPassword } = await req.json();
    
    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // In a production environment, you would want to:
    // 1. Hash the password before storing
    // 2. Use a more secure method to update environment variables
    // 3. Restart the application to pick up the new env var
    
    // For this implementation, we'll update the .env file
    try {
      const envPath = join(process.cwd(), '.env.local');
      let envContent = '';
      
      try {
        envContent = require('fs').readFileSync(envPath, 'utf8');
      } catch (e) {
        // File doesn't exist, we'll create it
        envContent = '';
      }
      
      // Update or add the ADMIN_PASSWORD line
      const lines = envContent.split('\n');
      let passwordLineFound = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('ADMIN_PASSWORD=')) {
          lines[i] = `ADMIN_PASSWORD=${newPassword}`;
          passwordLineFound = true;
          break;
        }
      }
      
      if (!passwordLineFound) {
        lines.push(`ADMIN_PASSWORD=${newPassword}`);
      }
      
      // Write back to file
      writeFileSync(envPath, lines.join('\n'));
      
      // Update the current process env (will take effect on next restart)
      process.env.ADMIN_PASSWORD = newPassword;
      
      return NextResponse.json({ 
        success: true, 
        message: 'Admin password updated successfully. Changes will take effect immediately.' 
      });
    } catch (fileError) {
      console.error('Error updating .env file:', fileError);
      return NextResponse.json(
        { error: 'Failed to update environment file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset admin password' },
      { status: 500 }
    );
  }
}