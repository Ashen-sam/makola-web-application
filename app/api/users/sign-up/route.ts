import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, address, phone_number, nic } = await request.json();

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        role: 'resident'
      })
      .select('user_id, username, role')
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const { data: resident, error: residentError } = await supabase
      .from('residents')
      .insert({
        user_id: user.user_id,
        name,
        address,
        phone_number,
        nic
      })
      .select('resident_id, name')
      .single();

    if (residentError) {
      await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);

      return NextResponse.json(
        { error: 'Failed to create resident profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          resident_id: resident.resident_id,
          name: resident.name
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}