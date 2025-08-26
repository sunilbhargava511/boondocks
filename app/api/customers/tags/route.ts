import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';

export async function POST(req: NextRequest) {
  try {
    const { customerId, tags } = await req.json();

    if (!customerId || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Missing customerId or tags array' },
        { status: 400 }
      );
    }

    await customerManager.addCustomerTags(customerId, tags);
    
    return NextResponse.json({ 
      message: 'Tags added successfully',
      customerId,
      tags
    });
  } catch (error) {
    console.error('Error adding customer tags:', error);
    return NextResponse.json(
      { error: 'Failed to add tags' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { customerId, tags } = await req.json();

    if (!customerId || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Missing customerId or tags array' },
        { status: 400 }
      );
    }

    await customerManager.replaceCustomerTags(customerId, tags);
    
    return NextResponse.json({ 
      message: 'Tags updated successfully',
      customerId,
      tags
    });
  } catch (error) {
    console.error('Error updating customer tags:', error);
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const tagName = searchParams.get('tagName');

    if (!customerId || !tagName) {
      return NextResponse.json(
        { error: 'Missing customerId or tagName' },
        { status: 400 }
      );
    }

    await customerManager.removeCustomerTag(customerId, tagName);
    
    return NextResponse.json({ 
      message: 'Tag removed successfully',
      customerId,
      tagName
    });
  } catch (error) {
    console.error('Error removing customer tag:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
}